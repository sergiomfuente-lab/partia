"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, FileText, Download, Pencil,
  CheckCircle2, Clock, XCircle, Send,
  Building2, Calendar, Wrench, Package,
  ClipboardList,
} from "lucide-react";
import { useState } from "react";

const ESTADO_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  borrador:  { label: "Borrador",  className: "bg-gray-100 text-gray-600 border border-gray-200",   icon: <Clock size={13} /> },
  enviado:   { label: "Enviado",   className: "bg-blue-50 text-blue-700 border border-blue-200",    icon: <Send size={13} /> },
  aceptado:  { label: "Aceptado",  className: "bg-green-50 text-green-700 border border-green-200", icon: <CheckCircle2 size={13} /> },
  rechazado: { label: "Rechazado", className: "bg-red-50 text-red-700 border border-red-200",       icon: <XCircle size={13} /> },
};

export default function PresupuestoDetalle({ presupuesto, empresa }: { presupuesto: any; empresa: any }) {
  const router = useRouter();
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const estadoInfo = ESTADO_CONFIG[presupuesto.estado] ?? ESTADO_CONFIG.borrador;
  const pdfUrl     = `/api/presupuestos/${presupuesto.id}/pdf`;

  const handleEstado = async (nuevoEstado: string) => {
    setCambiandoEstado(true);
    await fetch(`/api/presupuestos/${presupuesto.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ estado: nuevoEstado }),
    });
    setCambiandoEstado(false);
    router.refresh();
  };

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/presupuestos")}
            className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1 cursor-pointer">
            <ArrowLeft size={14} /> Volver
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-gray-900 font-mono">{presupuesto.numero}</h1>
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${estadoInfo.className}`}>
                  {estadoInfo.icon} {estadoInfo.label}
                </span>
              </div>
              <div className="text-sm text-gray-400 mt-0.5 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(presupuesto.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 size={12} />
                  {presupuesto.cliente.nombre}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
            <Download size={15} /> Descargar PDF
          </a>
          <Link href={`/presupuestos/${presupuesto.id}/editar`}
            className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Pencil size={14} /> Editar
          </Link>
        </div>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Base imponible</div>
          <div className="text-2xl font-semibold text-gray-900">{presupuesto.baseImponible.toFixed(2)} <span className="text-sm font-normal text-gray-400">€</span></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Descuento</div>
          <div className="text-2xl font-semibold text-red-500">-{presupuesto.descuento.toFixed(2)} <span className="text-sm font-normal text-red-300">€</span></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">IVA 21%</div>
          <div className="text-2xl font-semibold text-gray-900">{presupuesto.iva.toFixed(2)} <span className="text-sm font-normal text-gray-400">€</span></div>
        </div>
        <div className="bg-white rounded-xl border border-[#00C2FF] p-4">
          <div className="text-xs text-[#00C2FF] uppercase tracking-wide mb-1">Total</div>
          <div className="text-2xl font-bold text-[#0B1120]">{presupuesto.total.toFixed(2)} <span className="text-sm font-normal text-gray-400">€</span></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-4">
          {/* Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">Información</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Cliente</div>
                <Link href={`/clientes/${presupuesto.clienteId}`}
                  className="text-sm font-medium text-[#00C2FF] hover:underline">
                  {presupuesto.cliente.nombre}
                </Link>
              </div>
              {presupuesto.maquina && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Máquina</div>
                  <Link href={`/maquinas/${presupuesto.maquinaId}`}
                    className="text-sm font-medium text-[#00C2FF] hover:underline">
                    {presupuesto.maquina.marca} {presupuesto.maquina.modelo}
                  </Link>
                </div>
              )}
              {presupuesto.direccionReparacion && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Dirección</div>
                  <div className="text-sm text-gray-700">{presupuesto.direccionReparacion}</div>
                </div>
              )}
              {presupuesto.validezHasta && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Válido hasta</div>
                  <div className={`text-sm font-medium ${
                    new Date(presupuesto.validezHasta) < new Date() ? "text-red-500" : "text-gray-700"
                  }`}>
                    {new Date(presupuesto.validezHasta).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                    {new Date(presupuesto.validezHasta) < new Date() && " (Caducado)"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cambio de estado */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Cambiar estado</div>
            <div className="space-y-2">
              {["borrador", "enviado", "aceptado", "rechazado"].map((e) => {
                const info = ESTADO_CONFIG[e];
                return (
                  <button key={e} onClick={() => handleEstado(e)}
                    disabled={presupuesto.estado === e || cambiandoEstado}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      presupuesto.estado === e ? info.className : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}>
                    {info.icon} {info.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Órdenes vinculadas */}
          {presupuesto.ordenes.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ClipboardList size={15} className="text-gray-400" />
                Órdenes vinculadas
              </h3>
              <div className="space-y-2">
                {presupuesto.ordenes.map((o: any) => (
                  <Link key={o.id} href={`/ordenes/${o.id}`}
                    className="flex justify-between items-center hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors">
                    <span className="text-sm text-[#185FA5] font-mono">{o.numero}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      o.estado === "completado" ? "bg-green-50 text-green-700" :
                      o.estado === "pendiente"  ? "bg-yellow-50 text-yellow-700" :
                      "bg-blue-50 text-blue-700"
                    }`}>
                      {o.estado}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Observaciones internas */}
          {presupuesto.observaciones && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
              <h3 className="text-sm font-semibold text-amber-700 mb-2">Observaciones internas</h3>
              <p className="text-sm text-amber-800 leading-relaxed">{presupuesto.observaciones}</p>
            </div>
          )}
        </div>

        {/* Columna derecha */}
        <div className="col-span-2 space-y-6">
          {/* Descripción */}
          {presupuesto.descripcion && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Descripción del trabajo</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{presupuesto.descripcion}</p>
            </div>
          )}

          {/* Servicios libres */}
          {presupuesto.serviciosLibres.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <Wrench size={15} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700">Servicios</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {presupuesto.serviciosLibres.length}
                </span>
              </div>
              <div className="grid grid-cols-12 px-5 py-2 bg-gray-50 border-b border-gray-100">
                <div className="col-span-6 text-xs text-gray-400 uppercase tracking-wide">Descripción</div>
                <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">Cantidad</div>
                <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">Precio</div>
                <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-right">Total</div>
              </div>
              {presupuesto.serviciosLibres.map((s: any) => (
                <div key={s.id} className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center">
                  <div className="col-span-6 text-sm text-gray-800">{s.descripcion}</div>
                  <div className="col-span-2 text-sm text-gray-600 text-center">{s.cantidad}</div>
                  <div className="col-span-2 text-sm text-gray-600 text-center">{s.precio.toFixed(2)} €</div>
                  <div className="col-span-2 text-sm font-semibold text-gray-800 text-right">
                    {(s.cantidad * s.precio).toFixed(2)} €
                  </div>
                </div>
              ))}
              <div className="flex justify-end px-5 py-3 bg-gray-50">
                <span className="text-xs text-gray-500 mr-3">Total servicios</span>
                <span className="text-sm font-bold text-gray-800">
                  {presupuesto.serviciosLibres.reduce((a: number, s: any) => a + s.cantidad * s.precio, 0).toFixed(2)} €
                </span>
              </div>
            </div>
          )}

          {/* Repuestos */}
          {presupuesto.repuestos.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <Package size={15} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700">Materiales y repuestos</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {presupuesto.repuestos.length}
                </span>
              </div>
              <div className="grid grid-cols-12 px-5 py-2 bg-gray-50 border-b border-gray-100">
                <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Referencia</div>
                <div className="col-span-4 text-xs text-gray-400 uppercase tracking-wide">Descripción</div>
                <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Cant.</div>
                <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">P.Coste</div>
                <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">P.Venta</div>
                <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-right">Total</div>
              </div>
              {presupuesto.repuestos.map((r: any) => (
                <div key={r.id} className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center">
                  <div className="col-span-2 text-sm text-gray-400 font-mono">{r.referencia || "—"}</div>
                  <div className="col-span-4 text-sm text-gray-800">{r.descripcion}</div>
                  <div className="col-span-1 text-sm text-gray-600 text-center">{r.cantidad}</div>
                  <div className="col-span-2 text-sm text-gray-500 text-center">{r.precioCoste.toFixed(2)} €</div>
                  <div className="col-span-2 text-sm text-gray-500 text-center">{r.precioVenta.toFixed(2)} €</div>
                  <div className="col-span-1 text-sm font-semibold text-gray-800 text-right">
                    {(r.cantidad * r.precioVenta).toFixed(2)} €
                  </div>
                </div>
              ))}
              <div className="flex justify-end px-5 py-3 bg-gray-50">
                <span className="text-xs text-gray-500 mr-3">Total repuestos</span>
                <span className="text-sm font-bold text-gray-800">
                  {presupuesto.repuestos.reduce((a: number, r: any) => a + r.cantidad * r.precioVenta, 0).toFixed(2)} €
                </span>
              </div>
            </div>
          )}

          {/* Total final */}
          <div className="bg-[#0B1120] rounded-xl p-5">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Base imponible</span>
                <span className="text-white font-medium">{presupuesto.baseImponible.toFixed(2)} €</span>
              </div>
              {presupuesto.descuento > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    Descuento {presupuesto.tipoDescuento === "porcentaje" ? `(${presupuesto.descuentoValor}%)` : ""}
                  </span>
                  <span className="text-red-400 font-medium">-{presupuesto.descuento.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">IVA (21%)</span>
                <span className="text-white font-medium">{presupuesto.iva.toFixed(2)} €</span>
              </div>
            </div>
            <div className="border-t border-gray-700 pt-4 flex items-center justify-between">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Total presupuesto</div>
              <div className="text-3xl font-bold text-white">
                {presupuesto.total.toFixed(2)} <span className="text-lg font-normal text-gray-400">€</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}