"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Minus, Save, Plus, Trash2, CheckSquare, Square,
} from "lucide-react";

type Serie   = { id: string; nombre: string; prefijo: string; prefijoAbono: string; predeterminada: boolean };
type Linea   = { id: string; descripcion: string; cantidad: number; precio: number; total: number };
type LineaForm = { _key: string; descripcion: string; cantidad: string; precio: string; seleccionada: boolean };

const uid = () => Math.random().toString(36).slice(2, 9);
const hoy = () => new Date().toISOString().split("T")[0];

export default function NuevoAbonoForm({
  factura, series,
}: {
  factura: any;
  series:  Serie[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Construir líneas desde la factura
  const lineasFactura: Linea[] = factura.esDirecta
    ? factura.lineasDirectas.map((l: any) => ({
        id:          l.id,
        descripcion: l.descripcion,
        cantidad:    l.cantidad,
        precio:      l.precioVenta,
        total:       l.cantidad * l.precioVenta,
      }))
    : factura.ordenes.flatMap((o: any) => [
        ...o.servicios.map((s: any) => ({
          id:          s.id,
          descripcion: `${s.tipoServicio.nombre}${s.descripcion ? ` — ${s.descripcion}` : ""}`,
          cantidad:    s.cantidad,
          precio:      s.precio,
          total:       s.cantidad * s.precio,
        })),
        ...o.serviciosLibres.map((s: any) => ({
          id:          s.id,
          descripcion: s.descripcion,
          cantidad:    s.cantidad,
          precio:      s.precio,
          total:       s.cantidad * s.precio,
        })),
        ...o.repuestos.map((r: any) => ({
          id:          r.id,
          descripcion: r.descripcion,
          cantidad:    r.cantidad,
          precio:      r.precioVenta,
          total:       r.cantidad * r.precioVenta,
        })),
      ]);

  const seriePredeterminada = series.find((s) => s.predeterminada) ?? series[0];

  const [form, setForm] = useState({
    serieId: seriePredeterminada?.id ?? "",
    fecha:   hoy(),
    tipo:    "parcial",
    motivo:  "",
  });

  const [tipoAbono, setTipoAbono] = useState<"total" | "parcial" | "libre">("parcial");

  // Líneas seleccionadas (para abono parcial desde factura)
  const [lineasSeleccionadas, setLineasSeleccionadas] = useState<string[]>([]);

  // Líneas libres (para abono con descripción manual)
  const [lineasLibres, setLineasLibres] = useState<LineaForm[]>([]);

  const setField = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const toggleLinea = (id: string) =>
    setLineasSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const addLineaLibre = () =>
    setLineasLibres((prev) => [...prev, { _key: uid(), descripcion: "", cantidad: "1", precio: "0", seleccionada: true }]);

  const updateLineaLibre = (key: string, field: string, value: string) =>
    setLineasLibres((prev) => prev.map((l) => l._key === key ? { ...l, [field]: value } : l));

  const removeLineaLibre = (key: string) =>
    setLineasLibres((prev) => prev.filter((l) => l._key !== key));

  // Calcular total del abono
  const totalAbono = (() => {
    if (tipoAbono === "total") return factura.total;
    if (tipoAbono === "parcial") {
      return lineasSeleccionadas.reduce((acc, id) => {
        const l = lineasFactura.find((x) => x.id === id);
        return acc + (l ? l.total : 0);
      }, 0);
    }
    return lineasLibres.reduce((acc, l) => acc + parseFloat(l.cantidad || "0") * parseFloat(l.precio || "0"), 0);
  })();

  const baseImponible = totalAbono / 1.21;
  const iva           = totalAbono - baseImponible;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.serieId) { setError("Selecciona una serie."); return; }

    let lineas: { descripcion: string; cantidad: number; precio: number }[] = [];

    if (tipoAbono === "total") {
      lineas = [{
        descripcion: `Abono total factura ${factura.numero}`,
        cantidad:    1,
        precio:      factura.baseImponible,
      }];
    } else if (tipoAbono === "parcial") {
      if (!lineasSeleccionadas.length) { setError("Selecciona al menos una línea."); return; }
      lineas = lineasSeleccionadas.map((id) => {
        const l = lineasFactura.find((x) => x.id === id)!;
        return { descripcion: l.descripcion, cantidad: l.cantidad, precio: l.precio };
      });
    } else {
      if (!lineasLibres.length) { setError("Añade al menos una línea."); return; }
      lineas = lineasLibres.map((l) => ({
        descripcion: l.descripcion,
        cantidad:    parseFloat(l.cantidad),
        precio:      parseFloat(l.precio),
      }));
    }

    setLoading(true);
    const res = await fetch("/api/abonos", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        facturaId: factura.id,
        serieId:   form.serieId,
        fecha:     form.fecha,
        tipo:      tipoAbono,
        motivo:    form.motivo || null,
        lineas,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al crear el abono.");
      setLoading(false);
      return;
    }

    router.push(`/facturas/${factura.id}`);
  };

  const serieActual = series.find((s) => s.id === form.serieId);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/facturas/${factura.id}`}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Crear abono</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Factura <span className="font-mono text-red-500">{factura.numero}</span> — {factura.cliente.nombre}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/facturas/${factura.id}`}
            className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Cancelar
          </Link>
          <button form="nuevo-abono-form" type="submit" disabled={loading}
            className="flex items-center gap-2 bg-red-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer">
            <Minus size={15} />
            {loading ? "Creando..." : "Crear abono"}
          </button>
        </div>
      </div>

      <form id="nuevo-abono-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">

            {/* Datos */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Datos del abono</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Serie <span className="text-red-400">*</span>
                  </label>
                  <select value={form.serieId} onChange={(e) => setField("serieId", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-gray-700">
                    <option value="">Selecciona una serie...</option>
                    {series.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} — Abono: {s.prefijoAbono || `ABO-${s.prefijo}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Fecha</label>
                  <input type="date" value={form.fecha} onChange={(e) => setField("fecha", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Motivo del abono</label>
                <input type="text" value={form.motivo} onChange={(e) => setField("motivo", e.target.value)}
                  placeholder="Motivo o descripción del abono..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
              </div>
            </div>

            {/* Tipo de abono */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Tipo de abono</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "total",   label: "Abono total",   desc: "Abona el importe completo de la factura" },
                  { value: "parcial", label: "Abono parcial", desc: "Selecciona las líneas a abonar" },
                  { value: "libre",   label: "Importe libre", desc: "Introduce manualmente las líneas" },
                ].map((t) => (
                  <button key={t.value} type="button"
                    onClick={() => setTipoAbono(t.value as any)}
                    className={`text-left p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                      tipoAbono === t.value
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <div className={`text-sm font-semibold mb-1 ${tipoAbono === t.value ? "text-red-700" : "text-gray-700"}`}>
                      {t.label}
                    </div>
                    <div className="text-xs text-gray-400">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Líneas según tipo */}
            {tipoAbono === "total" && (
              <div className="bg-red-50 rounded-xl border border-red-100 p-5">
                <p className="text-sm text-red-700">
                  Se creará un abono por el importe total de la factura:{" "}
                  <span className="font-bold">{factura.total.toFixed(2)} €</span>
                </p>
              </div>
            )}

            {tipoAbono === "parcial" && (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Selecciona las líneas a abonar
                    {lineasSeleccionadas.length > 0 && (
                      <span className="ml-2 text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                        {lineasSeleccionadas.length} seleccionada{lineasSeleccionadas.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </h3>
                </div>
                {lineasFactura.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">No hay líneas disponibles</div>
                ) : (
                  lineasFactura.map((l) => {
                    const sel = lineasSeleccionadas.includes(l.id);
                    return (
                      <div key={l.id} onClick={() => toggleLinea(l.id)}
                        className={`flex items-center gap-4 px-5 py-3 border-b border-gray-50 cursor-pointer transition-colors ${
                          sel ? "bg-red-50/30" : "hover:bg-gray-50"
                        }`}>
                        <div className={sel ? "text-red-500" : "text-gray-300"}>
                          {sel ? <CheckSquare size={17} /> : <Square size={17} />}
                        </div>
                        <div className="flex-1 text-sm text-gray-800">{l.descripcion}</div>
                        <div className="text-xs text-gray-400">{l.cantidad} × {l.precio.toFixed(2)} €</div>
                        <div className="text-sm font-semibold text-gray-800 w-20 text-right">{l.total.toFixed(2)} €</div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {tipoAbono === "libre" && (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">Líneas del abono</h3>
                  <button type="button" onClick={addLineaLibre}
                    className="flex items-center gap-1.5 text-xs text-red-600 font-medium cursor-pointer border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors">
                    <Plus size={12} /> Añadir línea
                  </button>
                </div>
                {lineasLibres.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-400 text-sm mb-2">Sin líneas añadidas</p>
                    <button type="button" onClick={addLineaLibre}
                      className="text-red-500 text-sm cursor-pointer">+ Añadir primera línea</button>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-12 px-5 py-2 bg-gray-50 border-b border-gray-100">
                      <div className="col-span-6 text-xs text-gray-400 uppercase tracking-wide">Descripción</div>
                      <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">Cant.</div>
                      <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide text-center">Precio</div>
                      <div className="col-span-1"></div>
                    </div>
                    {lineasLibres.map((l) => (
                      <div key={l._key} className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center gap-2">
                        <div className="col-span-6">
                          <input type="text" placeholder="Descripción..." value={l.descripcion}
                            onChange={(e) => updateLineaLibre(l._key, "descripcion", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-red-400 bg-white" />
                        </div>
                        <div className="col-span-2">
                          <input type="number" min="0" step="0.01" value={l.cantidad}
                            onChange={(e) => updateLineaLibre(l._key, "cantidad", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-red-400 bg-white text-center" />
                        </div>
                        <div className="col-span-3">
                          <input type="number" min="0" step="0.01" value={l.precio}
                            onChange={(e) => updateLineaLibre(l._key, "precio", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-red-400 bg-white text-center" />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button type="button" onClick={() => removeLineaLibre(l._key)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
            )}
          </div>

          {/* Columna derecha */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Factura original</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Número</span>
                  <span className="font-mono text-gray-800">{factura.numero}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total factura</span>
                  <span className="font-semibold text-gray-800">{factura.total.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-xl border border-red-100 p-5">
              <div className="text-xs font-medium text-red-500 uppercase tracking-wide mb-4">Importe del abono</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-red-400">Base imponible</span>
                  <span className="font-medium text-red-700">{baseImponible.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-400">IVA (21%)</span>
                  <span className="font-medium text-red-700">{iva.toFixed(2)} €</span>
                </div>
                <div className="border-t border-red-200 pt-2 flex justify-between">
                  <span className="text-sm font-semibold text-red-600">Total abono</span>
                  <span className="text-xl font-bold text-red-700">{totalAbono.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            {serieActual && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Serie de abono</div>
                <div className="text-sm font-semibold text-gray-800">{serieActual.nombre}</div>
                <div className="text-xs text-gray-400 font-mono mt-1">
                  Prefijo: {serieActual.prefijoAbono || `ABO-${serieActual.prefijo}`}
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}