"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ClipboardList, Plus, Trash2,
  Wrench, Save, MapPin, FileText, Package,
} from "lucide-react";

type TipoServicio = {
  id: string;
  nombre: string;
  unidad: string;
};

type LineaServicio = {
  _key: string;
  fecha: string;
  tipoServicioId: string;
  cantidad: number;
  precio: number;
  descripcion: string;
};

type LineaRepuesto = {
  _key: string;
  referencia: string;
  descripcion: string;
  cantidad: number;
  precioCoste: number;
  precioVenta: number;
};

const uid = () => Math.random().toString(36).slice(2, 9);
const toDateInput = (d: string) => new Date(d).toISOString().split("T")[0];

export default function EditarOrdenForm({
  orden,
  tiposServicio,
  precioHoraDefault,
  precioPorKmDefault,
}: {
  orden: any;
  tiposServicio: TipoServicio[];
  precioHoraDefault: number;
  precioPorKmDefault: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const precioHora   = orden.cliente.precioHoraEspecial   ?? precioHoraDefault;
  const precioPorKm  = orden.cliente.precioPorKmEspecial  ?? precioPorKmDefault;

  const [form, setForm] = useState({
    fecha:               toDateInput(orden.fecha),
    direccionReparacion: orden.direccionReparacion ?? "",
    trabajosRealizados:  orden.trabajosRealizados  ?? "",
    observaciones:       orden.observaciones       ?? "",
  });

  const [servicios, setServicios] = useState<LineaServicio[]>(
    orden.servicios.map((s: any) => ({
      _key:           uid(),
      fecha:          toDateInput(s.fecha),
      tipoServicioId: s.tipoServicioId,
      cantidad:       s.cantidad,
      precio:         s.precio,
      descripcion:    s.descripcion ?? "",
    }))
  );

  const [repuestos, setRepuestos] = useState<LineaRepuesto[]>(
    orden.repuestos.map((r: any) => ({
      _key:        uid(),
      referencia:  r.referencia  ?? "",
      descripcion: r.descripcion,
      cantidad:    r.cantidad,
      precioCoste: r.precioCoste,
      precioVenta: r.precioVenta,
    }))
  );

  const setField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // --- Servicios ---
  const addServicio = () => {
    const primerTipo = tiposServicio[0];
    const precio = primerTipo?.unidad === "h" ? precioHora : precioPorKm;
    setServicios((prev) => [
      ...prev,
      {
        _key:           uid(),
        fecha:          toDateInput(orden.fecha),
        tipoServicioId: primerTipo?.id ?? "",
        cantidad:       0,
        precio,
        descripcion:    "",
      },
    ]);
  };

  const updateServicio = (key: string, field: string, value: any) =>
    setServicios((prev) =>
      prev.map((s) => {
        if (s._key !== key) return s;
        const updated = { ...s, [field]: value };
        if (field === "tipoServicioId") {
          const tipo = tiposServicio.find((t) => t.id === value);
          updated.precio = tipo?.unidad === "h" ? precioHora : precioPorKm;
        }
        return updated;
      })
    );

  const removeServicio = (key: string) =>
    setServicios((prev) => prev.filter((s) => s._key !== key));

  // --- Repuestos ---
  const addRepuesto = () =>
    setRepuestos((prev) => [
      ...prev,
      {
        _key:        uid(),
        referencia:  "",
        descripcion: "",
        cantidad:    1,
        precioCoste: 0,
        precioVenta: 0,
      },
    ]);

  const updateRepuesto = (key: string, field: string, value: any) =>
    setRepuestos((prev) =>
      prev.map((r) => (r._key === key ? { ...r, [field]: value } : r))
    );

  const removeRepuesto = (key: string) =>
    setRepuestos((prev) => prev.filter((r) => r._key !== key));

  // --- Totales ---
  const totalServicios = servicios.reduce((acc, s) => acc + s.cantidad * s.precio, 0);
  const totalRepuestos = repuestos.reduce((acc, r) => acc + r.cantidad * r.precioVenta, 0);
  const totalOrden     = totalServicios + totalRepuestos;

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch(`/api/ordenes/${orden.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        servicios: servicios.map((s) => ({
          fecha:          s.fecha,
          tipoServicioId: s.tipoServicioId,
          cantidad:       Number(s.cantidad),
          precio:         Number(s.precio),
          descripcion:    s.descripcion,
          esManoObra:     tiposServicio.find((t) => t.id === s.tipoServicioId)?.unidad === "h",
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
      setError(data.error ?? "Error al guardar los cambios.");
      setLoading(false);
      return;
    }

    router.push(`/ordenes/${orden.id}`);
  };

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href={`/ordenes/${orden.id}`}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Editar orden</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {orden.numero} · {orden.cliente.nombre} · {orden.maquina.marca} {orden.maquina.modelo}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/ordenes/${orden.id}`}
            className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancelar
          </Link>
          <button
            form="editar-orden-form"
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save size={15} />
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      <form id="editar-orden-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">

          {/* Columna principal */}
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
                      Fecha inicio
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
                      <MapPin size={11} className="inline mr-1" />
                      Dirección de reparación
                    </label>
                    <input
                      type="text"
                      placeholder="Calle, ciudad..."
                      value={form.direccionReparacion}
                      onChange={(e) => setField("direccionReparacion", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                    />
                  </div>
                </div>

                {/* Cliente y máquina — solo lectura */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Cliente
                    </label>
                    <div className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                      {orden.cliente.nombre}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Máquina
                    </label>
                    <div className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                      {orden.maquina.marca} {orden.maquina.modelo}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    <FileText size={11} className="inline mr-1" />
                    Trabajos realizados
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe los trabajos realizados..."
                    value={form.trabajosRealizados}
                    onChange={(e) => setField("trabajosRealizados", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Observaciones internas
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Notas internas (no visibles para el cliente)..."
                    value={form.observaciones}
                    onChange={(e) => setField("observaciones", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white resize-none"
                  />
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
                <button
                  type="button"
                  onClick={addServicio}
                  className="flex items-center gap-1.5 text-xs text-[#00C2FF] hover:text-[#00a8db] font-medium cursor-pointer"
                >
                  <Plus size={13} />
                  Añadir línea
                </button>
              </div>

              {servicios.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-sm mb-3">Sin servicios añadidos</p>
                  <button type="button" onClick={addServicio} className="text-[#00C2FF] text-sm cursor-pointer">
                    + Añadir primer servicio
                  </button>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-12 px-5 py-2 bg-gray-50 border-b border-gray-100">
                    <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Fecha</div>
                    <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Tipo</div>
                    <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Descripción</div>
                    <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Cantidad</div>
                    <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">Precio</div>
                    <div className="col-span-1"></div>
                  </div>
                  {servicios.map((s) => {
                    const tipo = tiposServicio.find((t) => t.id === s.tipoServicioId);
                    return (
                      <div key={s._key} className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center gap-2">
                        <div className="col-span-2">
                          <input
                            type="date"
                            value={s.fecha}
                            onChange={(e) => updateServicio(s._key, "fecha", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                          />
                        </div>
                        <div className="col-span-3">
                          <select
                            value={s.tipoServicioId}
                            onChange={(e) => updateServicio(s._key, "tipoServicioId", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-gray-700"
                          >
                            {tiposServicio.map((t) => (
                              <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            placeholder="Descripción opcional..."
                            value={s.descripcion}
                            onChange={(e) => updateServicio(s._key, "descripcion", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                          />
                        </div>
                        <div className="col-span-1">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={s.cantidad}
                            onChange={(e) => updateServicio(s._key, "cantidad", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center"
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={s.precio}
                              onChange={(e) => updateServicio(s._key, "precio", parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center"
                            />
                            <span className="text-xs text-gray-400 shrink-0">€/{tipo?.unidad ?? "ud"}</span>
                          </div>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeServicio(s._key)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-end px-5 py-3 bg-gray-50">
                    <span className="text-xs text-gray-500 mr-3">Total servicios</span>
                    <span className="text-sm font-semibold text-gray-800">{totalServicios.toFixed(2)} €</span>
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
                <button
                  type="button"
                  onClick={addRepuesto}
                  className="flex items-center gap-1.5 text-xs text-[#00C2FF] hover:text-[#00a8db] font-medium cursor-pointer"
                >
                  <Plus size={13} />
                  Añadir repuesto
                </button>
              </div>

              {repuestos.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-sm mb-3">Sin repuestos añadidos</p>
                  <button type="button" onClick={addRepuesto} className="text-[#00C2FF] text-sm cursor-pointer">
                    + Añadir primer repuesto
                  </button>
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
                          <input
                            type="text"
                            placeholder="Ref..."
                            value={r.referencia}
                            onChange={(e) => updateRepuesto(r._key, "referencia", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white font-mono"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            placeholder="Descripción..."
                            value={r.descripcion}
                            onChange={(e) => updateRepuesto(r._key, "descripcion", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                          />
                        </div>
                        <div className="col-span-1">
                          <input
                            type="number"
                            min="1"
                            value={r.cantidad}
                            onChange={(e) => updateRepuesto(r._key, "cantidad", parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={r.precioCoste}
                            onChange={(e) => updateRepuesto(r._key, "precioCoste", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={r.precioVenta}
                            onChange={(e) => updateRepuesto(r._key, "precioVenta", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center"
                          />
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
                          <button
                            type="button"
                            onClick={() => removeRepuesto(r._key)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          >
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

            {/* Tarifas */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Tarifas aplicadas
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Mano de obra</span>
                  <span className="font-medium text-gray-800">{precioHora.toFixed(2)} €/h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Desplazamiento</span>
                  <span className="font-medium text-gray-800">{precioPorKm.toFixed(2)} €/km</span>
                </div>
                {orden.cliente.precioHoraEspecial && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-[#00C2FF]">Tarifa especial aplicada</span>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen económico */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Resumen económico
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Servicios</span>
                  <span className="font-medium text-gray-800">{totalServicios.toFixed(2)} €</span>
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

            {/* Info máquina y cliente — solo lectura */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Datos fijos
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Cliente</div>
                  <div className="text-sm font-medium text-gray-800">{orden.cliente.nombre}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Máquina</div>
                  <div className="text-sm font-medium text-gray-800">
                    {orden.maquina.marca} {orden.maquina.modelo}
                  </div>
                  <div className="text-xs text-gray-400 font-mono">{orden.maquina.numeroDeSerie}</div>
                </div>
                <div className="pt-1 border-t border-gray-100">
                  <div className="text-xs text-gray-400">El cliente y la máquina no se pueden cambiar una vez creada la orden</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}