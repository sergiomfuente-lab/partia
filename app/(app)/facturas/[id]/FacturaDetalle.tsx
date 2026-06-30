"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pencil,
  Building2,
  Calendar,
} from "lucide-react";

const ESTADO_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pendiente: {
    label: "Pendiente",
    className: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    icon: <Clock size={13} />,
  },
  cobrada: {
    label: "Cobrada",
    className: "bg-green-50 text-green-700 border border-green-200",
    icon: <CheckCircle2 size={13} />,
  },
  vencida: {
    label: "Vencida",
    className: "bg-red-50 text-red-700 border border-red-200",
    icon: <AlertCircle size={13} />,
  },
};

export default function FacturaDetalle({
  factura,
  usuario,
  empresa,
}: {
  factura: any;
  usuario: any;
  empresa: any;
}) {
  const router = useRouter();
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const estadoInfo = ESTADO_CONFIG[factura.estado] ?? ESTADO_CONFIG.pendiente;

  const handleEstado = async (nuevoEstado: string) => {
    setCambiandoEstado(true);
    await fetch(`/api/facturas/${factura.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    setCambiandoEstado(false);
    router.refresh();
  };

  const pdfUrl = "/api/facturas/" + factura.id + "/pdf";

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/facturas")}
            className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={14} />
            Volver
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-gray-900 font-mono">{factura.numero}</h1>
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${estadoInfo.className}`}>
                  {estadoInfo.icon}
                  {estadoInfo.label}
                </span>
              </div>
              <div className="text-sm text-gray-400 mt-0.5 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(factura.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 size={12} />
                  {factura.cliente.nombre}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Download size={15} />
            Descargar PDF
          </Link>
          <Link
            href={`/facturas/${factura.id}/editar`}
            className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Pencil size={14} />
            Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Base imponible</div>
          <div className="text-2xl font-semibold text-gray-900">
            {factura.baseImponible.toFixed(2)}
            <span className="text-sm font-normal text-gray-400 ml-1">€</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Descuento</div>
          <div className="text-2xl font-semibold text-red-500">
            -{factura.descuento.toFixed(2)}
            <span className="text-sm font-normal text-red-300 ml-1">€</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">IVA 21%</div>
          <div className="text-2xl font-semibold text-gray-900">
            {factura.iva.toFixed(2)}
            <span className="text-sm font-normal text-gray-400 ml-1">€</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#00C2FF] p-4">
          <div className="text-xs text-[#00C2FF] uppercase tracking-wide mb-1">Total</div>
          <div className="text-2xl font-bold text-[#0B1120]">
            {factura.total.toFixed(2)}
            <span className="text-sm font-normal text-gray-400 ml-1">€</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-8">
        {["pendiente", "cobrada", "vencida"].map((e) => {
          const info = ESTADO_CONFIG[e];
          return (
            <button
              key={e}
              onClick={() => handleEstado(e)}
              disabled={factura.estado === e || cambiandoEstado}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                factura.estado === e
                  ? info.className
                  : "border border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {info.icon}
              {info.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
              Información
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Cliente</div>
                <Link
                  href={`/clientes/${factura.clienteId}`}
                  className="text-sm font-medium text-[#00C2FF] hover:underline"
                >
                  {factura.cliente.nombre}
                </Link>
              </div>
              {factura.cliente.cif && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">CIF / NIF</div>
                  <div className="text-sm font-medium text-gray-800 font-mono">{factura.cliente.cif}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Fecha emisión</div>
                <div className="text-sm font-medium text-gray-800">
                  {new Date(factura.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                </div>
              </div>
              {factura.vencimiento && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Vencimiento</div>
                  <div className="text-sm font-medium text-gray-800">
                    {new Date(factura.vencimiento).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                  </div>
                </div>
              )}
              {factura.cliente.formaPago && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Forma de pago</div>
                  <div className="text-sm font-medium text-gray-800">{factura.cliente.formaPago}</div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Órdenes incluidas
              <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-normal">
                {factura.ordenes.length}
              </span>
            </h3>
            <div className="space-y-2">
              {factura.ordenes.map((o: any) => {
                const importe =
                  o.servicios.reduce((a: number, s: any) => a + s.cantidad * s.precio, 0) +
                  o.repuestos.reduce((a: number, r: any) => a + r.cantidad * r.precioVenta, 0);
                return (
                  <div key={o.id} className="flex justify-between items-center">
                    <Link
                      href={`/ordenes/${o.id}`}
                      className="text-sm text-[#185FA5] font-mono hover:underline"
                    >
                      {o.numero}
                    </Link>
                    <span className="text-sm text-gray-600">{importe.toFixed(2)} €</span>
                  </div>
                );
              })}
            </div>
          </div>

          {factura.notas && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Notas</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{factura.notas}</p>
            </div>
          )}
        </div>

        <div className="col-span-2 space-y-6">
          {factura.ordenes.map((orden: any) => (
            <div key={orden.id} className="space-y-4">
              <div className="bg-gray-50 rounded-xl border border-gray-200 px-5 py-3">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Máquina</div>
                <div className="text-sm font-medium text-gray-800">
                  {orden.maquina.marca} {orden.maquina.modelo}
                  <span className="text-gray-400 font-mono ml-2 font-normal text-xs">
                    {orden.maquina.numeroDeSerie}
                  </span>
                </div>
                {orden.direccionReparacion && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    Dir. reparación: {orden.direccionReparacion}
                  </div>
                )}
              </div>

              {orden.servicios.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Servicios</h3>
                  </div>
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
                      <div className="col-span-3 text-sm font-medium text-gray-800">{s.tipoServicio.nombre}</div>
                      <div className="col-span-3 text-sm text-gray-500">{s.descripcion || "—"}</div>
                      <div className="col-span-1 text-sm text-gray-800 text-center">
                        {s.cantidad} {s.tipoServicio.unidad}
                      </div>
                      <div className="col-span-1 text-sm text-gray-500 text-center">{s.precio.toFixed(2)} €</div>
                      <div className="col-span-2 text-sm font-semibold text-gray-800 text-right">
                        {(s.cantidad * s.precio).toFixed(2)} €
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end px-5 py-3 bg-gray-50">
                    <span className="text-xs text-gray-500 mr-3">Total servicios</span>
                    <span className="text-sm font-bold text-gray-800">
                      {orden.servicios.reduce((a: number, s: any) => a + s.cantidad * s.precio, 0).toFixed(2)} €
                    </span>
                  </div>
                </div>
              )}

              {orden.repuestos.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recambios</h3>
                  </div>
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
                      <div className="col-span-2 text-sm text-gray-400 font-mono">{r.referencia || "—"}</div>
                      <div className="col-span-4 text-sm font-medium text-gray-800">{r.descripcion}</div>
                      <div className="col-span-1 text-sm text-gray-800 text-center">{r.cantidad}</div>
                      <div className="col-span-2 text-sm text-gray-500 text-center">{r.precioCoste.toFixed(2)} €</div>
                      <div className="col-span-2 text-sm text-gray-500 text-center">{r.precioVenta.toFixed(2)} €</div>
                      <div className="col-span-1 text-sm font-semibold text-gray-800 text-right">
                        {(r.cantidad * r.precioVenta).toFixed(2)} €
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end px-5 py-3 bg-gray-50">
                    <span className="text-xs text-gray-500 mr-3">Total recambios</span>
                    <span className="text-sm font-bold text-gray-800">
                      {orden.repuestos.reduce((a: number, r: any) => a + r.cantidad * r.precioVenta, 0).toFixed(2)} €
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="bg-[#0B1120] rounded-xl p-5">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Base imponible</span>
                <span className="text-white font-medium">{factura.baseImponible.toFixed(2)} €</span>
              </div>
              {factura.descuento > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    Descuento {factura.tipoDescuento === "porcentaje" ? `(${factura.descuentoValor}%)` : ""}
                  </span>
                  <span className="text-red-400 font-medium">-{factura.descuento.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">IVA (21%)</span>
                <span className="text-white font-medium">{factura.iva.toFixed(2)} €</span>
              </div>
            </div>
            <div className="border-t border-gray-700 pt-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total factura</div>
                <div className="text-xs text-gray-500">Base + IVA</div>
              </div>
              <div className="text-3xl font-bold text-white">
                {factura.total.toFixed(2)}
                <span className="text-lg font-normal text-gray-400 ml-1">€</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}