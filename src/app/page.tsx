import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  LineChart,
  Lock,
  ShieldCheck,
  Users,
} from "lucide-react";

/* =======================
   SEO METADATA
======================= */
export const metadata = {
  title: "ClockDeck – Payroll-Ready Time Tracking",
  description:
    "ClockDeck helps teams track time, calculate overtime automatically, approve payroll, and export finance-ready files — without spreadsheets.",
};

/* =======================
   DATA
======================= */

const features = [
  {
    icon: Clock,
    title: "Accurate time tracking",
    desc: "Employees clock in and out with property and shift context.",
  },
  {
    icon: Users,
    title: "Multi-property support",
    desc: "Manage multiple locations without duplicating employees.",
  },
  {
    icon: Lock,
    title: "Locked pay periods",
    desc: "Prevent edits after approval to avoid payroll disputes.",
  },
  {
    icon: LineChart,
    title: "Live insights",
    desc: "Track overtime risk and active shifts in real time.",
  },
  {
    icon: FileSpreadsheet,
    title: "Payroll-ready exports",
    desc: "Clean CSV exports built for finance systems.",
  },
  {
    icon: ShieldCheck,
    title: "Audit & compliance",
    desc: "Role-based access with full approval history.",
  },
];

const steps = [
  {
    icon: Clock,
    title: "Review timesheets",
    desc: "Scan employee hours in one consolidated weekly view.",
  },
  {
    icon: CalendarClock,
    title: "Approve hours",
    desc: "One-click approvals for regular and overtime hours.",
  },
  {
    icon: FileSpreadsheet,
    title: "Lock & export",
    desc: "Lock payroll and export finance-ready files instantly.",
  },
];

/* =======================
   PAGE
======================= */

export default function LandingPage() {
  return (
    <main className="bg-white text-slate-900">
      {/* ================= Header ================= */}
      <header className="sticky top-0 z-30 border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="ClockDeck" width={120} height={24} />
          </Link>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#features" className="text-slate-600 hover:text-slate-900">
              Features
            </a>
            <a href="#workflow" className="text-slate-600 hover:text-slate-900">
              How it works
            </a>
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
              Dashboard
            </Link>
            <Link href="/auth/login" className="text-slate-600 hover:text-slate-900">
              Login
            </Link>
            <Button asChild>
              <Link href="/auth/login">Start free</Link>
            </Button>
          </nav>

          <Button asChild className="md:hidden">
            <Link href="/auth/login">Start</Link>
          </Button>
        </div>
      </header>

      {/* ================= Hero ================= */}
      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-16 md:grid-cols-2 items-center">
          {/* Left */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
              Payroll-ready time tracking
            </p>

            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Payroll completed in{" "}
              <span className="text-indigo-600">minutes</span>, not hours
            </h1>

            <p className="mt-6 text-lg text-slate-600 max-w-xl">
              ClockDeck automatically calculates regular and overtime hours,
              simplifies approvals, and exports payroll-ready files — without
              spreadsheets.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/auth/login">
                  Open dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <a
                href="#workflow"
                className="self-center text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Watch how it works →
              </a>
            </div>

            <p className="mt-6 text-xs text-slate-500">
              Trusted by growing teams • No credit card required
            </p>
          </div>

          {/* Right */}
          <div className="relative">
            <div className="rounded-xl border bg-slate-50 p-4 shadow-sm">
              <Image
                src="/payroll.jpg"
                alt="Payroll dashboard preview"
                width={720}
                height={480}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================= Features ================= */}
      <section id="features" className="bg-slate-50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold">
              Efficiency and accuracy at the core
            </h2>
            <p className="mt-4 text-slate-600">
              Everything you need to go from clock-in to payroll export.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border bg-white p-6 transition hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Workflow ================= */}
      <section id="workflow" className="px-6 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-semibold">How it works</h2>
          <p className="mt-4 text-slate-600">
            A simple workflow designed for busy teams.
          </p>

          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title}>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white">
                  {i + 1}
                </div>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="px-6 py-24 bg-indigo-600 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-semibold">
            Ready to simplify payroll?
          </h2>
          <p className="mt-4 text-indigo-100">
            Join teams saving hours every week with automated payroll prep.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg" variant="secondary">
              <Link href="/auth/login">
                Start free trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ================= Footer ================= */}
      <footer className="border-t px-6 py-12 text-sm text-slate-600">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
          <div>
            <Image src="/logo.svg" alt="ClockDeck" width={120} height={24} />
            <p className="mt-2">
              Payroll-ready time tracking for modern teams.
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-900">Product</p>
            <p>Time tracking</p>
            <p>Timesheets</p>
            <p>Payroll exports</p>
          </div>

          <div>
            <p className="font-semibold text-slate-900">Company</p>
            <p>Privacy</p>
            <p>Security</p>
            <p>Support</p>
          </div>
        </div>

        <div className="mt-10 text-center text-xs">
          © {new Date().getFullYear()} ClockDeck. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
