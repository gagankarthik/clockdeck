"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Clock, Timer, Building2 } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                TYPES                                        */
/* -------------------------------------------------------------------------- */

type Employee = {
  id: string;
  name: string;
  pin: number;
  property_id: string;
  properties?: { name: string } | null;
};

type ActiveEntry = {
  id: string;
  employee_id: string;
  property_id: string;
  clock_in: string;
};

/* -------------------------------------------------------------------------- */
/*                               MAIN PAGE                                     */
/* -------------------------------------------------------------------------- */

export default function ClockPage() {
  const supabase = createClient();

  const [pin, setPin] = useState("");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [activeEntry, setActiveEntry] = useState<ActiveEntry | null>(null);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState("");

  /* 🚀 AUTO-LOGOUT TIMER STATE */
  const [autoLogoutTimer, setAutoLogoutTimer] = useState<number | null>(null);

  /* LIVE TIMER */
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                        🚀 AUTO LOGOUT LOGIC (10 sec)                        */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!employee) return;

    // Start 10-sec auto logout
    const timer = setTimeout(() => {
      resetToPinScreen();
    }, 10000);

    setAutoLogoutTimer(timer as unknown as number);

    return () => clearTimeout(timer);
  }, [employee]);

  function resetToPinScreen() {
    setEmployee(null);
    setActiveEntry(null);
    setPin("");
    setError("");
  }

  /* -------------------------------------------------------------------------- */
  /*                          LOGIN WITH PIN                                    */
  /* -------------------------------------------------------------------------- */

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const { data: emp } = await supabase
      .from("employees")
      .select("id, name, pin, property_id, properties(name)")
      .eq("pin", pin)
      .maybeSingle();

    if (!emp) {
      setError("Invalid PIN");
      return;
    }

    const fixedEmp: Employee = {
      ...emp,
      properties: Array.isArray((emp as any).properties)
        ? (emp as any).properties[0] || null
        : emp.properties,
    };

    setEmployee(fixedEmp);

    const { data: active } = await supabase
      .from("time_entries")
      .select("*")
      .eq("employee_id", emp.id)
      .is("clock_out", null)
      .maybeSingle();

    setActiveEntry(active || null);
  }

  /* -------------------------------------------------------------------------- */
  /*                               ACTIONS                                      */
  /* -------------------------------------------------------------------------- */

  async function handleClockIn() {
    if (!employee) return;

    await supabase.from("time_entries").insert({
      employee_id: employee.id,
      property_id: employee.property_id,
      clock_in: new Date().toISOString(),
    });

    const { data: active } = await supabase
      .from("time_entries")
      .select("*")
      .eq("employee_id", employee.id)
      .is("clock_out", null)
      .maybeSingle();

    setActiveEntry(active || null);

    /* 🚀 Reset auto logout countdown after clock in */
    restartAutoLogoutTimer();
  }

  async function handleClockOut() {
    if (!activeEntry) return;

    await supabase
      .from("time_entries")
      .update({ clock_out: new Date().toISOString() })
      .eq("id", activeEntry.id);

    setActiveEntry(null);

    /* 🚀 Restart auto logout countdown after clock out */
    restartAutoLogoutTimer();
  }

  /* -------------------------------------------------------------------------- */
  /*                🚀 Restart the 10-sec Auto Logout Timer                     */
  /* -------------------------------------------------------------------------- */

  function restartAutoLogoutTimer() {
    if (autoLogoutTimer) clearTimeout(autoLogoutTimer);

    const timer = setTimeout(() => resetToPinScreen(), 10000);
    setAutoLogoutTimer(timer as unknown as number);
  }

  /* -------------------------------------------------------------------------- */
  /*                       1-MINUTE MINIMUM CLOCK OUT RULE                      */
  /* -------------------------------------------------------------------------- */

  function canClockOut() {
    if (!activeEntry) return false;
    const start = new Date(activeEntry.clock_in).getTime();
    return now - start >= 60000; // 60 seconds
  }

  /* -------------------------------------------------------------------------- */
  /*                          TIMER DISPLAY                                     */
  /* -------------------------------------------------------------------------- */

  function renderElapsed() {
    if (!activeEntry) return "";

    const start = new Date(activeEntry.clock_in).getTime();
    const diff = now - start;

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    return `${h}h ${m}m ${s}s`;
  }

  /* -------------------------------------------------------------------------- */
  /*                               UI RENDERING                                 */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-6 max-w-md mx-auto mt-10">

      <h1 className="text-2xl font-semibold text-center">Employee Clock Portal</h1>

      {/* ------------------------- PIN LOGIN SCREEN ------------------------- */}
      {!employee && (
        <Card className="p-6 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-center text-xl">Enter PIN</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                className="border p-4 rounded-lg w-full text-lg text-center tracking-widest"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
              />

              {error && <p className="text-red-600 text-center">{error}</p>}

              <Button className="w-full py-4 text-lg rounded-xl" type="submit">
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* -------------------- EMPLOYEE CLOCK IN/OUT SCREEN ------------------ */}
      {employee && (
        <Card className="p-6 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl text-center">Welcome, {employee.name}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">

            <div className="flex justify-center items-center gap-2 text-slate-600">
              <Building2 size={18} />
              <span>{employee.properties?.name || "Unknown property"}</span>
            </div>

            {activeEntry ? (
              <div className="text-blue-700 flex justify-center items-center gap-2 text-lg">
                <Timer size={20} />
                <span>Elapsed: {renderElapsed()}</span>
              </div>
            ) : (
              <div className="flex justify-center">
                <Badge className="w-fit">Idle</Badge>
              </div>
            )}

            <div>
              {!activeEntry ? (
                <Button
                  className="w-full py-4 text-lg rounded-xl flex gap-2"
                  onClick={handleClockIn}
                >
                  <Clock size={20} />
                  Clock In
                </Button>
              ) : (
                <Button
                  disabled={!canClockOut()}
                  className={`w-full py-4 text-lg rounded-xl flex gap-2 ${
                    canClockOut()
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                  onClick={() => canClockOut() && handleClockOut()}
                >
                  <Clock size={20} />
                  {canClockOut() ? "Clock Out" : "Wait 1 minute..."}
                </Button>
              )}
            </div>

            {/* 🚀 AUTO-LOGOUT COUNTDOWN MESSAGE */}
            <p className="text-center text-sm text-slate-500">
              You will be logged out automatically in 10 seconds.
            </p>

          </CardContent>
        </Card>
      )}
    </div>
  );
}
