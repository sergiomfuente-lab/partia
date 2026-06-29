"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, FileText, Save,
  CheckCircle2, Clock, AlertCircle,
} from "lucide-react";

const ESTADO_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  pendiente: { label: "Pendiente", icon: <Clock size={13} /> },
  cobrada:   { label: "Cobrada",   icon: <CheckCircle2 size={13} /> },
  vencida:   { label: "Vencida",   icon: <AlertCircle size={13} /> },
};

const toDateInput = (d: string | null) =>
  d ? new Date(d).toISOString().split("T")[0] : "";

export default function EditarFacturaForm({ factura }: { factura: any }) {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [form, setForm] = useState({
    estado:         factura.estado,
    vencimiento:    toDateInput(factura.vencimiento),
    tipoDescuento:  factura.tipoDescuento  ?? "euro",
    descuentoValor: String(factura.descuentoValor ?? 0),
    notas:          factura.notas ?? "",
  });

  const setField = (f: string, v: string) =>
    setForm((prev) => ({ ...prev, [f]: v }));

  // Calcular totales con nuevo descuento
  const descuentoValor   = parseFloat(form.descuentoValor) || 0;
  const descuento        = form.tipoDescuento === "porcentaje"
    ? factura.baseImponible * (descuentoValor / 100)
    : descuentoValor;
  const baseConDescuento = Math.max(0, factura.baseImponible - descuento);
  const iva              = baseConDescuento * 0.21;
  const total            = baseConDescuento + iva;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch(`/api/facturas/${factura.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estado:         form.estado,
        vencimiento:    form.vencimiento || null,
        tipoDescuento:  form.tipoDescuento,
        descuentoValor: descuentoValor,
        notas:          form.notas || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar los cambios.");
      setLoading(false);
      return;
    }

    router.push(`/facturas/${factura.id}`);
  };

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href={`/facturas/${factura.id}`}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Editar factura</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {factura.numero} · {factura.cliente.nombre}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/facturas/${factura.id}`}
            className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancelar
          </Link>
          <button
            form="editar-factura-form"
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save size={15} />
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      <form id="editar-factura-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">

          {/* Columna principal */}
          <div className="col-span-2 space-y-6">

            {/* Datos editables */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText size={15} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-700">Datos de la factura</h2>
              </div>
              <div className="p-5 space-y-4">

                {/* Estado */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Estado
                  </label>
                  <div className="flex gap-2">
                    {Object.entries(ESTADO_CONFIG).map(([value, info]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setField("estado", value)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                          form.estado === value
                            ? value === "pendiente" ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                            : value === "cobrada"   ? "bg-green-100 text-green-800 border border-green-300"
                            : "bg-red-100 text-red-800 border border-red-300"
                            : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {info.icon}
                        {info.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fecha + Vencimiento */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Fecha factura
                    </label>
                    <div className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                      {new Date(factura.fecha).toLocaleDateString("es-ES")}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">La fecha no se puede cambiar</p>
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
                        className="w-full px-3 py-2.5 pr-8 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
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
                    rows={3}
                    value={form.notas}
                    onChange={(e) => setField("notas", e.target.value)}
                    placeholder="Texto adicional para el pie de factura..."
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Órdenes incluidas — solo lectura */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">
                  Órdenes incluidas
                  <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-normal">
                    {factura.ordenes.length}
                  </span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Las órdenes no se pueden modificar una vez facturadas
                </p>
              </div>
              <div>
                <div className="grid grid-cols-12 px-5 py-2 bg-gray-50 border-b border-gray-100">
                  <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Nº Orden</div>
                  <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Fecha</div>
                  <div className="col-span-4 text-xs text-gray-400 uppercase tracking-wide">Máquina</div>
                  <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-right">Importe</div>
                </div>
                {factura.ordenes.map((orden: any) => {
                  const importe =
                    orden.servicios.reduce((a: number, s: any) => a + s.cantidad * s.precio, 0) +
                    orden.repuestos.reduce((a: number, r: any) => a + r.cantidad * r.precioVenta, 0);
                  return (
                    <div key={orden.id} className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center">
                      <div className="col-span-3 text-sm font-medium text-[#185FA5] font-mono">{orden.numero}</div>
                      <div className="col-span-3 text-sm text-gray-500">
                        {new Date(orden.fecha).toLocaleDateString("es-ES")}
                      </div>
                      <div className="col-span-4 text-sm text-gray-700">
                        {orden.maquina.marca} {orden.maquina.modelo}
                      </div>
                      <div className="col-span-2 text-sm font-medium text-gray-800 text-right">
                        {importe.toFixed(2)} €
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          {/* Columna derecha */}
          <div className="space-y-4">

            {/* Resumen económico */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
                Resumen económico
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Base imponible</span>
                  <span className="font-medium text-gray-800">{factura.baseImponible.toFixed(2)} €</span>
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
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

            {/* Info cliente */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Cliente</div>
              <div className="text-sm font-medium text-gray-800 mb-1">{factura.cliente.nombre}</div>
              {factura.cliente.cif && (
                <div className="text-xs text-gray-400 font-mono">{factura.cliente.cif}</div>
              )}
              {factura.cliente.formaPago && (
                <div className="text-xs text-gray-500 mt-2">Pago: {factura.cliente.formaPago}</div>
              )}
            </div>

            {/* Aviso */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
              <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">
                Campos no editables
              </div>
              <p className="text-xs text-blue-500 leading-relaxed">
                El número, la fecha de emisión y las órdenes incluidas no se pueden modificar. Las facturas emitidas no se pueden eliminar para mantener la integridad de la numeración.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}