"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Menu,
  Clock,
  Building2,
  Users,
  Timer,
  CalendarClock,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* CONFIG                                                                     */
/* -------------------------------------------------------------------------- */

const nav = [
  { label: "Overview", href: "/dashboard", icon: Clock, exact: true },
  { label: "Clock", href: "/dashboard/clock", icon: Timer },
  { label: "Properties", href: "/dashboard/properties", icon: Building2 },
  { label: "Employees", href: "/dashboard/employees", icon: Users },
  { label: "Timesheet", href: "/dashboard/timesheet", icon: CalendarClock },
];

/* -------------------------------------------------------------------------- */
/* SIDEBAR                                                                    */
/* -------------------------------------------------------------------------- */

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const supabase = createClient();

  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  if (!mounted) return null; // ✅ prevents hydration mismatch

  return (
    <>
      {/* ===================== DESKTOP ===================== */}
      <aside
        className={cn(
          "hidden md:flex h-screen flex-col bg-white transition-all duration-300 shadow-sm",
          collapsed ? "w-20" : "w-64"
        )}
        aria-label="Main navigation"
      >
        {/* Logo + Toggle */}
        <div className="flex items-center justify-between px-4 py-5 border-b">
          <Image
            src="/logo.svg"
            alt="ClockDeck"
            width={collapsed ? 36 : 120}
            height={24}
            priority
          />

          <Button
            variant="ghost"
            size="icon"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed(!collapsed)}
            className="hover:bg-slate-100"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                  active
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-inner"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <div className="h-8 w-8 flex items-center justify-center rounded-md bg-white border shadow-xs">
                  <Icon className="h-4 w-4" />
                </div>
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          {!collapsed && (
            <div className="mb-2">
              <p className="text-xs text-slate-500">Signed in as</p>
              <p className="text-sm font-medium text-slate-800 truncate">
                {userEmail}
              </p>
            </div>
          )}

          <Button
            onClick={handleSignOut}
            variant="outline"
            className="mt-3 w-full flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && "Sign out"}
          </Button>
        </div>
      </aside>

      {/* ===================== MOBILE ===================== */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-white">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-72 p-0">
            <div className="flex items-center gap-2 px-4 py-4 border-b">
              <Image
                src="/logo.svg"
                alt="ClockDeck"
                width={120}
                height={24}
                priority
              />
            </div>

            <ScrollArea className="h-[75vh] px-3 py-4">
              <nav className="space-y-1">
                {nav.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                        active
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </ScrollArea>

            <div className="border-t px-4 py-4">
              <p className="text-xs text-slate-500">Signed in as</p>
              <p className="text-sm font-medium text-slate-800 truncate">
                {userEmail}
              </p>

              <Button
                onClick={handleSignOut}
                variant="outline"
                className="mt-4 w-full flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
