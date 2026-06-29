"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wrench, Save } from "lucide-react";

type Cliente = { id: string; nombre: string; razonSocial: string | null };

export default function NuevaMaquinaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteIdParam = searchParams.get("clienteId"); // permite preseleccionar cliente desde ficha

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    clienteId:     clienteIdParam ?? "",
    marca:         "",
    modelo:        "",
    numeroDeSerie: "",
    horasIniciales: "0",
    observaciones: "",
  });

  useEffect(() => {
    fetch("/api/clientes").then((r) => r.json()).then(setClientes);
  }, []);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.clienteId) { setError("Selecciona un cliente."); return; }
    if (!form.marca.trim()) { setError("La marca es obligatoria."); return; }
    if (!form.modelo.trim()) { setError("El modelo es obligatorio."); return; }
    if (!form.numeroDeSerie.trim()) { setError("El número de serie es obligatorio."); return; }

    setLoading(true);
    const res = await fetch("/api/maquinas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        horasIniciales: parseFloat(form.horasIniciales) || 0,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al crear la máquina.");
      setLoading(false);
      return;
    }

    const maquina = await res.json();
    router.push(`/maquinas/${maquina.id}`);
  };

  return (
    <div className="p-8 max-w-2xl">
      {/* Cabecera */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/maquinas"
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Nueva máquina</h1>
          <p className="text-sm text-gray-400 mt-0.5">Rellena los datos de la máquina</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección: Datos principales */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Wrench size={15} className="text-blue-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-700">Datos de la máquina</h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Cliente */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Cliente <span className="text-red-400">*</span>
              </label>
              <select
                value={form.clienteId}
                onChange={(e) => set("clienteId", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-gray-700"
              >
                <option value="">Selecciona un cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}{c.razonSocial ? ` — ${c.razonSocial}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Marca + Modelo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Marca <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Kone, Liebherr, Toyota..."
                  value={form.marca}
                  onChange={(e) => set("marca", e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Modelo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: CXT 32, LTM 1050..."
                  value={form.modelo}
                  onChange={(e) => set("modelo", e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                />
              </div>
            </div>

            {/* Nº serie + Horas iniciales */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Número de serie <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: SN-2024-00123"
                  value={form.numeroDeSerie}
                  onChange={(e) => set("numeroDeSerie", e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Horas iniciales
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  value={form.horasIniciales}
                  onChange={(e) => set("horasIniciales", e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                />
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Observaciones
              </label>
              <textarea
                rows={3}
                placeholder="Notas internas sobre la máquina..."
                value={form.observaciones}
                onChange={(e) => set("observaciones", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white resize-none"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/maquinas"
            className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50"
          >
            <Save size={15} />
            {loading ? "Guardando..." : "Guardar máquina"}
          </button>
        </div>
      </form>
    </div>
  );
}