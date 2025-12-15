"use client";

import { login, signup } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">

      {/* Back to home */}
      <Link
        href="/"
        className="mb-8 inline-flex items-center text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to home
      </Link>

      {/* Brand */}
      <div className="flex items-center gap-3 mb-6">
        <div className=" flex items-center justify-center">
         <Image src="/logo.svg" alt="ClockDeck" width={124} height={24} />
        </div>
      </div>

      {/* Auth Card */}
      <Card className="w-full max-w-2xl bg-white border border-slate-200 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="hidden md:flex items-center justify-center bg-indigo-50 p-8 rounded-l-lg">
            <div className="space-y-4 text-center">
              <Clock className="mx-auto h-12 w-12 text-indigo-600" />
              <h3 className="text-lg font-semibold">Welcome back</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">Sign in to manage properties, employees, and payroll</p>
            </div>
          </div>

          <CardContent className="p-8">
            <form className="space-y-4">

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-slate-700">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@company.com"
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-slate-700">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Login */}
            <Button
              formAction={login}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm"
            >
              Sign in
            </Button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-500">or</span>
              </div>
            </div>

            {/* Signup prompt */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Don't have an account?</p>
              <Button
                formAction={signup}
                variant="outline"
                className="mt-3 w-full h-11 border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Create account
              </Button>
            </div>
          </form>

          {/* Forgot password */}
          <div className="text-center mt-4">
            <Link
              href="/forgot-password"
              className="text-sm text-indigo-600 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
        </CardContent>
        </div>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-xs text-slate-500">
        © {new Date().getFullYear()} ClockDeck. All rights reserved.
      </p>
    </div>
  );
}
