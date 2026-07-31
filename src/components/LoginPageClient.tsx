"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Logo } from "./Logo";
import { LoginForm, RegisterForm } from "./AuthModal";

export function LoginPageClient() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  // LoginForm reloads the page on successful sign-in (to refresh the
  // session everywhere), so once the reload comes back authenticated
  // we forward on to the original destination.
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(redirectTo);
    }
  }, [status, redirectTo, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          {mode === "login" ? (
            <LoginForm onSuccess={() => {}} onSwitch={() => setMode("register")} />
          ) : (
            <RegisterForm onSuccess={() => setMode("login")} onSwitch={() => setMode("login")} />
          )}
        </div>
      </div>
    </div>
  );
}
