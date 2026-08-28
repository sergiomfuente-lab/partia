"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wrench, Save, PowerOff, Power } from "lucide-react";

export default function EditarMaquinaForm({ maquina }: { maquina: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    marca:          maquina.marca,
    modelo:         maquina.modelo,
    numeroDeSerie:  maquina.numeroDeSerie,
    matricula:      maquina.matricula ?? "",
    horasIniciales: String(maquina.horasIniciales),
    horasActuales:  String(maquina.horasActuales),
    estado:         maquina.estado,
    observaciones:  maquina.observaciones ?? "",
  });

  const estaActiva = form.estado !== "inactivo";

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.marca.trim())         { setError("La marca es obligatoria."); return; }
    if (!form.modelo.trim())        { setError("El modelo es obligatorio."); return; }
    if (!form.numeroDeSerie.trim()) { setError("El número de serie es obligatorio."); return; }

    setLoading(true);
    const res = await fetch(`/api/maquinas/${maquina.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        horasIniciales: parseFloat(form.horasIniciales) || 0,
        horasActuales:  parseFloat(form.horasActuales) || 0,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar los cambios.");
      setLoading(false);
      return;
    }

    router.push(`/maquinas/${maquina.id}`);
  };

  const handleToggleEstado = async () => {
    setToggling(true);
    setError("");

    const nuevoEstado = estaActiva ? "inactivo" : "activo";

    const res = await fetch(`/api/maquinas/${maquina.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado }),
    });

    if (!res.ok) {
      setError("Error al cambiar el estado de la máquina.");
      setToggling(false);
      return;
    }

    set("estado", nuevoEstado);
    setToggling(false);
  };

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href={`/maquinas/${maquina.id}`}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Editar máquina</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {maquina.marca} {maquina.modelo} · {maquina.cliente.nombre}
            </p>
          </div>
        </div>

        {/* Acciones en cabecera */}
        <div className="flex items-center gap-3">
          <Link
            href={`/maquinas/${maquina.id}`}
            className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancelar
          </Link>
          <button
            form="editar-maquina-form"
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save size={15} />
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      <form id="editar-maquina-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">

          {/* Columna izquierda — formulario principal */}
          <div className="col-span-2 space-y-6">

            {/* Datos de la máquina */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Wrench size={15} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-700">Datos de la máquina</h2>
              </div>

              <div className="p-5 space-y-4">
                {/* Marca + Modelo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Marca <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
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
                      value={form.modelo}
                      onChange={(e) => set("modelo", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                    />
                  </div>
                </div>

                {/* Nº serie + Estado */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Número de serie <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.numeroDeSerie}
                      onChange={(e) => set("numeroDeSerie", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Estado actual
                    </label>
                    <div className={`px-3 py-2.5 text-sm rounded-lg border font-medium ${
                      form.estado === "activo"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : form.estado === "en_reparacion"
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-gray-100 border-gray-200 text-gray-500"
                    }`}>
                      {form.estado === "activo" ? "Activo" :
                       form.estado === "en_reparacion" ? "En reparación" : "Inactivo"}
                    </div>
                  </div>
                </div>

                {/* Matrícula */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Matrícula / Nº parque
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 1234-ABC"
                    value={form.matricula}
                    onChange={(e) => set("matricula", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white font-mono"
                  />
                </div>

                {/* Horas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Horas iniciales
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={form.horasIniciales}
                      onChange={(e) => set("horasIniciales", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Horas actuales
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={form.horasActuales}
                      onChange={(e) => set("horasActuales", e.target.value)}
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
                    rows={4}
                    value={form.observaciones}
                    onChange={(e) => set("observaciones", e.target.value)}
                    placeholder="Notas internas sobre la máquina..."
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
          </div>

          {/* Columna derecha — info y acciones */}
          <div className="space-y-4">

            {/* Cliente */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Cliente</div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-sm font-bold shrink-0">
                  {maquina.cliente.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">{maquina.cliente.nombre}</div>
                  <div className="text-xs text-gray-400 mt-0.5">No se puede cambiar</div>
                </div>
              </div>
            </div>

            {/* Estado */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Estado de la máquina</div>
              <div className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium mb-4 ${
                form.estado === "activo"
                  ? "bg-green-50 text-green-700"
                  : form.estado === "en_reparacion"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-gray-100 text-gray-500"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  form.estado === "activo" ? "bg-green-500" :
                  form.estado === "en_reparacion" ? "bg-amber-500" : "bg-gray-400"
                }`} />
                {form.estado === "activo" ? "Activo" :
                 form.estado === "en_reparacion" ? "En reparación" : "Inactivo"}
              </div>
              <p className="text-xs text-gray-400 mb-4">
                {estaActiva
                  ? "La máquina está operativa. Puedes desactivarla si el cliente ya no la tiene."
                  : "La máquina está inactiva. Actívala para que esté disponible para nuevas órdenes."}
              </p>
              <button
                type="button"
                onClick={handleToggleEstado}
                disabled={toggling}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  estaActiva
                    ? "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {estaActiva ? <PowerOff size={14} /> : <Power size={14} />}
                {toggling ? "Cambiando..." : estaActiva ? "Desactivar máquina" : "Activar máquina"}
              </button>
            </div>

            {/* Resumen horas */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Resumen de horas</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Horas iniciales</span>
                  <span className="font-medium text-gray-800">{form.horasIniciales} h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Horas actuales</span>
                  <span className="font-medium text-gray-800">{form.horasActuales} h</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
                  <span className="text-gray-500">Horas acumuladas</span>
                  <span className="font-semibold text-[#00C2FF]">
                    {(parseFloat(form.horasActuales) - parseFloat(form.horasIniciales) || 0).toFixed(1)} h
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}