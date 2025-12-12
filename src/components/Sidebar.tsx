"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import {
  Menu,
  Clock,
  Building2,
  Users,
  Timer,
  CalendarClock,
  LogOut,
} from "lucide-react";

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const supabase = createClient();

  /** Sign Out **/
  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  /** Navigation Items **/
  const nav = [
    { label: "Overview", href: "/dashboard", icon: Clock },
    { label: "Clock", href: "/dashboard/clock", icon: Timer },
    { label: "Properties", href: "/dashboard/properties", icon: Building2 },
    { label: "Employees", href: "/dashboard/employees", icon: Users },
    { label: "Timesheet", href: "/dashboard/timesheet", icon: CalendarClock },
  ];

  return (
    <>
      {/* -------------------- DESKTOP SIDEBAR -------------------- */}
      <aside className="hidden md:flex w-64 border-r bg-white flex-col h-screen py-6 px-4 shadow-sm">

        {/* Logo */}
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className=" flex justify-center items-center">
           <Image
              src="/logo.svg"
              alt="ClockDeck Logo"
              width={124}
              height={24}
            />
           </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200",
                  active
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-6 border-t bg-gray-50 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Signed in as</p>
          <p className="font-medium text-slate-800 mb-4">{userEmail}</p>

          <Button
            variant="destructive"
            className="w-full flex gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* -------------------- MOBILE NAVBAR -------------------- */}
      <div className="md:hidden p-3 border-b bg-white flex items-center justify-between shadow-sm">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="p-0 w-72 bg-white">
            {/* Mobile Header */}
            <div className="p-4 border-b text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              ClockDeck
            </div>

            <ScrollArea className="h-[78vh] p-3">
              <nav className="flex flex-col gap-1">
                {nav.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition",
                        active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
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

            {/* Mobile Footer */}
            <div className="border-t p-4">
              <p className="text-xs text-slate-500 mb-1">Signed in as:</p>
              <p className="font-medium text-slate-800">{userEmail}</p>

              <Button
                variant="outline"
                className="w-full mt-4 flex gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
