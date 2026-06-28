"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setCargando(true);

    const res = await fetch("/api/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Error al registrarse");
      setCargando(false);
    } else {
      router.push("/login?registered=true");
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
          Crea tu cuenta y empieza a gestionar<br />tus máquinas y clientes<br />desde cualquier lugar.
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

          <h2 className="text-2xl font-medium text-gray-900 mb-1">Crear cuenta</h2>
          <p className="text-sm text-gray-500 mb-8">Rellena tus datos para registrarte</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nombre completo</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Carlos García"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50"
              />
            </div>

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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repite la contraseña"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#0B1120] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50"
            >
              {cargando ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="text-[#00C2FF]">Inicia sesión</a>
          </p>
        </div>
      </div>
    </div>
  );
}