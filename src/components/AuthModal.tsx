"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { X, Eye, EyeOff } from "lucide-react";
import { Logo } from "./Logo";

export function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          {mode === "login" ? (
            <LoginForm onSuccess={onClose} onSwitch={() => setMode("register")} />
          ) : (
            <RegisterForm onSuccess={() => setMode("login")} onSwitch={() => setMode("login")} />
          )}
        </div>
      </div>
    </div>
  );
}

export function LoginForm({ onSuccess, onSwitch }: { onSuccess: () => void; onSwitch: () => void }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid mobile number/email or password");
      return;
    }
    onSuccess();
    window.location.reload();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-center text-sm text-gray-500">
        Login with your mobile number / email &amp; password
      </p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mobile Number / Email
        </label>
        <input
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <p className="text-right text-xs text-brand-green mt-1 cursor-pointer">Forgot password?</p>
      </div>
      {error && <p className="text-sm text-brand-red">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-semibold py-2.5 rounded transition-colors disabled:opacity-60"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
      <p className="text-center text-sm text-gray-500">
        Or
        <br />
        Don&apos;t have any account?{" "}
        <button type="button" onClick={onSwitch} className="text-brand-green font-medium underline">
          Register
        </button>
      </p>
    </form>
  );
}

export function RegisterForm({ onSuccess, onSwitch }: { onSuccess: () => void; onSwitch: () => void }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    businessName: "",
    businessType: "BUSINESS",
    businessLocation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-center text-sm text-gray-500">Create your Bulk Supply account</p>
      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="First Name"
          value={form.firstName}
          onChange={(e) => update("firstName", e.target.value)}
          required
          className="border border-gray-300 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green"
        />
        <input
          placeholder="Last Name"
          value={form.lastName}
          onChange={(e) => update("lastName", e.target.value)}
          required
          className="border border-gray-300 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green"
        />
      </div>
      <input
        placeholder="Email"
        type="email"
        value={form.email}
        onChange={(e) => update("email", e.target.value)}
        required
        className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green"
      />
      <input
        placeholder="Contact Number"
        value={form.phone}
        onChange={(e) => update("phone", e.target.value)}
        required
        className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green"
      />
      <input
        placeholder="Password"
        type="password"
        value={form.password}
        onChange={(e) => update("password", e.target.value)}
        required
        className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green"
      />

      <div className="border-t border-gray-100 pt-3 mt-1">
        <p className="text-xs font-semibold text-gray-500 mb-2">
          Your Business Account (optional — you can add this later too)
        </p>
        <div className="space-y-3">
          <input
            placeholder="Business Name e.g. Seven Mart"
            value={form.businessName}
            onChange={(e) => update("businessName", e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.businessType}
              onChange={(e) => update("businessType", e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green text-sm"
            >
              <option value="BUSINESS">Business</option>
              <option value="INDIVIDUAL">Individual</option>
            </select>
            <input
              placeholder="Location e.g. Male'"
              value={form.businessLocation}
              onChange={(e) => update("businessLocation", e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-brand-red">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-semibold py-2.5 rounded transition-colors disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Register"}
      </button>
      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="text-brand-green font-medium underline">
          Login
        </button>
      </p>
    </form>
  );
}
