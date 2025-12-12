"use client";

import { login, signup } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Clock } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-925 to-slate-900 flex flex-col items-center justify-center px-4">
      {/* Back to Homepage */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center text-slate-300 hover:text-slate-100 text-sm"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to home
      </Link>

      {/* Logo */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
          <Clock className="h-5 w-5 text-emerald-400" />
        </div>
        <span className="text-xl font-semibold tracking-tight text-slate-50">
          ClockDeck
        </span>
      </div>

      {/* Auth Card */}
      <Card className="w-full max-w-md bg-slate-900/80 border-slate-800/70 shadow-lg shadow-emerald-500/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-center text-slate-50 text-xl">
            Admin Login
          </CardTitle>
          <p className="text-center text-slate-400 text-sm mt-1">
            Sign in to access your dashboard
          </p>
        </CardHeader>

        <CardContent>
          <form className="space-y-4">
            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-row sm:flex-row gap-3 pt-2">
              <Button
                formAction={login}
                className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-semibold"
              >
                {loading ? "Logging in..." : "Log in"}
              </Button>
                </div>
                <div className="flex flex-row sm:flex-row gap-3 pt-2">
              <Button
                formAction={signup}
                variant="outline"
                className="w-full border-slate-700 text-black hover:bg-slate-800 hover:text-white font-semibold"
              >
                Sign up
              </Button>
            </div>
          </form>

          {/* Forgot password */}
          <div className="text-center mt-4">
            <Link
              href="/forgot-password"
              className="text-sm text-emerald-300 hover:text-emerald-200"
            >
              Forgot your password?
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="mt-6 text-xs text-slate-600">
        © {new Date().getFullYear()} ClockDeck. All rights reserved.
      </p>
    </div>
  );
}
