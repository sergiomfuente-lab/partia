"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, FileText, Save, Plus, Trash2,
  Wrench, Package, CheckSquare, Square,
} from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";

type Cliente      = { id: string; nombre: string; precioHoraEspecial: number | null; precioPorKmEspecial: number | null; plazoPagoDias: number | null };
type TipoServicio = { id: string; nombre: string; unidad: string };
type Serie        = { id: string; nombre: string; prefijo: string; predeterminada: boolean };
type Orden        = {
  id: string; numero: string; fecha: string;
  cliente:         { id: string; nombre: string };
  maquina:         { id: string; marca: string; modelo: string };
  servicios:       { id: string; tipoServicio: { nombre: string }; cantidad: number; precio: number; descripcion?: string }[];
  serviciosLibres: { id: string; descripcion: string; cantidad: number; precio: number }[];
  repuestos:       { id: string; descripcion: string; cantidad: number; precioVenta: number }[];
};

type LineaEstandar = { _key: string; tipoServicioId: string; descripcion: string; cantidad: string; precio: string };
type LineaLibre    = { _key: string; descripcion: string; cantidad: string; precio: string };
type LineaRepuesto = { _key: string; referencia: string; descripcion: string; cantidad: string; precioCoste: string; precioVenta: string };

const uid = () => Math.random().toString(36).slice(2, 9);
const hoy = () => new Date().toISOString().split("T")[0];

// Calcula la fecha de vencimiento sumando el plazo de pago (en días) del
// cliente a la fecha de la factura, en formato yyyy-mm-dd para el <input type="date">.
function calcularVencimiento(fecha: string, plazoPagoDias: number | null | undefined): string {
  if (plazoPagoDias == null || !fecha) return "";
  const base = new Date(`${fecha}T00:00:00`);
  base.setDate(base.getDate() + plazoPagoDias);
  return base.toISOString().split("T")[0];
}

export default function NuevaFacturaForm({
  clientes, tiposServicio, series, serieInicial,
  ordenesSinFactura, esDirecta,
  precioHoraDefault, precioPorKmDefault,
}: {
  clientes:           Cliente[];
  tiposServicio:      TipoServicio[];
  series:             Serie[];
  serieInicial:       Serie | null;
  ordenesSinFactura:  Orden[];
  esDirecta:          boolean;
  precioHoraDefault:  number;
  precioPorKmDefault: number;
}) {
  const router = useRouter();

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // Campos comunes
  const [form, setForm] = useState({
    clienteId:     "",
    serieId:       serieInicial?.id ?? "",
    fecha:         hoy(),
    vencimiento:   "",
    tipoDescuento: "euro",
    descuentoValor:"0",
    notas:         "",
  });

  // Para facturas desde orden
  const [ordenesSeleccionadas, setOrdenesSeleccionadas] = useState<string[]>([]);

  // Para facturas directas
  const [serviciosEstandar, setServiciosEstandar] = useState<LineaEstandar[]>([]);
  const [serviciosLibres,   setServiciosLibres]   = useState<LineaLibre[]>([]);
  const [repuestos,         setRepuestos]         = useState<LineaRepuesto[]>([]);

  const setField = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  // El vencimiento se recalcula solo a partir del plazo de pago del cliente
  // (fecha + X días) mientras el usuario no lo edite a mano.
  const [vencimientoManual, setVencimientoManual] = useState(false);

  const clienteActual   = clientes.find((c) => c.id === form.clienteId);
  const precioHora      = clienteActual?.precioHoraEspecial  ?? precioHoraDefault;
  const precioPorKm     = clienteActual?.precioPorKmEspecial ?? precioPorKmDefault;
  const serieActual     = series.find((s) => s.id === form.serieId);

  useEffect(() => {
    if (vencimientoManual) return;
    setForm((p) => ({ ...p, vencimiento: calcularVencimiento(p.fecha, clienteActual?.plazoPagoDias) }));
  }, [form.clienteId, form.fecha, clienteActual?.plazoPagoDias, vencimientoManual]);

  // Órdenes filtradas por cliente
  const ordenesFiltradas = ordenesSinFactura.filter(
    (o) => !form.clienteId || o.cliente.id === form.clienteId
  );

  // Totales factura desde orden
  const totalOrdenes = ordenesSeleccionadas.reduce((acc, oid) => {
    const o = ordenesSinFactura.find((x) => x.id === oid);
    if (!o) return acc;
    const s  = o.servicios.reduce((a, s) => a + s.cantidad * s.precio, 0);
    const sl = o.serviciosLibres.reduce((a, s) => a + s.cantidad * s.precio, 0);
    const r  = o.repuestos.reduce((a, r) => a + r.cantidad * r.precioVenta, 0);
    return acc + s + sl + r;
  }, 0);

  // Totales factura directa
  const totalEstandar  = serviciosEstandar.reduce((acc, s) => acc + parseFloat(s.cantidad || "0") * parseFloat(s.precio || "0"), 0);
  const totalLibres    = serviciosLibres.reduce((acc, s) => acc + parseFloat(s.cantidad || "0") * parseFloat(s.precio || "0"), 0);
  const totalRepuestos = repuestos.reduce((acc, r) => acc + parseFloat(r.cantidad || "0") * parseFloat(r.precioVenta || "0"), 0);

  const baseImponible  = esDirecta ? totalEstandar + totalLibres + totalRepuestos : totalOrdenes;
  const descuentoValor = parseFloat(form.descuentoValor) || 0;
  const descuento      = form.tipoDescuento === "porcentaje"
    ? baseImponible * (descuentoValor / 100)
    : descuentoValor;
  const baseConDescuento = Math.max(0, baseImponible - descuento);
  const iva   = baseConDescuento * 0.21;
  const total = baseConDescuento + iva;

  // ---- Servicios estándar ----
  const addServicioEstandar = () => {
    const primerTipo = tiposServicio[0];
    const precio     = primerTipo?.unidad === "h" ? precioHora : precioPorKm;
    setServiciosEstandar((prev) => [...prev, {
      _key: uid(), tipoServicioId: primerTipo?.id ?? "",
      descripcion: "", cantidad: "0", precio: String(precio),
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
    setServiciosLibres((prev) => [...prev, { _key: uid(), descripcion: "", cantidad: "1", precio: "0" }]);

  const updateServicioLibre = (key: string, field: string, value: string) =>
    setServiciosLibres((prev) => prev.map((s) => s._key === key ? { ...s, [field]: value } : s));

  const removeServicioLibre = (key: string) =>
    setServiciosLibres((prev) => prev.filter((s) => s._key !== key));

  // ---- Repuestos ----
  const addRepuesto = () =>
    setRepuestos((prev) => [...prev, { _key: uid(), referencia: "", descripcion: "", cantidad: "1", precioCoste: "0", precioVenta: "0" }]);

  const updateRepuesto = (key: string, field: string, value: string) =>
    setRepuestos((prev) => prev.map((r) => r._key === key ? { ...r, [field]: value } : r));

  const removeRepuesto = (key: string) =>
    setRepuestos((prev) => prev.filter((r) => r._key !== key));

  // ---- Toggle orden ----
  const toggleOrden = (id: string) =>
    setOrdenesSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // ---- Submit ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.clienteId) { setError("Selecciona un cliente."); return; }

    if (!esDirecta && ordenesSeleccionadas.length === 0) {
      setError("Selecciona al menos una orden."); return;
    }
    if (esDirecta && serviciosEstandar.length === 0 && serviciosLibres.length === 0 && repuestos.length === 0) {
      setError("Añade al menos una línea."); return;
    }

    setLoading(true);

    const body = esDirecta
      ? {
          clienteId:      form.clienteId,
          serieId:        form.serieId || null,
          fecha:          form.fecha,
          vencimiento:    form.vencimiento || null,
          tipoDescuento:  form.tipoDescuento,
          descuentoValor: descuentoValor,
          notas:          form.notas || null,
          esDirecta:      true,
          lineasDirectas: [
            ...serviciosEstandar.map((s) => {
              const tipo = tiposServicio.find((t) => t.id === s.tipoServicioId);
              return {
                tipo:          "servicio",
                tipoServicioId: s.tipoServicioId,
                descripcion:   tipo ? `${tipo.nombre}${s.descripcion ? ` — ${s.descripcion}` : ""}` : s.descripcion,
                cantidad:      parseFloat(s.cantidad),
                precioCoste:   0,
                precioVenta:   parseFloat(s.precio),
              };
            }),
            ...serviciosLibres.map((s) => ({
              tipo:        "libre",
              descripcion: s.descripcion,
              cantidad:    parseFloat(s.cantidad),
              precioCoste: 0,
              precioVenta: parseFloat(s.precio),
            })),
            ...repuestos.map((r) => ({
              tipo:        "repuesto",
              descripcion: r.descripcion,
              referencia:  r.referencia || null,
              cantidad:    parseFloat(r.cantidad),
              precioCoste: parseFloat(r.precioCoste),
              precioVenta: parseFloat(r.precioVenta),
            })),
          ],
        }
      : {
          clienteId:      form.clienteId,
          serieId:        form.serieId || null,
          fecha:          form.fecha,
          vencimiento:    form.vencimiento || null,
          tipoDescuento:  form.tipoDescuento,
          descuentoValor: descuentoValor,
          notas:          form.notas || null,
          esDirecta:      false,
          ordenIds:       ordenesSeleccionadas,
        };

    const res = await fetch("/api/facturas", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al crear la factura.");
      setLoading(false);
      return;
    }

    const factura = await res.json();
    router.push(`/facturas/${factura.id}`);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/facturas"
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {esDirecta ? "Nueva factura directa" : "Nueva factura desde órdenes"}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {serieActual ? `Serie: ${serieActual.nombre} (${serieActual.prefijo})` : "Numeración: Nº_DD-MM-AAAA"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/facturas"
            className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Cancelar
          </Link>
          <button form="nueva-factura-form" type="submit" disabled={loading}
            className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer">
            <Save size={15} />
            {loading ? "Guardando..." : "Crear factura"}
          </button>
        </div>
      </div>

      <form id="nueva-factura-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">

            {/* Datos generales */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText size={15} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-700">Datos de la factura</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Numeración
                    </label>
                    <select value={form.serieId}
                      onChange={(e) => setField("serieId", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-gray-700">
                      <option value="">Nº_DD-MM-AAAA (por defecto)</option>
                      {series.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} ({s.prefijo}) {s.predeterminada ? "— Predeterminada" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Cliente <span className="text-red-400">*</span>
                    </label>
                    <SearchableSelect
                      value={form.clienteId}
                      onChange={(v) => { setField("clienteId", v); setOrdenesSeleccionadas([]); }}
                      options={clientes.map((c) => ({ value: c.id, label: c.nombre }))}
                      placeholder="Selecciona un cliente..."
                      emptyMessage="Ningún cliente coincide con la búsqueda."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Fecha</label>
                    <input type="date" value={form.fecha}
                      onChange={(e) => setField("fecha", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Vencimiento</label>
                      {vencimientoManual && clienteActual?.plazoPagoDias != null && (
                        <button type="button"
                          onClick={() => setVencimientoManual(false)}
                          className="text-xs text-[#00C2FF] hover:underline cursor-pointer">
                          Calcular por plazo del cliente
                        </button>
                      )}
                    </div>
                    <input type="date" value={form.vencimiento}
                      onChange={(e) => { setField("vencimiento", e.target.value); setVencimientoManual(true); }}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                    {!vencimientoManual && clienteActual?.plazoPagoDias != null && (
                      <p className="text-xs text-gray-400 mt-1">
                        Calculado automáticamente: {clienteActual.plazoPagoDias === 0 ? "al contado" : `pago a ${clienteActual.plazoPagoDias} días`}.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sección según tipo */}
            {esDirecta ? (
              <>
                {/* Servicios estándar y libres */}
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
                        className="flex items-center gap-1.5 text-xs text-[#00C2FF] font-medium cursor-pointer border border-[#00C2FF]/30 rounded-lg px-3 py-1.5 hover:bg-[#00C2FF]/5 transition-colors">
                        <Plus size={12} /> Servicio estándar
                      </button>
                      <button type="button" onClick={addServicioLibre}
                        className="flex items-center gap-1.5 text-xs text-purple-600 font-medium cursor-pointer border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-50 transition-colors">
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
                      <div className="grid grid-cols-12 px-5 py-2 bg-gray-50 border-b border-gray-100">
                        <div className="col-span-4 text-xs text-gray-400 uppercase tracking-wide">Tipo / Descripción</div>
                        <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Descripción adicional</div>
                        <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Cant.</div>
                        <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">Precio</div>
                        <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-right">Total</div>
                        <div className="col-span-1"></div>
                      </div>

                      {serviciosEstandar.map((s) => {
                        const tipo  = tiposServicio.find((t) => t.id === s.tipoServicioId);
                        const total = parseFloat(s.cantidad || "0") * parseFloat(s.precio || "0");
                        return (
                          <div key={s._key} className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center gap-2 bg-amber-50/20">
                            <div className="col-span-4">
                              <select value={s.tipoServicioId}
                                onChange={(e) => updateServicioEstandar(s._key, "tipoServicioId", e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-amber-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white text-gray-700">
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

                      {serviciosLibres.map((s) => {
                        const total = parseFloat(s.cantidad || "0") * parseFloat(s.precio || "0");
                        return (
                          <div key={s._key} className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center gap-2 bg-purple-50/20">
                            <div className="col-span-4">
                              <input type="text" placeholder="Descripción del servicio..."
                                value={s.descripcion}
                                onChange={(e) => updateServicioLibre(s._key, "descripcion", e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-purple-200 rounded-lg focus:outline-none focus:border-purple-400 bg-white" />
                            </div>
                            <div className="col-span-3">
                              <input type="text" placeholder="Notas adicionales..." disabled
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white opacity-40 cursor-not-allowed" />
                            </div>
                            <div className="col-span-1">
                              <input type="number" min="0" step="0.01" value={s.cantidad}
                                onChange={(e) => updateServicioLibre(s._key, "cantidad", e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center" />
                            </div>
                            <div className="col-span-2">
                              <div className="flex items-center gap-1">
                                <input type="number" min="0" step="0.01" value={s.precio}
                                  onChange={(e) => updateServicioLibre(s._key, "precio", e.target.value)}
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
                      className="flex items-center gap-1.5 text-xs text-[#00C2FF] font-medium cursor-pointer">
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
              </>
            ) : (
              /* Selección de órdenes */
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <CheckSquare size={15} className="text-blue-600" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700">
                    Órdenes completadas
                    {ordenesSeleccionadas.length > 0 && (
                      <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {ordenesSeleccionadas.length} seleccionada{ordenesSeleccionadas.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </h2>
                </div>

                {ordenesFiltradas.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-gray-400 text-sm">
                      {form.clienteId
                        ? "Este cliente no tiene órdenes completadas pendientes de facturar"
                        : "Selecciona un cliente para ver sus órdenes"}
                    </p>
                  </div>
                ) : (
                  ordenesFiltradas.map((o) => {
                    const seleccionada = ordenesSeleccionadas.includes(o.id);
                    const importeOrden =
                      o.servicios.reduce((a, s) => a + s.cantidad * s.precio, 0) +
                      o.serviciosLibres.reduce((a, s) => a + s.cantidad * s.precio, 0) +
                      o.repuestos.reduce((a, r) => a + r.cantidad * r.precioVenta, 0);

                    return (
                      <div key={o.id}
                        onClick={() => toggleOrden(o.id)}
                        className={`flex items-center gap-4 px-5 py-4 border-b border-gray-50 cursor-pointer transition-colors ${
                          seleccionada ? "bg-blue-50/30" : "hover:bg-gray-50"
                        }`}>
                        <div className={`shrink-0 ${seleccionada ? "text-[#00C2FF]" : "text-gray-300"}`}>
                          {seleccionada ? <CheckSquare size={18} /> : <Square size={18} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-[#185FA5] font-mono">{o.numero}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(o.fecha).toLocaleDateString("es-ES")}
                            </span>
                            <span className="text-xs text-gray-500">{o.cliente.nombre}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {o.maquina.marca} {o.maquina.modelo}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-800">
                          {importeOrden.toFixed(2)} €
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Descuento y notas */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Descuento</label>
                <div className="flex gap-3">
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                    <button type="button" onClick={() => setField("tipoDescuento", "euro")}
                      className={`px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                        form.tipoDescuento === "euro" ? "bg-[#0B1120] text-white" : "text-gray-500 hover:bg-gray-50"
                      }`}>€ Euro</button>
                    <button type="button" onClick={() => setField("tipoDescuento", "porcentaje")}
                      className={`px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer border-l border-gray-200 ${
                        form.tipoDescuento === "porcentaje" ? "bg-[#0B1120] text-white" : "text-gray-500 hover:bg-gray-50"
                      }`}>% Porcentaje</button>
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
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Notas</label>
                <textarea rows={2} value={form.notas}
                  onChange={(e) => setField("notas", e.target.value)}
                  placeholder="Notas adicionales..."
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
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Resumen</div>
              <div className="space-y-3">
                {esDirecta ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Servicios</span>
                      <span className="font-medium text-gray-800">{(totalEstandar + totalLibres).toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Repuestos</span>
                      <span className="font-medium text-gray-800">{totalRepuestos.toFixed(2)} €</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Órdenes ({ordenesSeleccionadas.length})</span>
                    <span className="font-medium text-gray-800">{totalOrdenes.toFixed(2)} €</span>
                  </div>
                )}
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

            {serieActual && (
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">Serie seleccionada</div>
                <div className="text-sm font-semibold text-blue-800">{serieActual.nombre}</div>
                <div className="text-xs text-blue-500 font-mono mt-1">Prefijo: {serieActual.prefijo}</div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}