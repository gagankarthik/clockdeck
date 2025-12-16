"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Clock,
  Timer,
  Building2,
  User,
  AlertTriangle,
  Moon,
  Sun,
} from "lucide-react";

/* ================= TYPES ================= */

type Property = {
  id: string;
  name: string;
};

type Employee = {
  id: string;
  name: string;
  pin: number;
  property_id: string;
  is_active: boolean;
};

type ActiveEntry = {
  id: string;
  clock_in: string;
};

/* ================= PAGE ================= */

export default function ClockPage() {
  const supabase = createClient();

  const [dark, setDark] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [activeEntry, setActiveEntry] = useState<ActiveEntry | null>(null);

  const [pin, setPin] = useState("");
  const [now, setNow] = useState(new Date());
  const [elapsed, setElapsed] = useState("00:00");

  const [error, setError] = useState<string | null>(null);

  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ================= LIVE CLOCK ================= */

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ================= LOAD PROPERTY ================= */

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      const { data: prop } = await supabase
        .from("properties")
        .select("id, name")
        .eq("created_by", data.user.id)
        .maybeSingle();

      if (prop) setProperty(prop);
    })();
  }, []);

  /* ================= ELAPSED TIMER ================= */

  useEffect(() => {
    if (!activeEntry) return;

    const t = setInterval(() => {
      const diff = Date.now() - new Date(activeEntry.clock_in).getTime();
      const m = String(Math.floor(diff / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setElapsed(`${m}:${s}`);
    }, 1000);

    return () => clearInterval(t);
  }, [activeEntry]);

  /* ================= AUTO RESET ================= */

  function reset() {
    setEmployee(null);
    setActiveEntry(null);
    setPin("");
    setError(null);
    setElapsed("00:00");
  }

  function startAutoReset() {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    logoutTimer.current = setTimeout(reset, 10000);
  }

  /* ================= PIN VERIFY ================= */

  useEffect(() => {
    if (pin.length === 4 && property) verifyPin();
  }, [pin, property]);

  async function verifyPin() {
    if (!property) return;

    const { data: emp } = await supabase
      .from("employees")
      .select("id,name,pin,property_id,is_active")
      .eq("pin", pin)
      .eq("property_id", property.id)
      .maybeSingle();

    if (!emp) return setError("Invalid PIN");
    if (!emp.is_active) return setError("Employee inactive");

    setEmployee(emp);

    const { data: active } = await supabase
      .from("time_entries")
      .select("id, clock_in")
      .eq("employee_id", emp.id)
      .is("clock_out", null)
      .maybeSingle();

    setActiveEntry(active || null);
    startAutoReset();
  }

  /* ================= CLOCK ACTIONS ================= */

  async function clockIn() {
    if (!employee || !property) return;

    await supabase.from("time_entries").insert({
      employee_id: employee.id,
      property_id: property.id,
      clock_in: new Date().toISOString(),
    });

    const { data } = await supabase
      .from("time_entries")
      .select("id, clock_in")
      .eq("employee_id", employee.id)
      .is("clock_out", null)
      .maybeSingle();

    setActiveEntry(data || null);
    startAutoReset();
  }

  async function clockOut() {
    if (!activeEntry) return;

    await supabase
      .from("time_entries")
      .update({ clock_out: new Date().toISOString() })
      .eq("id", activeEntry.id);

    reset();
  }

  /* ================= UI ================= */

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-dvh flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">

        {/* Dark toggle */}
        <button
          onClick={() => setDark(!dark)}
          className="absolute top-4 right-4 p-2 rounded bg-white dark:bg-slate-800 shadow"
        >
          {dark ? <Sun /> : <Moon />}
        </button>

        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl p-6 shadow-xl text-center">

          {/* Clock */}
          <div className="flex items-center justify-center gap-2 text-4xl font-mono mb-6 dark:text-white">
            <Clock className="text-slate-500 dark:text-white" />
            {now.toLocaleTimeString()}
          </div>

          {!employee ? (
            <>
              <h2 className="mb-4 text-slate-600 dark:text-slate-300">
                {property?.name || "Loading..."}
              </h2>

              <input
                autoFocus
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center text-3xl tracking-[0.6em] py-3 rounded border dark:bg-slate-700"
                placeholder="••••"
              />

              {error && (
                <div className="flex items-center justify-center gap-2 mt-4 text-red-500">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-4">
                <User className="mx-auto mb-1 text-emerald-500" />
                <h2 className="text-lg font-semibold">{employee.name}</h2>
                <div className="flex justify-center items-center gap-1 text-sm text-slate-500">
                  <Building2 className="h-4 w-4" />
                  {property?.name}
                </div>
              </div>

              {activeEntry ? (
                <>
                  <Timer className="mx-auto text-blue-500 mb-1" />
                  <div className="text-3xl font-mono text-blue-600 mb-4">
                    {elapsed}
                  </div>
                  <button
                    onClick={clockOut}
                    className="w-full py-3 rounded bg-red-600 text-white font-semibold"
                  >
                    Clock Out
                  </button>
                </>
              ) : (
                <button
                  onClick={clockIn}
                  className="w-full py-3 rounded bg-emerald-600 text-white font-semibold"
                >
                  Clock In
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
