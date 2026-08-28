"use client";

import { FormEvent, useState } from "react";
import { requestFirstLoginOtp, verifyFirstLoginOtp, ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

export default function FirstLoginSecurityModal() {
  const { refreshUser } = useAuth();

  const [step, setStep] = useState<"credentials" | "otp">("credentials");

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [credentialsError, setCredentialsError] = useState("");
  const [credentialsLoading, setCredentialsLoading] = useState(false);

  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resending, setResending] = useState(false);

  async function handleSubmitCredentials(e: FormEvent) {
    e.preventDefault();
    setCredentialsError("");

    if (newPassword !== confirmPassword) {
      setCredentialsError("Nova lozinka i potvrda lozinke se ne poklapaju.");
      return;
    }
    if (newPassword.length < 6) {
      setCredentialsError("Lozinka mora imati najmanje 6 karaktera.");
      return;
    }

    setCredentialsLoading(true);
    try {
      await requestFirstLoginOtp(newEmail.trim(), newPassword);
      setStep("otp");
    } catch (err) {
      setCredentialsError(err instanceof ApiError ? err.message : "Greška pri slanju koda.");
    } finally {
      setCredentialsLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setOtpError("");
    setOtpLoading(true);
    try {
      await verifyFirstLoginOtp(otpCode.trim());
      // Uspjeh — osvježi globalni user u AuthProvider-u. Kada requires_credential_update
      // postane false, roditeljska komponenta (Dashboard) prestaje renderovati ovaj modal.
      await refreshUser();
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : "Neispravan ili istekao kod.");
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResendMessage("");
    setOtpError("");
    try {
      await requestFirstLoginOtp(newEmail.trim(), newPassword);
      setResendMessage("Novi kod je poslan.");
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : "Greška pri slanju koda.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">Obavezan sigurnosni korak</p>
        <h2 className="mt-1 text-xl font-bold text-gray-900">
          {step === "credentials" ? "Postavite svoje podatke" : "Potvrdite email"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {step === "credentials"
            ? "Trenutno koristite privremenu lozinku. Prije nastavka postavite svoj vlastiti email i lozinku."
            : `Poslali smo 6-cifreni kod na ${newEmail}. Unesite ga da potvrdite svoj nalog.`}
        </p>

        {step === "credentials" ? (
          <form onSubmit={handleSubmitCredentials} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Novi Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                autoFocus
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Nova Lozinka</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Potvrdi Lozinku</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            {credentialsError && <p className="text-sm text-red-600">{credentialsError}</p>}
            <button
              type="submit"
              disabled={credentialsLoading}
              className="w-full rounded-lg bg-black py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              {credentialsLoading ? "Slanje koda..." : "Pošalji kod za potvrdu"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">6-cifreni kod</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
                className="w-full rounded-lg border px-3 py-2.5 text-center text-lg tracking-[0.5em] outline-none focus:ring-1 focus:ring-black"
                placeholder="000000"
              />
            </div>
            {otpError && <p className="text-sm text-red-600">{otpError}</p>}
            {resendMessage && <p className="text-sm text-emerald-600">{resendMessage}</p>}
            <button
              type="submit"
              disabled={otpLoading || otpCode.length !== 6}
              className="w-full rounded-lg bg-black py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              {otpLoading ? "Provjera..." : "Potvrdi Kod"}
            </button>
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setStep("credentials")}
                className="text-gray-500 hover:text-gray-800"
              >
                ← Izmijeni email/lozinku
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="font-medium text-gray-700 hover:text-black disabled:opacity-50"
              >
                {resending ? "Slanje..." : "Pošalji ponovo kod"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
