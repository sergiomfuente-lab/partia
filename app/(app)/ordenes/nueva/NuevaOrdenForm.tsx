"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ClipboardList, Plus, Trash2,
  Wrench, Save, MapPin, FileText, Package,
} from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";

type Cliente = {
  id: string;
  nombre: string;
  precioHoraEspecial: number | null;
  precioPorKmEspecial: number | null;
};

type Maquina = {
  id: string;
  marca: string;
  modelo: string;
  numeroDeSerie: string;
  horasActuales: number;
};

type TipoServicio = {
  id: string;
  nombre: string;
  unidad: string;
};

type Tecnico = {
  id: string;
  nombre: string;
};

type LineaEstandar = {
  _key:           string;
  fecha:          string;
  tipoServicioId: string;
  cantidad:       number;
  precio:         number;
  descripcion:    string;
};

type LineaLibre = {
  _key:        string;
  descripcion: string;
  cantidad:    number;
  precio:      number;
};

type LineaRepuesto = {
  _key:        string;
  referencia:  string;
  descripcion: string;
  cantidad:    number;
  precioCoste: number;
  precioVenta: number;
};

const hoy = () => new Date().toISOString().split("T")[0];
const uid = () => Math.random().toString(36).slice(2, 9);

export default function NuevaOrdenForm({
  clientes,
  tiposServicio,
  tecnicos,
  precioHoraDefault,
  precioPorKmDefault,
}: {
  clientes:           Cliente[];
  tiposServicio:      TipoServicio[];
  tecnicos:           Tecnico[];
  precioHoraDefault:  number;
  precioPorKmDefault: number;
}) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const clienteIdParam = searchParams.get("clienteId") ?? "";
  const maquinaIdParam = searchParams.get("maquinaId") ?? "";

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);

  const [form, setForm] = useState({
    clienteId:           clienteIdParam,
    maquinaId:           maquinaIdParam,
    tecnicoId:           "",
    fecha:               hoy(),
    direccionReparacion: "",
    trabajosRealizados:  "",
    observaciones:       "",
  });

  const [serviciosEstandar, setServiciosEstandar] = useState<LineaEstandar[]>([]);
  const [serviciosLibres,   setServiciosLibres]   = useState<LineaLibre[]>([]);
  const [repuestos,         setRepuestos]         = useState<LineaRepuesto[]>([]);

  const clienteActual = clientes.find((c) => c.id === form.clienteId);
  const precioHora    = clienteActual?.precioHoraEspecial  ?? precioHoraDefault;
  const precioPorKm   = clienteActual?.precioPorKmEspecial ?? precioPorKmDefault;

  useEffect(() => {
    if (!form.clienteId) { setMaquinas([]); return; }
    fetch(`/api/maquinas?clienteId=${form.clienteId}&estado=activo`)
      .then((r) => r.json())
      .then((data) => setMaquinas(Array.isArray(data) ? data : []));
  }, [form.clienteId]);

  const setField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ---- Servicios estándar ----
  const addServicioEstandar = () => {
    const primerTipo = tiposServicio[0];
    const precio     = primerTipo?.unidad === "h" ? precioHora : precioPorKm;
    setServiciosEstandar((prev) => [...prev, {
      _key: uid(), fecha: hoy(),
      tipoServicioId: primerTipo?.id ?? "",
      cantidad: 0, precio, descripcion: "",
    }]);
  };

  const updateServicioEstandar = (key: string, field: string, value: any) =>
    setServiciosEstandar((prev) => prev.map((s) => {
      if (s._key !== key) return s;
      const updated = { ...s, [field]: value };
      if (field === "tipoServicioId") {
        const tipo = tiposServicio.find((t) => t.id === value);
        updated.precio = tipo?.unidad === "h" ? precioHora : precioPorKm;
      }
      return updated;
    }));

  const removeServicioEstandar = (key: string) =>
    setServiciosEstandar((prev) => prev.filter((s) => s._key !== key));

  // ---- Servicios libres ----
  const addServicioLibre = () =>
    setServiciosLibres((prev) => [...prev, {
      _key: uid(), descripcion: "", cantidad: 1, precio: 0,
    }]);

  const updateServicioLibre = (key: string, field: string, value: any) =>
    setServiciosLibres((prev) => prev.map((s) => s._key === key ? { ...s, [field]: value } : s));

  const removeServicioLibre = (key: string) =>
    setServiciosLibres((prev) => prev.filter((s) => s._key !== key));

  // ---- Repuestos ----
  const addRepuesto = () =>
    setRepuestos((prev) => [...prev, {
      _key: uid(), referencia: "", descripcion: "",
      cantidad: 1, precioCoste: 0, precioVenta: 0,
    }]);

  const updateRepuesto = (key: string, field: string, value: any) =>
    setRepuestos((prev) => prev.map((r) => r._key === key ? { ...r, [field]: value } : r));

  const removeRepuesto = (key: string) =>
    setRepuestos((prev) => prev.filter((r) => r._key !== key));

  // ---- Totales ----
  const totalEstandar  = serviciosEstandar.reduce((acc, s) => acc + s.cantidad * s.precio, 0);
  const totalLibres    = serviciosLibres.reduce((acc, s) => acc + s.cantidad * s.precio, 0);
  const totalRepuestos = repuestos.reduce((acc, r) => acc + r.cantidad * r.precioVenta, 0);
  const totalOrden     = totalEstandar + totalLibres + totalRepuestos;

  // ---- Submit ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.clienteId) { setError("Selecciona un cliente."); return; }
    if (!form.maquinaId) { setError("Selecciona una máquina."); return; }

    setLoading(true);
    const res = await fetch("/api/ordenes", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        servicios: serviciosEstandar.map((s) => ({
          fecha:          s.fecha,
          tipoServicioId: s.tipoServicioId,
          cantidad:       Number(s.cantidad),
          precio:         Number(s.precio),
          descripcion:    s.descripcion,
          esManoObra:     tiposServicio.find((t) => t.id === s.tipoServicioId)?.unidad === "h",
        })),
        serviciosLibres: serviciosLibres.map((s) => ({
          descripcion: s.descripcion,
          cantidad:    Number(s.cantidad),
          precio:      Number(s.precio),
        })),
        repuestos: repuestos.map((r) => ({
          referencia:  r.referencia,
          descripcion: r.descripcion,
          cantidad:    Number(r.cantidad),
          precioCoste: Number(r.precioCoste),
          precioVenta: Number(r.precioVenta),
        })),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al crear la orden.");
      setLoading(false);
      return;
    }

    const orden = await res.json();
    router.push(`/ordenes/${orden.id}`);
  };

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/ordenes"
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Nueva orden</h1>
            <p className="text-sm text-gray-400 mt-0.5">Rellena los datos del parte de trabajo</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/ordenes"
            className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Cancelar
          </Link>
          <button form="nueva-orden-form" type="submit" disabled={loading}
            className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer">
            <Save size={15} />
            {loading ? "Guardando..." : "Guardar orden"}
          </button>
        </div>
      </div>

      <form id="nueva-orden-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">

            {/* Información general */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <ClipboardList size={15} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-700">Información general</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Fecha inicio <span className="text-red-400">*</span>
                    </label>
                    <input type="date" value={form.fecha}
                      onChange={(e) => setField("fecha", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      <MapPin size={11} className="inline mr-1" />
                      Dirección de reparación
                    </label>
                    <input type="text" placeholder="Calle, ciudad..."
                      value={form.direccionReparacion}
                      onChange={(e) => setField("direccionReparacion", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Cliente <span className="text-red-400">*</span>
                  </label>
                  <SearchableSelect
                    value={form.clienteId}
                    onChange={(v) => { setField("clienteId", v); setField("maquinaId", ""); }}
                    options={clientes.map((c) => ({ value: c.id, label: c.nombre }))}
                    placeholder="Selecciona un cliente..."
                    emptyMessage="Ningún cliente coincide con la búsqueda."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Máquina <span className="text-red-400">*</span>
                  </label>
                  <SearchableSelect
                    value={form.maquinaId}
                    onChange={(v) => setField("maquinaId", v)}
                    options={maquinas.map((m) => ({
                      value: m.id,
                      label: `${m.marca} ${m.modelo} — ${m.numeroDeSerie} (${m.horasActuales}h)`,
                    }))}
                    disabled={!form.clienteId}
                    placeholder={form.clienteId ? "Selecciona una máquina..." : "Primero selecciona un cliente"}
                    emptyMessage="Este cliente no tiene máquinas activas."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Técnico asignado
                  </label>
                  <select value={form.tecnicoId}
                    onChange={(e) => setField("tecnicoId", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-gray-700">
                    <option value="">Sin asignar</option>
                    {tecnicos.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    <FileText size={11} className="inline mr-1" />
                    Trabajos realizados
                  </label>
                  <textarea rows={4} placeholder="Describe los trabajos realizados..."
                    value={form.trabajosRealizados}
                    onChange={(e) => setField("trabajosRealizados", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Observaciones internas
                  </label>
                  <textarea rows={2} placeholder="Notas internas (no visibles para el cliente)..."
                    value={form.observaciones}
                    onChange={(e) => setField("observaciones", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white resize-none" />
                </div>
              </div>
            </div>

            {/* Servicios */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Wrench size={15} className="text-amber-600" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700">Registro de servicios</h2>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={addServicioEstandar}
                    className="flex items-center gap-1.5 text-xs text-[#00C2FF] hover:text-[#00a8db] font-medium cursor-pointer border border-[#00C2FF]/30 rounded-lg px-3 py-1.5 hover:bg-[#00C2FF]/5 transition-colors">
                    <Plus size={12} /> Servicio estándar
                  </button>
                  <button type="button" onClick={addServicioLibre}
                    className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium cursor-pointer border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-50 transition-colors">
                    <Plus size={12} /> Servicio libre
                  </button>
                </div>
              </div>

              {serviciosEstandar.length === 0 && serviciosLibres.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-sm mb-3">Sin servicios añadidos</p>
                  <div className="flex justify-center gap-3">
                    <button type="button" onClick={addServicioEstandar}
                      className="text-[#00C2FF] text-sm cursor-pointer">+ Servicio estándar</button>
                    <span className="text-gray-300">|</span>
                    <button type="button" onClick={addServicioLibre}
                      className="text-purple-600 text-sm cursor-pointer">+ Servicio libre</button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Cabecera tabla compartida */}
                  <div className="grid grid-cols-12 px-5 py-2 bg-gray-50 border-b border-gray-100">
                    <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Fecha</div>
                    <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Tipo / Descripción</div>
                    <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Descripción adicional</div>
                    <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Cant.</div>
                    <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">Precio</div>
                    <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-right">Total</div>
                    <div className="col-span-1"></div>
                  </div>

                  {/* Servicios estándar */}
                  {serviciosEstandar.map((s) => {
                    const tipo  = tiposServicio.find((t) => t.id === s.tipoServicioId);
                    const total = s.cantidad * s.precio;
                    return (
                      <div key={s._key} className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center gap-2 bg-amber-50/20">
                        <div className="col-span-2">
                          <input type="date" value={s.fecha}
                            onChange={(e) => updateServicioEstandar(s._key, "fecha", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                        </div>
                        <div className="col-span-3">
                          <select value={s.tipoServicioId}
                            onChange={(e) => updateServicioEstandar(s._key, "tipoServicioId", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-amber-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white text-gray-700">
                            {tiposServicio.map((t) => (
                              <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input type="text" placeholder="Descripción..."
                            value={s.descripcion}
                            onChange={(e) => updateServicioEstandar(s._key, "descripcion", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                        </div>
                        <div className="col-span-1">
                          <input type="number" min="0" step="0.5" value={s.cantidad}
                            onChange={(e) => updateServicioEstandar(s._key, "cantidad", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center" />
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center gap-1">
                            <input type="number" min="0" step="0.01" value={s.precio}
                              onChange={(e) => updateServicioEstandar(s._key, "precio", parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center" />
                            <span className="text-xs text-gray-400 shrink-0">€/{tipo?.unidad ?? "ud"}</span>
                          </div>
                        </div>
                        <div className="col-span-1 text-xs font-semibold text-gray-700 text-right">
                          {total.toFixed(2)} €
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button type="button" onClick={() => removeServicioEstandar(s._key)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Servicios libres */}
                  {serviciosLibres.map((s) => {
                    const total = s.cantidad * s.precio;
                    return (
                      <div key={s._key} className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center gap-2 bg-purple-50/20">
                        <div className="col-span-2 flex items-center">
                          <span className="text-xs text-purple-400 font-medium">Libre</span>
                        </div>
                        <div className="col-span-3">
                          <input type="text" placeholder="Descripción del servicio..."
                            value={s.descripcion}
                            onChange={(e) => updateServicioLibre(s._key, "descripcion", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-purple-200 rounded-lg focus:outline-none focus:border-purple-400 bg-white" />
                        </div>
                        <div className="col-span-2">
                          <input type="text" placeholder="Notas adicionales..."
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white opacity-50 cursor-not-allowed"
                            disabled />
                        </div>
                        <div className="col-span-1">
                          <input type="number" min="0" step="0.01" value={s.cantidad}
                            onChange={(e) => updateServicioLibre(s._key, "cantidad", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center" />
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center gap-1">
                            <input type="number" min="0" step="0.01" value={s.precio}
                              onChange={(e) => updateServicioLibre(s._key, "precio", parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center" />
                            <span className="text-xs text-gray-400 shrink-0">€/ud</span>
                          </div>
                        </div>
                        <div className="col-span-1 text-xs font-semibold text-gray-700 text-right">
                          {total.toFixed(2)} €
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button type="button" onClick={() => removeServicioLibre(s._key)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Total servicios */}
                  <div className="flex justify-end px-5 py-3 bg-gray-50">
                    <span className="text-xs text-gray-500 mr-3">Total servicios</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {(totalEstandar + totalLibres).toFixed(2)} €
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Repuestos */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Package size={15} className="text-purple-600" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700">Registro de repuestos</h2>
                </div>
                <button type="button" onClick={addRepuesto}
                  className="flex items-center gap-1.5 text-xs text-[#00C2FF] hover:text-[#00a8db] font-medium cursor-pointer">
                  <Plus size={13} /> Añadir repuesto
                </button>
              </div>

              {repuestos.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-sm mb-3">Sin repuestos añadidos</p>
                  <button type="button" onClick={addRepuesto}
                    className="text-[#00C2FF] text-sm cursor-pointer">+ Añadir primer repuesto</button>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-12 px-5 py-2 bg-gray-50 border-b border-gray-100">
                    <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Referencia</div>
                    <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Descripción</div>
                    <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Cant.</div>
                    <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">P. Coste</div>
                    <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">P. Venta</div>
                    <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Margen</div>
                    <div className="col-span-1"></div>
                  </div>
                  {repuestos.map((r) => {
                    const margen = r.precioCoste > 0
                      ? (((r.precioVenta - r.precioCoste) / r.precioCoste) * 100).toFixed(0)
                      : "—";
                    return (
                      <div key={r._key} className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center gap-2">
                        <div className="col-span-2">
                          <input type="text" placeholder="Ref..." value={r.referencia}
                            onChange={(e) => updateRepuesto(r._key, "referencia", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white font-mono" />
                        </div>
                        <div className="col-span-3">
                          <input type="text" placeholder="Descripción..." value={r.descripcion}
                            onChange={(e) => updateRepuesto(r._key, "descripcion", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                        </div>
                        <div className="col-span-1">
                          <input type="number" min="1" value={r.cantidad}
                            onChange={(e) => updateRepuesto(r._key, "cantidad", parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center" />
                        </div>
                        <div className="col-span-2">
                          <input type="number" min="0" step="0.01" value={r.precioCoste}
                            onChange={(e) => updateRepuesto(r._key, "precioCoste", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center" />
                        </div>
                        <div className="col-span-2">
                          <input type="number" min="0" step="0.01" value={r.precioVenta}
                            onChange={(e) => updateRepuesto(r._key, "precioVenta", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center" />
                        </div>
                        <div className="col-span-1 text-center">
                          <span className={`text-xs font-medium ${
                            margen === "—" ? "text-gray-400" :
                            parseInt(margen) > 0 ? "text-green-600" : "text-red-500"
                          }`}>
                            {margen === "—" ? "—" : `${margen}%`}
                          </span>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button type="button" onClick={() => removeRepuesto(r._key)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-end px-5 py-3 bg-gray-50">
                    <span className="text-xs text-gray-500 mr-3">Total repuestos</span>
                    <span className="text-sm font-semibold text-gray-800">{totalRepuestos.toFixed(2)} €</span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          {/* Columna derecha */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Tarifas aplicadas</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Mano de obra</span>
                  <span className="font-medium text-gray-800">{precioHora.toFixed(2)} €/h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Desplazamiento</span>
                  <span className="font-medium text-gray-800">{precioPorKm.toFixed(2)} €/km</span>
                </div>
                {clienteActual?.precioHoraEspecial && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-[#00C2FF]">Tarifa especial aplicada</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Resumen económico</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Servicios estándar</span>
                  <span className="font-medium text-gray-800">{totalEstandar.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Servicios libres</span>
                  <span className="font-medium text-gray-800">{totalLibres.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Repuestos</span>
                  <span className="font-medium text-gray-800">{totalRepuestos.toFixed(2)} €</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between">
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className="text-lg font-bold text-[#0B1120]">{totalOrden.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            {form.maquinaId && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Máquina seleccionada</div>
                {(() => {
                  const m = maquinas.find((m) => m.id === form.maquinaId);
                  return m ? (
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-800">{m.marca} {m.modelo}</div>
                      <div className="text-xs text-gray-400 font-mono">{m.numeroDeSerie}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        Horas actuales: <span className="font-medium">{m.horasActuales}h</span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}