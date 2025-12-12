import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Clock,
  Building2,
  Users,
  CalendarClock,
  FileText,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 overflow-hidden">

      {/* ================= BACKGROUND DECOR ================= */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-200/50 to-transparent blur-3xl" />
        <div className="absolute top-[520px] right-[-160px] h-[420px] w-[420px] rounded-full bg-gradient-to-br from-violet-200/40 to-transparent blur-3xl" />
      </div>

      {/* ================= NAVBAR ================= */}
      <header className="relative z-20 bg-slate-50/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="ClockDeck Logo" width={132} height={32} />
          </div>

          <div className="flex items-center gap-4 text-sm">
            <Link href="/auth/login" className="text-slate-600 hover:text-slate-900">
              Sign in
            </Link>
            <Button
              asChild
              className="h-9 px-4 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              <Link href="/auth/login">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative z-10 pt-24 pb-32">
        <div className="mx-auto max-w-6xl px-6 grid gap-14 lg:grid-cols-2 items-center">

          {/* TEXT */}
          <div className="text-center lg:text-left">
            <h1 className="text-[42px] sm:text-[52px] leading-[1.05] font-semibold tracking-tight">
              Time tracking for
              <span className="block text-indigo-600">
                modern property teams
              </span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 max-w-xl mx-auto lg:mx-0">
              Track employee hours, manage properties, and export timesheets —
              all from a clean, friendly interface your team actually enjoys using.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center lg:items-start gap-4">
              <Button
                asChild
                className="h-11 px-6 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                <Link href="/auth/login">
                  Open dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Link
                href="#how"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                See how it works →
              </Link>
            </div>
          </div>

          {/* ILLUSTRATION */}
          <div className="flex justify-center lg:justify-end">
            <Image
              src="clock.svg"
              alt="ClockDeck dashboard illustration"
              width={520}
              height={420}
              className="w-full max-w-md"
            />
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how" className="relative z-10 py-28">
        <div className="mx-auto max-w-6xl px-6 grid gap-16 md:grid-cols-2">

          {/* LEFT */}
          <div>
            <p className="text-sm uppercase tracking-wide text-indigo-600 mb-4">
              How it works
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Simple, structured, reliable
            </h2>
            <p className="mt-4 text-slate-600 max-w-md">
              Designed to mirror real-world workflows — not spreadsheets.
            </p>
            <div className="flex top-4 p-6">
            <Image
              src="clockinout.svg"
              alt="ClockDeck dashboard illustration"
              width={320}
              height={320}
              className="w-full max-w-md"
            />
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-8">
            <Feature icon={Building2} title="Properties first" desc="Each property has its own employees and shifts." />
            <Feature icon={Users} title="Employee management" desc="Add staff once, assign anywhere instantly." />
            <Feature icon={Clock} title="Accurate clocking" desc="Clock in and out using system time." />
            <Feature icon={CalendarClock} title="Clear timesheets" desc="View entries by date, property, or person." />
            <Feature icon={FileText} title="Clean exports" desc="Printable, payroll-ready reports." />
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="relative z-10 py-28 bg-white border-t border-slate-200">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h3 className="text-3xl font-semibold">
            Ready to make time tracking painless?
          </h3>
          <p className="mt-4 text-slate-600">
            Set up in minutes. No training required.
          </p>

          <Button
            asChild
            className="mt-8 h-11 px-8 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            <Link href="/auth/login">Get started</Link>
          </Button>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="relative z-10 bg-slate-50 border-t border-slate-200 py-12">
        <div className="mx-auto max-w-7xl px-6 grid gap-8 md:grid-cols-3 text-sm">

          <div>
            <p className="font-medium">ClockDeck</p>
            <p className="mt-2 text-slate-600">
              Friendly, accurate time tracking for property teams.
            </p>
          </div>

          <div className="space-y-2 text-slate-600">
            <p className="font-medium text-slate-900">Product</p>
            <p>Clock in / out</p>
            <p>Timesheets</p>
            <p>Reports</p>
          </div>

          <div className="space-y-2 text-slate-600">
            <p className="font-medium text-slate-900">Company</p>
            <p>Privacy</p>
            <p>Security</p>
            <p>Support</p>
          </div>

        </div>

        <div className="mt-10 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} ClockDeck. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

/* ================= FEATURE ROW ================= */

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: any;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className="h-11 w-11 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
        <Icon className="h-5 w-5 text-indigo-600" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-slate-600">{desc}</p>
      </div>
    </div>
  );
}
