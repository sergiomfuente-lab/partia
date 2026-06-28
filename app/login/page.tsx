"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email o contraseña incorrectos");
      setCargando(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-[#0B1120] flex-col items-center justify-center p-12">
        <svg width="64" height="64" viewBox="0 0 56 56">
          <polygon points="28,4 50,16 50,40 28,52 6,40 6,16" fill="none" stroke="#00C2FF" strokeWidth="2"/>
          <polygon points="28,14 42,22 42,34 28,42 14,34 14,22" fill="#00C2FF" opacity="0.12"/>
          <polygon points="28,14 42,22 42,34 28,42 14,34 14,22" fill="none" stroke="#00C2FF" strokeWidth="1" opacity="0.5"/>
          <circle cx="28" cy="4" r="3" fill="#00C2FF"/>
          <circle cx="50" cy="16" r="3" fill="#00C2FF"/>
          <circle cx="50" cy="40" r="3" fill="#00C2FF"/>
          <circle cx="28" cy="52" r="3" fill="#00C2FF"/>
          <circle cx="6" cy="40" r="3" fill="#00C2FF"/>
          <circle cx="6" cy="16" r="3" fill="#00C2FF"/>
          <circle cx="28" cy="28" r="7" fill="#00C2FF"/>
          <circle cx="28" cy="28" r="3.5" fill="#0B1120"/>
        </svg>
        <h1 className="text-white text-4xl font-bold mt-4 tracking-wide">Partia</h1>
        <p className="text-[#00C2FF] text-xs tracking-[5px] mt-1">GESTIÓN · TECNOLOGÍA</p>
        <p className="text-[#4a6080] text-sm mt-10 text-center leading-relaxed">
          Gestiona tus máquinas,<br />clientes y facturas<br />desde cualquier lugar.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex flex-col items-center mb-8">
            <svg width="48" height="48" viewBox="0 0 56 56">
              <polygon points="28,4 50,16 50,40 28,52 6,40 6,16" fill="none" stroke="#00C2FF" strokeWidth="2"/>
              <circle cx="28" cy="28" r="7" fill="#00C2FF"/>
              <circle cx="28" cy="28" r="3.5" fill="#0B1120"/>
            </svg>
            <h1 className="text-[#0B1120] text-2xl font-bold mt-2">Partia</h1>
          </div>

          <h2 className="text-2xl font-medium text-gray-900 mb-1">Bienvenido</h2>
          <p className="text-sm text-gray-500 mb-8">Accede a tu cuenta Partia</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos@taller.es"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={verPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setVerPassword(!verPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                >
                  {verPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>

            <div className="text-right">
              <a href="#" className="text-xs text-[#00C2FF]">¿Olvidaste tu contraseña?</a>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#0B1120] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50"
            >
              {cargando ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            ¿No tienes cuenta?{" "}
            <a href="/registro" className="text-[#00C2FF]">Regístrate</a>
          </p>
        </div>
      </div>
    </div>
  );
}