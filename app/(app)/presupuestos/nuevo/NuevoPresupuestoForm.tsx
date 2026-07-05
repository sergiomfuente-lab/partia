"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, FileText, Save, Plus,
  Trash2, Wrench, Package,
} from "lucide-react";

type Cliente      = { id: string; nombre: string; precioHoraEspecial: number | null; precioPorKmEspecial: number | null };
type Maquina      = { id: string; marca: string; modelo: string; numeroDeSerie: string };
type TipoServicio = { id: string; nombre: string; unidad: string };

type LineaEstandar = {
  _key:           string;
  fecha:          string;
  tipoServicioId: string;
  cantidad:       string;
  precio:         string;
  descripcion:    string;
};
type LineaLibre = {
  _key:        string;
  descripcion: string;
  cantidad:    string;
  precio:      string;
};
type LineaRepuesto = {
  _key:        string;
  referencia:  string;
  descripcion: string;
  cantidad:    string;
  precioCoste: string;
  precioVenta: string;
};

const uid = () => Math.random().toString(36).slice(2, 9);
const hoy = () => new Date().toISOString().split("T")[0];

export default function NuevoPresupuestoForm({
  clientes,
  tiposServicio,
  precioHoraDefault,
  precioPorKmDefault,
}: {
  clientes:          Cliente[];
  tiposServicio:     TipoServicio[];
  precioHoraDefault: number;
  precioPorKmDefault:number;
}) {
  const router         = useRouter();
  const searchParams   = useSearchParams();
  const clienteIdParam = searchParams.get("clienteId") ?? "";

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);

  const [form, setForm] = useState({
    clienteId:           clienteIdParam,
    maquinaId:           "",
    fecha:               hoy(),
    validezHasta:        "",
    direccionReparacion: "",
    descripcion:         "",
    observaciones:       "",
    notas:               "",
    tipoDescuento:       "euro",
    descuentoValor:      "0",
  });

  const [serviciosEstandar, setServiciosEstandar] = useState<LineaEstandar[]>([]);
  const [serviciosLibres,   setServiciosLibres]   = useState<LineaLibre[]>([]);
  const [repuestos,         setRepuestos]         = useState<LineaRepuesto[]>([]);

  const setField = (f: string, v: string) => setForm((prev) => ({ ...prev, [f]: v }));

  // Precio activo según cliente
  const clienteActual = clientes.find((c) => c.id === form.clienteId);
  const precioHora    = clienteActual?.precioHoraEspecial   ?? precioHoraDefault;
  const precioPorKm   = clienteActual?.precioPorKmEspecial  ?? precioPorKmDefault;

  useEffect(() => {
    if (!form.clienteId) { setMaquinas([]); return; }
    fetch(`/api/maquinas?clienteId=${form.clienteId}&estado=activo`)
      .then((r) => r.json())
      .then((data) => setMaquinas(Array.isArray(data) ? data : []));
  }, [form.clienteId]);

  // ---- Servicios estándar ----
  const addServicioEstandar = () => {
    const primerTipo = tiposServicio[0];
    const precio     = primerTipo?.unidad === "h" ? precioHora : precioPorKm;
    setServiciosEstandar((prev) => [...prev, {
      _key: uid(), fecha: hoy(),
      tipoServicioId: primerTipo?.id ?? "",
      cantidad: "0", precio: String(precio), descripcion: "",
    }]);
  };

  const updateServicioEstandar = (key: string, field: string, value: string) =>
    setServiciosEstandar((prev) => prev.map((s) => {
      if (s._key !== key) return s;
      const updated = { ...s, [field]: value };
      if (field === "tipoServicioId") {
        const tipo = tiposServicio.find((t) => t.id === value);
        updated.precio = String(tipo?.unidad === "h" ? precioHora : precioPorKm);
      }
      return updated;
    }));

  const removeServicioEstandar = (key: string) =>
    setServiciosEstandar((prev) => prev.filter((s) => s._key !== key));

  // ---- Servicios libres ----
  const addServicioLibre = () =>
    setServiciosLibres((prev) => [...prev, {
      _key: uid(), descripcion: "", cantidad: "1", precio: "0",
    }]);

  const updateServicioLibre = (key: string, field: string, value: string) =>
    setServiciosLibres((prev) => prev.map((s) => s._key === key ? { ...s, [field]: value } : s));

  const removeServicioLibre = (key: string) =>
    setServiciosLibres((prev) => prev.filter((s) => s._key !== key));

  // ---- Repuestos ----
  const addRepuesto = () =>
    setRepuestos((prev) => [...prev, {
      _key: uid(), referencia: "", descripcion: "",
      cantidad: "1", precioCoste: "0", precioVenta: "0",
    }]);

  const updateRepuesto = (key: string, field: string, value: string) =>
    setRepuestos((prev) => prev.map((r) => r._key === key ? { ...r, [field]: value } : r));

  const removeRepuesto = (key: string) =>
    setRepuestos((prev) => prev.filter((r) => r._key !== key));

  // ---- Totales ----
  const totalEstandar  = serviciosEstandar.reduce((acc, s) => acc + parseFloat(s.cantidad || "0") * parseFloat(s.precio || "0"), 0);
  const totalLibres    = serviciosLibres.reduce((acc, s) => acc + parseFloat(s.cantidad || "0") * parseFloat(s.precio || "0"), 0);
  const totalRepuestos = repuestos.reduce((acc, r) => acc + parseFloat(r.cantidad || "0") * parseFloat(r.precioVenta || "0"), 0);
  const baseImponible  = totalEstandar + totalLibres + totalRepuestos;
  const descuentoValor = parseFloat(form.descuentoValor) || 0;
  const descuento      = form.tipoDescuento === "porcentaje"
    ? baseImponible * (descuentoValor / 100)
    : descuentoValor;
  const baseConDescuento = Math.max(0, baseImponible - descuento);
  const iva    = baseConDescuento * 0.21;
  const total  = baseConDescuento + iva;

  // ---- Submit ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.clienteId) { setError("Selecciona un cliente."); return; }
    setLoading(true);

    // Combinar servicios estándar y libres en serviciosLibres para la API
    const todasLineasLibres = [
      ...serviciosEstandar.map((s) => {
        const tipo = tiposServicio.find((t) => t.id === s.tipoServicioId);
        return {
          descripcion: tipo ? `${tipo.nombre}${s.descripcion ? ` — ${s.descripcion}` : ""}` : s.descripcion,
          cantidad:    parseFloat(s.cantidad),
          precio:      parseFloat(s.precio),
        };
      }),
      ...serviciosLibres.map((s) => ({
        descripcion: s.descripcion,
        cantidad:    parseFloat(s.cantidad),
        precio:      parseFloat(s.precio),
      })),
    ];

    const res = await fetch("/api/presupuestos", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        maquinaId:      form.maquinaId     || null,
        validezHasta:   form.validezHasta  || null,
        descuentoValor: descuentoValor,
        serviciosLibres: todasLineasLibres,
        repuestos: repuestos.map((r) => ({
          referencia:  r.referencia  || null,
          descripcion: r.descripcion,
          cantidad:    parseInt(r.cantidad),
          precioCoste: parseFloat(r.precioCoste),
          precioVenta: parseFloat(r.precioVenta),
        })),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al crear el presupuesto.");
      setLoading(false);
      return;
    }

    const presupuesto = await res.json();
    router.push(`/presupuestos/${presupuesto.id}`);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/presupuestos"
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Nuevo presupuesto</h1>
            <p className="text-sm text-gray-400 mt-0.5">Rellena los datos del presupuesto</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/presupuestos"
            className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Cancelar
          </Link>
          <button form="nuevo-presupuesto-form" type="submit" disabled={loading}
            className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer">
            <Save size={15} />
            {loading ? "Guardando..." : "Guardar presupuesto"}
          </button>
        </div>
      </div>

      <form id="nuevo-presupuesto-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">

            {/* Datos generales */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText size={15} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-700">Datos del presupuesto</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Fecha <span className="text-red-400">*</span>
                    </label>
                    <input type="date" value={form.fecha}
                      onChange={(e) => setField("fecha", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Válido hasta
                    </label>
                    <input type="date" value={form.validezHasta}
                      onChange={(e) => setField("validezHasta", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Cliente <span className="text-red-400">*</span>
                  </label>
                  <select value={form.clienteId}
                    onChange={(e) => { setField("clienteId", e.target.value); setField("maquinaId", ""); }}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-gray-700">
                    <option value="">Selecciona un cliente...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Máquina (opcional)
                  </label>
                  <select value={form.maquinaId}
                    onChange={(e) => setField("maquinaId", e.target.value)}
                    disabled={!form.clienteId}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-gray-700 disabled:opacity-50">
                    <option value="">Sin máquina asociada</option>
                    {maquinas.map((m) => (
                      <option key={m.id} value={m.id}>{m.marca} {m.modelo} — {m.numeroDeSerie}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Descripción del trabajo
                  </label>
                  <textarea rows={3} value={form.descripcion}
                    onChange={(e) => setField("descripcion", e.target.value)}
                    placeholder="Describe el trabajo a realizar..."
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Dirección de reparación
                  </label>
                  <input type="text" value={form.direccionReparacion}
                    onChange={(e) => setField("direccionReparacion", e.target.value)}
                    placeholder="Calle, ciudad..."
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
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
                  <h2 className="text-sm font-semibold text-gray-700">Servicios</h2>
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
                  {/* Cabecera tabla servicios estándar */}
                  {serviciosEstandar.length > 0 && (
                    <>
                      <div className="grid grid-cols-12 px-5 py-2 bg-amber-50 border-b border-amber-100">
                        <div className="col-span-2 text-xs text-amber-600 uppercase tracking-wide">Fecha</div>
                        <div className="col-span-3 text-xs text-amber-600 uppercase tracking-wide">Tipo</div>
                        <div className="col-span-3 text-xs text-amber-600 uppercase tracking-wide">Descripción</div>
                        <div className="col-span-1 text-xs text-amber-600 uppercase tracking-wide text-center">Cant.</div>
                        <div className="col-span-2 text-xs text-amber-600 uppercase tracking-wide text-center">Precio</div>
                        <div className="col-span-1"></div>
                      </div>
                      {serviciosEstandar.map((s) => {
                        const tipo = tiposServicio.find((t) => t.id === s.tipoServicioId);
                        return (
                          <div key={s._key} className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center gap-2 bg-amber-50/30">
                            <div className="col-span-2">
                              <input type="date" value={s.fecha}
                                onChange={(e) => updateServicioEstandar(s._key, "fecha", e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                            </div>
                            <div className="col-span-3">
                              <select value={s.tipoServicioId}
                                onChange={(e) => updateServicioEstandar(s._key, "tipoServicioId", e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-gray-700">
                                {tiposServicio.map((t) => (
                                  <option key={t.id} value={t.id}>{t.nombre}</option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-3">
                              <input type="text" placeholder="Descripción opcional..."
                                value={s.descripcion}
                                onChange={(e) => updateServicioEstandar(s._key, "descripcion", e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                            </div>
                            <div className="col-span-1">
                              <input type="number" min="0" step="0.5" value={s.cantidad}
                                onChange={(e) => updateServicioEstandar(s._key, "cantidad", e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center" />
                            </div>
                            <div className="col-span-2">
                              <div className="flex items-center gap-1">
                                <input type="number" min="0" step="0.01" value={s.precio}
                                  onChange={(e) => updateServicioEstandar(s._key, "precio", e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center" />
                                <span className="text-xs text-gray-400 shrink-0">€/{tipo?.unidad ?? "ud"}</span>
                              </div>
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
                    </>
                  )}

                  {/* Servicios libres */}
                  {serviciosLibres.length > 0 && (
                    <>
                      <div className="grid grid-cols-12 px-5 py-2 bg-purple-50 border-b border-purple-100">
                        <div className="col-span-6 text-xs text-purple-600 uppercase tracking-wide">Descripción libre</div>
                        <div className="col-span-2 text-xs text-purple-600 uppercase tracking-wide text-center">Cantidad</div>
                        <div className="col-span-3 text-xs text-purple-600 uppercase tracking-wide text-center">Precio ud.</div>
                        <div className="col-span-1"></div>
                      </div>
                      {serviciosLibres.map((s) => (
                        <div key={s._key} className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center gap-2 bg-purple-50/30">
                          <div className="col-span-6">
                            <input type="text" placeholder="Descripción del servicio..."
                              value={s.descripcion}
                              onChange={(e) => updateServicioLibre(s._key, "descripcion", e.target.value)}
                              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                          </div>
                          <div className="col-span-2">
                            <input type="number" min="0" step="0.01" value={s.cantidad}
                              onChange={(e) => updateServicioLibre(s._key, "cantidad", e.target.value)}
                              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center" />
                          </div>
                          <div className="col-span-3">
                            <input type="number" min="0" step="0.01" value={s.precio}
                              onChange={(e) => updateServicioLibre(s._key, "precio", e.target.value)}
                              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center" />
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <button type="button" onClick={() => removeServicioLibre(s._key)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

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
                  <h2 className="text-sm font-semibold text-gray-700">Materiales y repuestos</h2>
                </div>
                <button type="button" onClick={addRepuesto}
                  className="flex items-center gap-1.5 text-xs text-[#00C2FF] hover:text-[#00a8db] font-medium cursor-pointer">
                  <Plus size={13} /> Añadir repuesto
                </button>
              </div>

              {repuestos.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-sm mb-2">Sin repuestos añadidos</p>
                  <button type="button" onClick={addRepuesto}
                    className="text-[#00C2FF] text-sm cursor-pointer">+ Añadir repuesto</button>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-12 px-5 py-2 bg-gray-50 border-b border-gray-100">
                    <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Referencia</div>
                    <div className="col-span-4 text-xs text-gray-400 uppercase tracking-wide">Descripción</div>
                    <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Cant.</div>
                    <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">P.Coste</div>
                    <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">P.Venta</div>
                    <div className="col-span-1"></div>
                  </div>
                  {repuestos.map((r) => (
                    <div key={r._key} className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center gap-2">
                      <div className="col-span-2">
                        <input type="text" placeholder="Ref..." value={r.referencia}
                          onChange={(e) => updateRepuesto(r._key, "referencia", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white font-mono" />
                      </div>
                      <div className="col-span-4">
                        <input type="text" placeholder="Descripción..." value={r.descripcion}
                          onChange={(e) => updateRepuesto(r._key, "descripcion", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                      </div>
                      <div className="col-span-1">
                        <input type="number" min="1" value={r.cantidad}
                          onChange={(e) => updateRepuesto(r._key, "cantidad", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center" />
                      </div>
                      <div className="col-span-2">
                        <input type="number" min="0" step="0.01" value={r.precioCoste}
                          onChange={(e) => updateRepuesto(r._key, "precioCoste", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center" />
                      </div>
                      <div className="col-span-2">
                        <input type="number" min="0" step="0.01" value={r.precioVenta}
                          onChange={(e) => updateRepuesto(r._key, "precioVenta", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center" />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button type="button" onClick={() => removeRepuesto(r._key)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end px-5 py-3 bg-gray-50">
                    <span className="text-xs text-gray-500 mr-3">Total repuestos</span>
                    <span className="text-sm font-semibold text-gray-800">{totalRepuestos.toFixed(2)} €</span>
                  </div>
                </div>
              )}
            </div>

            {/* Descuento y notas */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Descuento</label>
                <div className="flex gap-3">
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                    <button type="button" onClick={() => setField("tipoDescuento", "euro")}
                      className={`px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                        form.tipoDescuento === "euro" ? "bg-[#0B1120] text-white" : "text-gray-500 hover:bg-gray-50"
                      }`}>
                      € Euro
                    </button>
                    <button type="button" onClick={() => setField("tipoDescuento", "porcentaje")}
                      className={`px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer border-l border-gray-200 ${
                        form.tipoDescuento === "porcentaje" ? "bg-[#0B1120] text-white" : "text-gray-500 hover:bg-gray-50"
                      }`}>
                      % Porcentaje
                    </button>
                  </div>
                  <div className="relative flex-1">
                    <input type="number" min="0" step="0.01" value={form.descuentoValor}
                      onChange={(e) => setField("descuentoValor", e.target.value)}
                      className="w-full px-3 py-2.5 pr-8 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      {form.tipoDescuento === "euro" ? "€" : "%"}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Notas (aparecerán en el PDF)</label>
                <textarea rows={2} value={form.notas}
                  onChange={(e) => setField("notas", e.target.value)}
                  placeholder="Condiciones, notas adicionales..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Observaciones internas</label>
                <textarea rows={2} value={form.observaciones}
                  onChange={(e) => setField("observaciones", e.target.value)}
                  placeholder="Notas internas (no aparecen en el PDF)..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white resize-none" />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
            )}
          </div>

          {/* Columna derecha */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Resumen económico</div>
              <div className="space-y-3">
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
                <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                  <span className="text-gray-500">Base imponible</span>
                  <span className="font-medium text-gray-800">{baseImponible.toFixed(2)} €</span>
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Descuento</span>
                    <span className="font-medium text-red-500">-{descuento.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">IVA (21%)</span>
                  <span className="font-medium text-gray-800">{iva.toFixed(2)} €</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className="text-xl font-bold text-[#0B1120]">{total.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            {/* Tarifas */}
            {form.clienteId && (
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
            )}

            {form.validezHasta && (
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">Validez</div>
                <p className="text-sm text-blue-700">
                  Válido hasta el{" "}
                  <span className="font-semibold">
                    {new Date(form.validezHasta).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}