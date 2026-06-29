"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, FileText, Save, Building2,
  ClipboardList, Plus, Minus, Euro,
} from "lucide-react";

type Cliente  = { id: string; nombre: string };
type Orden    = {
  id:       string;
  numero:   string;
  fecha:    string;
  maquina:  { marca: string; modelo: string };
  servicios:{ cantidad: number; precio: number }[];
  repuestos:{ cantidad: number; precioVenta: number }[];
};

const hoy = () => new Date().toISOString().split("T")[0];

export default function NuevaFacturaForm({ clientes }: { clientes: Cliente[] }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const clienteIdParam = searchParams.get("clienteId") ?? "";

  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [ordenes, setOrdenes]       = useState<Orden[]>([]);
  const [ordenesSeleccionadas, setOrdenesSeleccionadas] = useState<string[]>([]);

  const [form, setForm] = useState({
    clienteId:     clienteIdParam,
    fecha:         hoy(),
    vencimiento:   "",
    tipoDescuento: "euro",
    descuentoValor:"0",
    notas:         "",
  });

  const setField = (f: string, v: string) =>
    setForm((prev) => ({ ...prev, [f]: v }));

  // Cargar órdenes sin factura al cambiar cliente
  useEffect(() => {
    if (!form.clienteId) { setOrdenes([]); setOrdenesSeleccionadas([]); return; }
    fetch(`/api/ordenes/sin-factura?clienteId=${form.clienteId}`)
      .then((r) => r.json())
      .then((data) => {
        setOrdenes(Array.isArray(data) ? data : []);
        setOrdenesSeleccionadas([]);
      });
  }, [form.clienteId]);

  const toggleOrden = (id: string) =>
    setOrdenesSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleTodas = () =>
    setOrdenesSeleccionadas(
      ordenesSeleccionadas.length === ordenes.length
        ? []
        : ordenes.map((o) => o.id)
    );

  // Calcular totales de órdenes seleccionadas
  const ordenesIncluidas = ordenes.filter((o) => ordenesSeleccionadas.includes(o.id));

  const baseImponible = ordenesIncluidas.reduce((acc, o) => {
    const s = o.servicios.reduce((a, s) => a + s.cantidad * s.precio, 0);
    const r = o.repuestos.reduce((a, r) => a + r.cantidad * r.precioVenta, 0);
    return acc + s + r;
  }, 0);

  const descuentoValor = parseFloat(form.descuentoValor) || 0;
  const descuento = form.tipoDescuento === "porcentaje"
    ? baseImponible * (descuentoValor / 100)
    : descuentoValor;

  const baseConDescuento = Math.max(0, baseImponible - descuento);
  const iva   = baseConDescuento * 0.21;
  const total = baseConDescuento + iva;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.clienteId)           { setError("Selecciona un cliente."); return; }
    if (!ordenesSeleccionadas.length) { setError("Selecciona al menos una orden."); return; }

    setLoading(true);
    const res = await fetch("/api/facturas", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId:      form.clienteId,
        ordenIds:       ordenesSeleccionadas,
        fecha:          form.fecha,
        vencimiento:    form.vencimiento || null,
        tipoDescuento:  form.tipoDescuento,
        descuentoValor: descuentoValor,
        notas:          form.notas || null,
      }),
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
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/facturas"
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Nueva factura</h1>
            <p className="text-sm text-gray-400 mt-0.5">Selecciona las órdenes a facturar</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/facturas"
            className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancelar
          </Link>
          <button
            form="nueva-factura-form"
            type="submit"
            disabled={loading || !ordenesSeleccionadas.length}
            className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save size={15} />
            {loading ? "Generando..." : "Generar factura"}
          </button>
        </div>
      </div>

      <form id="nueva-factura-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">

          {/* Columna principal */}
          <div className="col-span-2 space-y-6">

            {/* Datos básicos */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText size={15} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-700">Datos de la factura</h2>
              </div>
              <div className="p-5 space-y-4">
                {/* Cliente */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Cliente <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.clienteId}
                    onChange={(e) => setField("clienteId", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-gray-700"
                  >
                    <option value="">Selecciona un cliente...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Fecha + Vencimiento */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Fecha factura
                    </label>
                    <input
                      type="date"
                      value={form.fecha}
                      onChange={(e) => setField("fecha", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Fecha vencimiento
                    </label>
                    <input
                      type="date"
                      value={form.vencimiento}
                      onChange={(e) => setField("vencimiento", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                    />
                  </div>
                </div>

                {/* Descuento */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Descuento
                  </label>
                  <div className="flex gap-3">
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setField("tipoDescuento", "euro")}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                          form.tipoDescuento === "euro"
                            ? "bg-[#0B1120] text-white"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        € Euro
                      </button>
                      <button
                        type="button"
                        onClick={() => setField("tipoDescuento", "porcentaje")}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer border-l border-gray-200 ${
                          form.tipoDescuento === "porcentaje"
                            ? "bg-[#0B1120] text-white"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        % Porcentaje
                      </button>
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.descuentoValor}
                        onChange={(e) => setField("descuentoValor", e.target.value)}
                        className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        {form.tipoDescuento === "euro" ? "€" : "%"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Notas (aparecerán en la factura)
                  </label>
                  <textarea
                    rows={2}
                    value={form.notas}
                    onChange={(e) => setField("notas", e.target.value)}
                    placeholder="Texto adicional para el pie de factura..."
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Selección de órdenes */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <ClipboardList size={15} className="text-amber-600" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700">
                    Órdenes a incluir
                  </h2>
                  {ordenes.length > 0 && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {ordenesSeleccionadas.length} / {ordenes.length} seleccionadas
                    </span>
                  )}
                </div>
                {ordenes.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleTodas}
                    className="text-xs text-[#00C2FF] hover:text-[#00a8db] font-medium cursor-pointer"
                  >
                    {ordenesSeleccionadas.length === ordenes.length ? "Deseleccionar todas" : "Seleccionar todas"}
                  </button>
                )}
              </div>

              {!form.clienteId ? (
                <div className="text-center py-12">
                  <Building2 size={36} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-400 text-sm">Selecciona un cliente para ver sus órdenes</p>
                </div>
              ) : ordenes.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList size={36} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-400 text-sm">No hay órdenes completadas sin facturar</p>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-12 px-5 py-2 bg-gray-50 border-b border-gray-100">
                    <div className="col-span-1"></div>
                    <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Nº Orden</div>
                    <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Fecha</div>
                    <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Máquina</div>
                    <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-right">Importe</div>
                    <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-right">Acumulado</div>
                  </div>
                  {ordenes.map((o) => {
                    const importeOrden =
                      o.servicios.reduce((a, s) => a + s.cantidad * s.precio, 0) +
                      o.repuestos.reduce((a, r) => a + r.cantidad * r.precioVenta, 0);
                    const seleccionada = ordenesSeleccionadas.includes(o.id);
                    return (
                      <div
                        key={o.id}
                        onClick={() => toggleOrden(o.id)}
                        className={`grid grid-cols-12 px-5 py-4 border-b border-gray-50 items-center cursor-pointer transition-colors ${
                          seleccionada ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="col-span-1">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            seleccionada
                              ? "bg-[#0B1120] border-[#0B1120]"
                              : "border-gray-300"
                          }`}>
                            {seleccionada && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div className="col-span-2 text-sm font-medium text-[#185FA5] font-mono">{o.numero}</div>
                        <div className="col-span-2 text-sm text-gray-500">
                          {new Date(o.fecha).toLocaleDateString("es-ES")}
                        </div>
                        <div className="col-span-3 text-sm text-gray-700">
                          {o.maquina.marca} {o.maquina.modelo}
                        </div>
                        <div className="col-span-2 text-sm font-medium text-gray-800 text-right">
                          {importeOrden.toFixed(2)} €
                        </div>
                        <div className="col-span-2 text-sm text-gray-400 text-right">
                          {seleccionada ? `${baseImponible.toFixed(2)} €` : "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          {/* Columna derecha — resumen */}
          <div className="space-y-4">

            {/* Resumen económico */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
                Resumen factura
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Base imponible</span>
                  <span className="font-medium text-gray-800">{baseImponible.toFixed(2)} €</span>
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Minus size={12} />
                      Descuento {form.tipoDescuento === "porcentaje" ? `(${descuentoValor}%)` : ""}
                    </span>
                    <span className="font-medium text-red-500">-{descuento.toFixed(2)} €</span>
                  </div>
                )}
                {descuento > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Base con descuento</span>
                    <span className="font-medium text-gray-800">{baseConDescuento.toFixed(2)} €</span>
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

            {/* Órdenes seleccionadas */}
            {ordenesSeleccionadas.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                  Órdenes incluidas
                </div>
                <div className="space-y-2">
                  {ordenesIncluidas.map((o) => {
                    const importe =
                      o.servicios.reduce((a, s) => a + s.cantidad * s.precio, 0) +
                      o.repuestos.reduce((a, r) => a + r.cantidad * r.precioVenta, 0);
                    return (
                      <div key={o.id} className="flex justify-between text-sm">
                        <span className="text-[#185FA5] font-mono">{o.numero}</span>
                        <span className="text-gray-600">{importe.toFixed(2)} €</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Info numeración */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
              <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">
                Numeración automática
              </div>
              <p className="text-xs text-blue-500 leading-relaxed">
                El número de factura se genera automáticamente con el formato <span className="font-mono font-medium">CONTADOR_DD-MM-YYYY</span> según la fecha seleccionada.
              </p>
              <Link
                href="/configuracion"
                className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block"
              >
                Configurar contador →
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}