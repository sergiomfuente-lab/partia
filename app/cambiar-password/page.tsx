"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Save, Eye, EyeOff } from "lucide-react";

export default function CambiarPasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    passwordNueva:    "",
    passwordConfirma: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [verNueva, setVerNueva]       = useState(false);
  const [verConfirma, setVerConfirma] = useState(false);

  const setField = (f: string, v: string) =>
    setForm((prev) => ({ ...prev, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.passwordNueva.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (form.passwordNueva !== form.passwordConfirma) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/cambiar-password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ passwordNueva: form.passwordNueva }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al cambiar la contraseña.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {/* Icono */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#0B1120] rounded-2xl flex items-center justify-center">
              <Lock size={28} className="text-[#00C2FF]" />
            </div>
          </div>

          <h1 className="text-xl font-semibold text-gray-900 text-center mb-1">
            Cambia tu contraseña
          </h1>
          <p className="text-sm text-gray-400 text-center mb-8">
            Por seguridad debes establecer una nueva contraseña antes de continuar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={verNueva ? "text" : "password"}
                  value={form.passwordNueva}
                  onChange={(e) => setField("passwordNueva", e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setVerNueva(!verNueva)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {verNueva ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  type={verConfirma ? "text" : "password"}
                  value={form.passwordConfirma}
                  onChange={(e) => setField("passwordConfirma", e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setVerConfirma(!verConfirma)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {verConfirma ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#0B1120] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer mt-2"
            >
              <Save size={15} />
              {loading ? "Guardando..." : "Establecer nueva contraseña"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}