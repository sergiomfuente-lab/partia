"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, FileText, UserPlus, Wrench as WrenchIcon } from "lucide-react";

type Cliente = { id: string; nombre: string; nombreComercial?: string | null };

type Maquina = {
  id: string;
  marca: string;
  modelo: string;
  numeroDeSerie: string;
  horasActuales: number;
};

export default function TecnicoNuevaOrdenForm({
  clientes,
  tecnicoId,
}: {
  clientes:  Cliente[];
  tecnicoId: string;
}) {
  const router = useRouter();

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // ---- Cliente: existente o nuevo ----
  const [modoCliente, setModoCliente] = useState<"existente" | "nuevo">("existente");
  const [clienteId, setClienteId]     = useState("");
  const [clienteNuevo, setClienteNuevo] = useState({
    nombre: "", telefono: "", cif: "", direccionFacturacion: "",
  });

  // ---- Máquina: existente o nueva ----
  // Si el cliente es nuevo no puede tener máquinas registradas todavía,
  // así que forzamos el alta de una máquina nueva en ese caso.
  const [modoMaquina, setModoMaquina] = useState<"existente" | "nueva">("existente");
  const mostrarMaquinaNueva = modoCliente === "nuevo" || modoMaquina === "nueva";

  const [maquinas, setMaquinas]   = useState<Maquina[]>([]);
  const [maquinaId, setMaquinaId] = useState("");
  const [cargandoMaquinas, setCargandoMaquinas] = useState(false);
  const [maquinaNueva, setMaquinaNueva] = useState({
    marca: "", modelo: "", numeroDeSerie: "", horasIniciales: "",
  });

  const [otros, setOtros] = useState({
    direccionReparacion: "",
    trabajosRealizados:  "",
    observaciones:       "",
  });

  useEffect(() => {
    if (modoCliente !== "existente" || !clienteId) { setMaquinas([]); return; }
    setCargandoMaquinas(true);
    fetch(`/api/maquinas?clienteId=${clienteId}&estado=activo`)
      .then((r) => r.json())
      .then((data) => setMaquinas(Array.isArray(data) ? data : []))
      .finally(() => setCargandoMaquinas(false));
  }, [modoCliente, clienteId]);

  const setOtro = (field: string, value: string) =>
    setOtros((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (modoCliente === "existente" && !clienteId) {
      setError("Selecciona un cliente."); return;
    }
    if (modoCliente === "nuevo" && !clienteNuevo.nombre.trim()) {
      setError("El nombre del cliente nuevo es obligatorio."); return;
    }
    if (!mostrarMaquinaNueva && !maquinaId) {
      setError("Selecciona una máquina."); return;
    }
    if (mostrarMaquinaNueva && (!maquinaNueva.marca.trim() || !maquinaNueva.modelo.trim() || !maquinaNueva.numeroDeSerie.trim())) {
      setError("Marca, modelo y número de serie de la máquina son obligatorios."); return;
    }

    setLoading(true);
    try {
      // 1. Cliente: crear si hace falta
      let clienteFinalId = clienteId;
      if (modoCliente === "nuevo") {
        const resCliente = await fetch("/api/clientes", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre:               clienteNuevo.nombre,
            telefono:             clienteNuevo.telefono || undefined,
            cif:                  clienteNuevo.cif || undefined,
            direccionFacturacion: clienteNuevo.direccionFacturacion || undefined,
          }),
        });
        if (!resCliente.ok) {
          const data = await resCliente.json().catch(() => ({}));
          throw new Error(data.error ?? "No se pudo crear el cliente.");
        }
        const cliente = await resCliente.json();
        clienteFinalId = cliente.id;
      }

      // 2. Máquina: crear si hace falta
      let maquinaFinalId = maquinaId;
      if (mostrarMaquinaNueva) {
        const resMaquina = await fetch("/api/maquinas", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            marca:          maquinaNueva.marca,
            modelo:         maquinaNueva.modelo,
            numeroDeSerie:  maquinaNueva.numeroDeSerie,
            horasIniciales: maquinaNueva.horasIniciales ? Number(maquinaNueva.horasIniciales) : 0,
            clienteId:      clienteFinalId,
          }),
        });
        if (!resMaquina.ok) {
          const data = await resMaquina.json().catch(() => ({}));
          throw new Error(data.error ?? "No se pudo crear la máquina.");
        }
        const maquina = await resMaquina.json();
        maquinaFinalId = maquina.id;
      }

      // 3. Orden
      const resOrden = await fetch("/api/ordenes", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: clienteFinalId,
          maquinaId: maquinaFinalId,
          tecnicoId,
          ...otros,
        }),
      });
      if (!resOrden.ok) {
        const data = await resOrden.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al crear la orden.");
      }
      const orden = await resOrden.json();
      router.push(`/tecnico/ordenes/${orden.id}`);
    } catch (err: any) {
      setError(err.message ?? "Ha ocurrido un error.");
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/tecnico"
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 active:bg-gray-50"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Nueva orden</h1>
          <p className="text-xs text-gray-400">Se asignará automáticamente a ti</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cliente */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Cliente <span className="text-red-400">*</span>
            </label>
            <div className="flex bg-gray-100 rounded-lg p-1 mb-3">
              <button
                type="button"
                onClick={() => setModoCliente("existente")}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                  modoCliente === "existente" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                Existente
              </button>
              <button
                type="button"
                onClick={() => setModoCliente("nuevo")}
                className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-md transition-colors ${
                  modoCliente === "nuevo" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                <UserPlus size={14} /> Cliente nuevo
              </button>
            </div>

            {modoCliente === "existente" ? (
              <select
                value={clienteId}
                onChange={(e) => { setClienteId(e.target.value); setMaquinaId(""); setModoMaquina("existente"); }}
                className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-[#00C2FF]"
              >
                <option value="">Selecciona un cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombreComercial || c.nombre}</option>
                ))}
              </select>
            ) : (
              <div className="space-y-2.5">
                <input
                  type="text" placeholder="Nombre del cliente *"
                  value={clienteNuevo.nombre}
                  onChange={(e) => setClienteNuevo((p) => ({ ...p, nombre: e.target.value }))}
                  className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#00C2FF]"
                />
                <input
                  type="tel" placeholder="Teléfono"
                  value={clienteNuevo.telefono}
                  onChange={(e) => setClienteNuevo((p) => ({ ...p, telefono: e.target.value }))}
                  className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#00C2FF]"
                />
                <input
                  type="text" placeholder="CIF / NIF (si lo tienes a mano)"
                  value={clienteNuevo.cif}
                  onChange={(e) => setClienteNuevo((p) => ({ ...p, cif: e.target.value }))}
                  className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#00C2FF]"
                />
                <input
                  type="text" placeholder="Dirección de facturación"
                  value={clienteNuevo.direccionFacturacion}
                  onChange={(e) => setClienteNuevo((p) => ({ ...p, direccionFacturacion: e.target.value }))}
                  className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#00C2FF]"
                />
                <p className="text-xs text-gray-400">
                  Los datos que falten (razón social, CIF, forma de pago...) se pueden completar luego desde la oficina.
                </p>
              </div>
            )}
          </div>

          {/* Máquina */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                Máquina <span className="text-red-400">*</span>
              </label>
              {modoCliente === "existente" && clienteId && (
                <button
                  type="button"
                  onClick={() => setModoMaquina(modoMaquina === "existente" ? "nueva" : "existente")}
                  className="flex items-center gap-1 text-xs font-medium text-[#00C2FF]"
                >
                  <WrenchIcon size={12} />
                  {modoMaquina === "existente" ? "Máquina nueva" : "Elegir existente"}
                </button>
              )}
            </div>

            {!mostrarMaquinaNueva ? (
              <>
                <select
                  value={maquinaId}
                  onChange={(e) => setMaquinaId(e.target.value)}
                  disabled={!clienteId || cargandoMaquinas}
                  className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-[#00C2FF] disabled:opacity-50"
                >
                  <option value="">
                    {!clienteId
                      ? "Primero selecciona un cliente"
                      : cargandoMaquinas
                        ? "Cargando máquinas..."
                        : "Selecciona una máquina..."}
                  </option>
                  {maquinas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.marca} {m.modelo} — {m.numeroDeSerie} ({m.horasActuales}h)
                    </option>
                  ))}
                </select>
                {clienteId && !cargandoMaquinas && maquinas.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1.5">Este cliente no tiene máquinas activas.</p>
                )}
              </>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text" placeholder="Marca *"
                    value={maquinaNueva.marca}
                    onChange={(e) => setMaquinaNueva((p) => ({ ...p, marca: e.target.value }))}
                    className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#00C2FF]"
                  />
                  <input
                    type="text" placeholder="Modelo *"
                    value={maquinaNueva.modelo}
                    onChange={(e) => setMaquinaNueva((p) => ({ ...p, modelo: e.target.value }))}
                    className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#00C2FF]"
                  />
                </div>
                <input
                  type="text" placeholder="Número de serie *"
                  value={maquinaNueva.numeroDeSerie}
                  onChange={(e) => setMaquinaNueva((p) => ({ ...p, numeroDeSerie: e.target.value }))}
                  className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#00C2FF]"
                />
                <input
                  type="number" min="0" step="0.5" placeholder="Horas actuales (opcional)"
                  value={maquinaNueva.horasIniciales}
                  onChange={(e) => setMaquinaNueva((p) => ({ ...p, horasIniciales: e.target.value }))}
                  className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#00C2FF]"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              <MapPin size={11} className="inline mr-1" />
              Dirección de reparación
            </label>
            <input
              type="text"
              placeholder="Calle, ciudad..."
              value={otros.direccionReparacion}
              onChange={(e) => setOtro("direccionReparacion", e.target.value)}
              className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#00C2FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              <FileText size={11} className="inline mr-1" />
              Trabajos a realizar
            </label>
            <textarea
              rows={4}
              placeholder="Describe el motivo de la visita..."
              value={otros.trabajosRealizados}
              onChange={(e) => setOtro("trabajosRealizados", e.target.value)}
              className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg bg-white resize-none focus:outline-none focus:border-[#00C2FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Observaciones internas
            </label>
            <textarea
              rows={2}
              placeholder="Notas internas..."
              value={otros.observaciones}
              onChange={(e) => setOtro("observaciones", e.target.value)}
              className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg bg-white resize-none focus:outline-none focus:border-[#00C2FF]"
            />
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
          className="w-full bg-[#0B1120] text-white rounded-lg py-3 text-sm font-medium disabled:opacity-50 active:opacity-80"
        >
          {loading ? "Creando orden..." : "Crear orden"}
        </button>
      </form>
    </div>
  );
}
