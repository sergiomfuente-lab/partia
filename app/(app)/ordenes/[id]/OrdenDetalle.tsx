"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ClipboardList, Pencil, MapPin,
  Building2, Wrench, Calendar, FileText,
  CheckCircle2, Clock, AlertCircle, Package,
  FileCheck,
} from "lucide-react";

const ESTADO_ORDEN: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pendiente:  {
    label: "Pendiente",
    className: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    icon: <AlertCircle size={13} />,
  },
  en_curso:   {
    label: "En curso",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
    icon: <Clock size={13} />,
  },
  completado: {
    label: "Completado",
    className: "bg-green-50 text-green-700 border border-green-200",
    icon: <CheckCircle2 size={13} />,
  },
};

const ESTADO_FACTURA: Record<string, { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "bg-yellow-50 text-yellow-700" },
  cobrada:   { label: "Cobrada",   className: "bg-green-50 text-green-700" },
  vencida:   { label: "Vencida",   className: "bg-red-50 text-red-700" },
};

export default function OrdenDetalle({ orden }: { orden: any }) {
  const router = useRouter();

  const estadoInfo = ESTADO_ORDEN[orden.estado] ?? ESTADO_ORDEN.pendiente;

  const totalServicios = orden.servicios.reduce(
    (acc: number, s: any) => acc + s.cantidad * s.precio, 0
  );
  const totalRepuestos = orden.repuestos.reduce(
    (acc: number, r: any) => acc + r.cantidad * r.precioVenta, 0
  );
  const totalOrden = totalServicios + totalRepuestos;

  const handleCambioEstado = async (nuevoEstado: string) => {
    await fetch(`/api/ordenes/${orden.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    router.refresh();
  };

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/ordenes")}
            className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={14} />
            Volver
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <ClipboardList size={22} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-gray-900 font-mono">{orden.numero}</h1>
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${estadoInfo.className}`}>
                  {estadoInfo.icon}
                  {estadoInfo.label}
                </span>
              </div>
              <div className="text-sm text-gray-400 mt-0.5 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(orden.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                </span>
                {orden.direccionReparacion && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {orden.direccionReparacion}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Cambio de estado */}
          {orden.estado === "pendiente" && (
            <button
              onClick={() => handleCambioEstado("en_curso")}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Clock size={15} />
              Iniciar
            </button>
          )}
          {orden.estado === "en_curso" && (
            <button
              onClick={() => handleCambioEstado("completado")}
              className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={15} />
              Completar
            </button>
          )}
          <button
            onClick={() => router.push(`/ordenes/${orden.id}/editar`)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Pencil size={14} />
            Editar
          </button>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total servicios</div>
          <div className="text-2xl font-semibold text-gray-900">
            {totalServicios.toFixed(2)}
            <span className="text-sm font-normal text-gray-400 ml-1">€</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total repuestos</div>
          <div className="text-2xl font-semibold text-gray-900">
            {totalRepuestos.toFixed(2)}
            <span className="text-sm font-normal text-gray-400 ml-1">€</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total orden</div>
          <div className="text-2xl font-bold text-[#0B1120]">
            {totalOrden.toFixed(2)}
            <span className="text-sm font-normal text-gray-400 ml-1">€</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Factura</div>
          {orden.factura ? (
            <Link href={`/facturas/${orden.factura.id}`} className="block">
              <div className="text-sm font-semibold text-[#185FA5]">{orden.factura.numero}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_FACTURA[orden.factura.estado]?.className}`}>
                {ESTADO_FACTURA[orden.factura.estado]?.label}
              </span>
            </Link>
          ) : (
            <div className="text-sm text-gray-400">Sin factura</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-4">

          {/* Info cliente y máquina */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
              Información
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 size={14} className="text-gray-300 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Cliente</div>
                  <Link
                    href={`/clientes/${orden.clienteId}`}
                    className="text-sm font-medium text-[#00C2FF] hover:underline"
                  >
                    {orden.cliente.nombre}
                  </Link>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Wrench size={14} className="text-gray-300 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Máquina</div>
                  <Link
                    href={`/maquinas/${orden.maquinaId}`}
                    className="text-sm font-medium text-[#00C2FF] hover:underline"
                  >
                    {orden.maquina.marca} {orden.maquina.modelo}
                  </Link>
                  <div className="text-xs text-gray-400 font-mono">{orden.maquina.numeroDeSerie}</div>
                </div>
              </div>
              {orden.direccionReparacion && (
                <div className="flex items-start gap-3">
                  <MapPin size={14} className="text-gray-300 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Dirección</div>
                    <div className="text-sm font-medium text-gray-800">{orden.direccionReparacion}</div>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar size={14} className="text-gray-300 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Fecha</div>
                  <div className="text-sm font-medium text-gray-800">
                    {new Date(orden.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trabajos realizados */}
          {orden.trabajosRealizados && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={14} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700">Trabajos realizados</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {orden.trabajosRealizados}
              </p>
            </div>
          )}

          {/* Observaciones internas */}
          {orden.observaciones && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={14} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-amber-700">Observaciones internas</h3>
              </div>
              <p className="text-sm text-amber-800 leading-relaxed">
                {orden.observaciones}
              </p>
            </div>
          )}

          {/* Estado */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Cambiar estado
            </div>
            <div className="space-y-2">
              {["pendiente", "en_curso", "completado"].map((e) => {
                const info = ESTADO_ORDEN[e];
                return (
                  <button
                    key={e}
                    onClick={() => handleCambioEstado(e)}
                    disabled={orden.estado === e}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      orden.estado === e
                        ? `${info.className} opacity-100`
                        : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {info.icon}
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna derecha — servicios y repuestos */}
        <div className="col-span-2 space-y-6">

          {/* Servicios */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <Wrench size={15} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">Registro de servicios</h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {orden.servicios.length}
              </span>
            </div>

            {orden.servicios.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm">Sin servicios registrados</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-12 px-5 py-2 bg-gray-50 border-b border-gray-100">
                  <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Fecha</div>
                  <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Tipo</div>
                  <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Descripción</div>
                  <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Cant.</div>
                  <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Precio</div>
                  <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-right">Total</div>
                </div>
                {orden.servicios.map((s: any) => (
                  <div key={s.id} className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center">
                    <div className="col-span-2 text-sm text-gray-500">
                      {new Date(s.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })}
                    </div>
                    <div className="col-span-3 text-sm font-medium text-gray-800">
                      {s.tipoServicio.nombre}
                    </div>
                    <div className="col-span-3 text-sm text-gray-500">
                      {s.descripcion || "—"}
                    </div>
                    <div className="col-span-1 text-sm text-gray-800 text-center">
                      {s.cantidad} {s.tipoServicio.unidad}
                    </div>
                    <div className="col-span-1 text-sm text-gray-500 text-center">
                      {s.precio.toFixed(2)}€
                    </div>
                    <div className="col-span-2 text-sm font-semibold text-gray-800 text-right">
                      {(s.cantidad * s.precio).toFixed(2)} €
                    </div>
                  </div>
                ))}
                <div className="flex justify-end px-5 py-3 bg-gray-50">
                  <span className="text-xs text-gray-500 mr-3">Total servicios</span>
                  <span className="text-sm font-bold text-gray-800">{totalServicios.toFixed(2)} €</span>
                </div>
              </div>
            )}
          </div>

          {/* Repuestos */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <Package size={15} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">Registro de repuestos</h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {orden.repuestos.length}
              </span>
            </div>

            {orden.repuestos.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm">Sin repuestos registrados</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-12 px-5 py-2 bg-gray-50 border-b border-gray-100">
                  <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Referencia</div>
                  <div className="col-span-4 text-xs text-gray-400 uppercase tracking-wide">Descripción</div>
                  <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Cant.</div>
                  <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">P. Coste</div>
                  <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">P. Venta</div>
                  <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-right">Total</div>
                </div>
                {orden.repuestos.map((r: any) => (
                  <div key={r.id} className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center">
                    <div className="col-span-2 text-sm text-gray-400 font-mono">
                      {r.referencia || "—"}
                    </div>
                    <div className="col-span-4 text-sm font-medium text-gray-800">
                      {r.descripcion}
                    </div>
                    <div className="col-span-1 text-sm text-gray-800 text-center">
                      {r.cantidad}
                    </div>
                    <div className="col-span-2 text-sm text-gray-500 text-center">
                      {r.precioCoste.toFixed(2)} €
                    </div>
                    <div className="col-span-2 text-sm text-gray-500 text-center">
                      {r.precioVenta.toFixed(2)} €
                    </div>
                    <div className="col-span-1 text-sm font-semibold text-gray-800 text-right">
                      {(r.cantidad * r.precioVenta).toFixed(2)} €
                    </div>
                  </div>
                ))}
                <div className="flex justify-end px-5 py-3 bg-gray-50">
                  <span className="text-xs text-gray-500 mr-3">Total repuestos</span>
                  <span className="text-sm font-bold text-gray-800">{totalRepuestos.toFixed(2)} €</span>
                </div>
              </div>
            )}
          </div>

          {/* Total final */}
          <div className="bg-[#0B1120] rounded-xl p-5 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total orden</div>
              <div className="text-xs text-gray-500">Servicios + Repuestos (sin IVA)</div>
            </div>
            <div className="text-3xl font-bold text-white">
              {totalOrden.toFixed(2)} <span className="text-lg font-normal text-gray-400">€</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}