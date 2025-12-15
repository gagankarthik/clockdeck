import { ReactNode } from "react";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    // 🔒 App shell: fixed viewport, no page scroll
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* Sidebar (fixed, no scroll) */}
      <Sidebar userEmail={user.email!} />

      {/* Main content (ONLY this scrolls) */}
      <main className="flex-1 h-full overflow-y-auto">
        <div className="p-4 md:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
