"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Clock,
  Timer,
  Building2,
  User,
  AlertTriangle,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* PAGE */
/* -------------------------------------------------------------------------- */

export default function ClockPage() {
  const supabase = createClient();

  const [property, setProperty] = useState<Property | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [activeEntry, setActiveEntry] = useState<ActiveEntry | null>(null);

  const [pin, setPin] = useState("");
  const [now, setNow] = useState(new Date());
  const [elapsed, setElapsed] = useState("00:00");

  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const logoutTimer = useRef<NodeJS.Timeout | null>(null);

  /* -------------------------------------------------------------------------- */
  /* LIVE CLOCK */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* -------------------------------------------------------------------------- */
  /* LOAD PROPERTY */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    async function loadProperty() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("properties")
        .select("id, name")
        .eq("created_by", user.id)
        .maybeSingle();

      if (data) setProperty(data);
    }

    loadProperty();
  }, []);

  /* -------------------------------------------------------------------------- */
  /* ELAPSED TIMER */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!activeEntry) return;

    const interval = setInterval(() => {
      const diff = Date.now() - new Date(activeEntry.clock_in).getTime();
      const m = String(Math.floor(diff / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setElapsed(`${m}:${s}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeEntry]);

  /* -------------------------------------------------------------------------- */
  /* AUTO LOGOUT */
  /* -------------------------------------------------------------------------- */

  function startAutoLogout() {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    logoutTimer.current = setTimeout(reset, 10000);
  }

  function reset() {
    setEmployee(null);
    setActiveEntry(null);
    setPin("");
    setError(null);
    setElapsed("00:00");
  }

  /* -------------------------------------------------------------------------- */
  /* PIN VERIFY */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (pin.length === 4 && property) verifyPin();
  }, [pin, property]);

  // Realtime: listen for entries for this employee and update activeEntry
  useEffect(() => {
    if (!employee) return;

    const channel = supabase
      .channel(`employee_time_${employee.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "time_entries", filter: `employee_id=eq.${employee.id}` },
        (payload) => {
          const ev = payload.eventType;
          const newRow = payload.new as any;
          const oldRow = payload.old as any;

          // If there's an active row (clock_out is null), set it; otherwise clear
          if (newRow && newRow.clock_out == null) {
            setActiveEntry({ id: newRow.id, clock_in: newRow.clock_in });
            startAutoLogout();
          } else if (ev === "UPDATE" && newRow && newRow.clock_out != null) {
            // someone clocked out
            setActiveEntry(null);
            reset();
          } else if (ev === "DELETE" && oldRow) {
            setActiveEntry(null);
            reset();
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee]);

  async function verifyPin() {
    if (!property) return;

    const { data: emp } = await supabase
      .from("employees")
      .select("id, name, pin, property_id, is_active")
      .eq("pin", pin)
      .eq("property_id", property.id)
      .maybeSingle();

    if (!emp) return triggerError("Invalid PIN");
    if (!emp.is_active) return triggerError("Employee inactive");

    setEmployee(emp);

    const { data: active } = await supabase
      .from("time_entries")
      .select("id, clock_in")
      .eq("employee_id", emp.id)
      .is("clock_out", null)
      .maybeSingle();

    setActiveEntry(active || null);
    startAutoLogout();
  }

  function triggerError(msg: string) {
    setError(msg);
    setShake(true);
    setPin("");
    setTimeout(() => setShake(false), 350);
  }

  /* -------------------------------------------------------------------------- */
  /* CLOCK ACTIONS */
  /* -------------------------------------------------------------------------- */

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
    startAutoLogout();
  }

  async function clockOut() {
    if (!activeEntry) return;

    await supabase
      .from("time_entries")
      .update({ clock_out: new Date().toISOString() })
      .eq("id", activeEntry.id);

    reset();
  }

  /* -------------------------------------------------------------------------- */
  /* UI */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="h-dvh w-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4 overflow-hidden">
      <div
        className={`w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl mx-auto
          ${shake ? "animate-shake" : ""}
          ${activeEntry ? "animate-pulse-glow" : ""}
        `}
      >
        {/* REAL TIME CLOCK */}
            <div className="flex items-center justify-center gap-3 text-5xl font-mono tracking-tight mb-6 text-slate-900">
              <Clock className="h-7 w-7 text-slate-500" />
              <div className="leading-none">{now.toLocaleTimeString()}</div>
            </div>

        {!employee ? (
          <>
            <h2 className="text-lg mb-5 text-slate-600">
              {property?.name || "Loading..."}
            </h2>

            <input
              autoFocus
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-full text-center text-3xl tracking-[0.6em] py-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
              placeholder="••••"
            />

            {error && (
              <div className="flex items-center justify-center gap-2 text-red-600 mt-4 text-sm">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}
          </>
        ) : (
          <>
            {/* EMPLOYEE INFO */}
            <div className="flex flex-col items-center gap-1 mb-4">
              <User className="h-6 w-6 text-emerald-600" />
              <h2 className="text-xl font-semibold text-slate-900">
                {employee.name}
              </h2>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Building2 className="h-4 w-4" />
                {property?.name}
              </div>
            </div>

            {activeEntry ? (
              <>
                {/* TIMER */}
                <div className="flex flex-col items-center mb-5">
                  <Timer className="h-6 w-6 text-blue-500 mb-1" />
                  <div className="text-4xl font-mono tracking-widest text-blue-600">
                    {elapsed}
                  </div>
                  <span className="mt-1 text-xs text-emerald-600 font-medium">
                    CLOCKED IN
                  </span>
                </div>

                <button
                  onClick={clockOut}
                  className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-lg font-semibold transition shadow-sm"
                >
                  Clock Out
                </button>
              </>
            ) : (
              <button
                onClick={clockIn}
                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold transition shadow-sm"
              >
                Clock In
              </button>
            )}
          </>
        )}
      </div>

      {/* ANIMATIONS */}
      <style jsx>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }
        .animate-shake {
          animation: shake 0.35s;
        }

        @keyframes glow {
          0% { box-shadow: 0 0 0 rgba(16,185,129,0.3); }
          50% { box-shadow: 0 0 25px rgba(16,185,129,0.7); }
          100% { box-shadow: 0 0 0 rgba(16,185,129,0.3); }
        }
        .animate-pulse-glow {
          animation: glow 2s infinite;
        }
      `}</style>
    </div>
  );
}
