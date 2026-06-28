"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NuevoClientePage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    nif: "",
    email: "",
    telefono: "",
    tipo: "empresa",
    direccion: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError("");

    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Error al crear el cliente");
      setCargando(false);
    } else {
      router.push("/clientes");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-[#0B1120] flex flex-col p-4 fixed h-full">
        <div className="flex items-center gap-2 mb-8 pb-4 border-b border-[#1e2d42]">
          <svg width="24" height="24" viewBox="0 0 56 56">
            <polygon points="28,4 50,16 50,40 28,52 6,40 6,16" fill="none" stroke="#00C2FF" strokeWidth="2.5"/>
            <circle cx="28" cy="28" r="7" fill="#00C2FF"/>
            <circle cx="28" cy="28" r="3.5" fill="#0B1120"/>
          </svg>
          <span className="text-white font-bold text-base tracking-wide">Partia</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          <a href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#6a8aaa] hover:text-white">Dashboard</a>
          <a href="/clientes" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-[#162030] text-[#00C2FF]">Clientes</a>
          <a href="/maquinas" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#6a8aaa] hover:text-white">Máquinas</a>
          <a href="/partes" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#6a8aaa] hover:text-white">Partes</a>
          <a href="/facturas" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#6a8aaa] hover:text-white">Facturas</a>
          <a href="/compras" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#6a8aaa] hover:text-white">Compras</a>
          <a href="/configuracion" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#6a8aaa] hover:text-white">Configuración</a>
        </nav>
      </aside>

      <main className="ml-56 flex-1 p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Volver</button>
          <h1 className="text-lg font-medium text-gray-900">Nuevo cliente</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nombre o razón social</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Transportes Pérez S.L." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50"/>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">NIF / CIF</label>
              <input name="nif" value={form.nif} onChange={handleChange} required placeholder="B-12345678" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50"/>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tipo</label>
              <select name="tipo" value={form.tipo} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50">
                <option value="empresa">Empresa</option>
                <option value="autonomo">Autónomo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="contacto@empresa.es" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50"/>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="+34 612 345 678" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50"/>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Dirección</label>
              <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Calle Industria 28, Madrid" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50"/>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => router.back()} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-500 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="submit" disabled={cargando} className="flex-1 bg-[#0B1120] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#162030] disabled:opacity-50">
                {cargando ? "Guardando..." : "Guardar cliente"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}