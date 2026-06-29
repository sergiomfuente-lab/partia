"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, FileText, Printer,
  CheckCircle2, Clock, AlertCircle, Pencil,
} from "lucide-react";

const ESTADO_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pendiente: { label: "Pendiente", className: "bg-yellow-50 text-yellow-700 border border-yellow-200", icon: <Clock size={13} /> },
  cobrada:   { label: "Cobrada",   className: "bg-green-50 text-green-700 border border-green-200",   icon: <CheckCircle2 size={13} /> },
  vencida:   { label: "Vencida",   className: "bg-red-50 text-red-700 border border-red-200",         icon: <AlertCircle size={13} /> },
};

export default function FacturaDetalle({
  factura, usuario, empresa,
}: {
  factura: any; usuario: any; empresa: any;
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

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 15mm; size: A4; }
          body * { visibility: hidden; }
          #factura-pdf, #factura-pdf * { visibility: visible; }
          #factura-pdf { position: fixed; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="p-8">
        {/* Cabecera gestión */}
        <div className="no-print">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/facturas")}
                className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={14} /> Volver
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <FileText size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-semibold text-gray-900 font-mono">{factura.numero}</h1>
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${estadoInfo.className}`}>
                      {estadoInfo.icon} {estadoInfo.label}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mt-0.5">
                    {factura.cliente.nombre} · {new Date(factura.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Printer size={15} /> Imprimir / PDF
              </button>
              <Link
                href={`/facturas/${factura.id}/editar`}
                className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Pencil size={14} /> Editar
              </Link>
            </div>
          </div>

          {/* Tarjetas resumen */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Base imponible</div>
              <div className="text-2xl font-semibold text-gray-900">{factura.baseImponible.toFixed(2)} <span className="text-sm font-normal text-gray-400">€</span></div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Descuento</div>
              <div className="text-2xl font-semibold text-red-500">-{factura.descuento.toFixed(2)} <span className="text-sm font-normal text-red-300">€</span></div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">IVA 21%</div>
              <div className="text-2xl font-semibold text-gray-900">{factura.iva.toFixed(2)} <span className="text-sm font-normal text-gray-400">€</span></div>
            </div>
            <div className="bg-white rounded-xl border border-[#00C2FF] p-4">
              <div className="text-xs text-[#00C2FF] uppercase tracking-wide mb-1">Total</div>
              <div className="text-2xl font-bold text-[#0B1120]">{factura.total.toFixed(2)} <span className="text-sm font-normal text-gray-400">€</span></div>
            </div>
          </div>

          {/* Cambio estado */}
          <div className="flex gap-2 mb-8">
            {["pendiente", "cobrada", "vencida"].map((e) => {
              const info = ESTADO_CONFIG[e];
              return (
                <button
                  key={e}
                  onClick={() => handleEstado(e)}
                  disabled={factura.estado === e || cambiandoEstado}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    factura.estado === e ? info.className : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {info.icon} {info.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* FACTURA IMPRIMIBLE */}
        <div id="factura-pdf" className="bg-white border border-gray-200 rounded-xl p-8 max-w-4xl mx-auto text-xs">

          {/* Cabecera */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-start gap-4">
              {empresa?.logoBase64 && (
                <img
                  src={empresa.logoBase64}
                  alt="Logo empresa"
                  className="max-h-16 max-w-32 object-contain"
                />
              )}
              <div>
                <div className="text-sm font-bold text-gray-900">{usuario?.nombreFiscal || "—"}</div>
                {usuario?.cifNif           && <div className="text-gray-500">{usuario.cifNif}</div>}
                {usuario?.direccionFiscal  && <div className="text-gray-500">{usuario.direccionFiscal}</div>}
                {(usuario?.codigoPostal || usuario?.ciudad) && (
                  <div className="text-gray-500">{usuario.codigoPostal} {usuario.ciudad} {usuario.provincia && `(${usuario.provincia})`}</div>
                )}
                {usuario?.telefono         && <div className="text-gray-500 mt-1">{usuario.telefono}</div>}
                {usuario?.emailFacturacion && <div className="text-gray-500">{usuario.emailFacturacion}</div>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 uppercase tracking-wide text-xs">Número de factura</div>
              <div className="text-base font-bold text-gray-900 font-mono">{factura.numero}</div>
              <div className="text-gray-400 uppercase tracking-wide text-xs mt-2">Fecha de factura</div>
              <div className="text-gray-700">
                {new Date(factura.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}
              </div>
              {factura.vencimiento && (
                <>
                  <div className="text-gray-400 uppercase tracking-wide text-xs mt-2">Vencimiento</div>
                  <div className="text-gray-700">
                    {new Date(factura.vencimiento).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Datos técnico / cliente */}
          <div className="flex justify-between mb-8 pb-6 border-b border-gray-200">
            <div className="w-1/2">
              <div className="text-gray-400 uppercase tracking-wide font-medium mb-1">Datos del técnico</div>
              <div className="font-semibold text-gray-800">{usuario?.nombreFiscal || "—"}</div>
              <div className="text-gray-500">{usuario?.cifNif}</div>
            </div>
            <div className="w-1/2 text-right">
              <div className="text-gray-400 uppercase tracking-wide font-medium mb-1">Facturar a</div>
              <div className="font-bold text-gray-900 text-sm">{factura.cliente.nombre}</div>
              {factura.cliente.razonSocial      && <div className="text-gray-600">{factura.cliente.razonSocial}</div>}
              {factura.cliente.cif              && <div className="text-gray-500">{factura.cliente.cif}</div>}
              {factura.cliente.direccionFacturacion && <div className="text-gray-500">{factura.cliente.direccionFacturacion}</div>}
            </div>
          </div>

          {/* Órdenes */}
          {factura.ordenes.map((orden: any) => (
            <div key={orden.id} className="mb-6">
              {/* Info máquina */}
              <div className="mb-3">
                <div className="font-semibold text-gray-700 uppercase tracking-wide mb-1">Información de máquina</div>
                <div className="text-gray-600">
                  Marca: <span className="font-medium">{orden.maquina.marca}</span> ·{" "}
                  Modelo: <span className="font-medium">{orden.maquina.modelo}</span> ·{" "}
                  Número de serie: <span className="font-medium font-mono">{orden.maquina.numeroDeSerie}</span>
                  {orden.direccionReparacion && ` · Dir. de reparación: ${orden.direccionReparacion}`}
                </div>
              </div>

              {/* Servicios */}
              {orden.servicios.length > 0 && (
                <div className="mb-4">
                  <div className="font-semibold text-gray-700 uppercase tracking-wide mb-2">Servicios</div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-1.5 text-gray-500 font-medium">Fecha</th>
                        <th className="text-left py-1.5 text-gray-500 font-medium">Tipo de servicio</th>
                        <th className="text-left py-1.5 text-gray-500 font-medium">Descripción de servicio</th>
                        <th className="text-right py-1.5 text-gray-500 font-medium">Cantidad</th>
                        <th className="text-right py-1.5 text-gray-500 font-medium">Coste</th>
                        <th className="text-right py-1.5 text-gray-500 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orden.servicios.map((s: any) => (
                        <tr key={s.id} className="border-b border-gray-100">
                          <td className="py-1.5 text-gray-600">
                            {new Date(s.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}
                          </td>
                          <td className="py-1.5 text-gray-800 font-medium">{s.tipoServicio.nombre}</td>
                          <td className="py-1.5 text-gray-600">{s.descripcion || "—"}</td>
                          <td className="py-1.5 text-gray-800 text-right">{s.cantidad} {s.tipoServicio.unidad}</td>
                          <td className="py-1.5 text-gray-600 text-right">{s.precio.toFixed(2)}</td>
                          <td className="py-1.5 text-gray-900 font-medium text-right">{(s.cantidad * s.precio).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Recambios */}
              {orden.repuestos.length > 0 && (
                <div className="mb-4">
                  <div className="font-semibold text-gray-700 uppercase tracking-wide mb-2">Recambios</div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-1.5 text-gray-500 font-medium">Nombre de recambio</th>
                        <th className="text-right py-1.5 text-gray-500 font-medium">Cantidad</th>
                        <th className="text-right py-1.5 text-gray-500 font-medium">Coste</th>
                        <th className="text-right py-1.5 text-gray-500 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orden.repuestos.map((r: any) => (
                        <tr key={r.id} className="border-b border-gray-100">
                          <td className="py-1.5 text-gray-800">
                            {r.referencia && <span className="font-mono text-gray-500 mr-2">{r.referencia}</span>}
                            {r.descripcion}
                          </td>
                          <td className="py-1.5 text-gray-600 text-right">{r.cantidad}</td>
                          <td className="py-1.5 text-gray-600 text-right">{r.precioVenta.toFixed(2)}</td>
                          <td className="py-1.5 text-gray-900 font-medium text-right">{(r.cantidad * r.precioVenta).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          {/* Totales */}
          <div className="flex justify-end mt-4">
            <div className="w-64">
              <div className="flex justify-between py-1.5 border-t border-gray-200">
                <span className="text-gray-500">Base imponible</span>
                <span className="font-medium text-gray-800">{factura.baseImponible.toFixed(2)} €</span>
              </div>
              {factura.descuento > 0 && (
                <div className="flex justify-between py-1.5 border-t border-gray-100">
                  <span className="text-gray-500">
                    Descuentos {factura.tipoDescuento === "porcentaje" ? `(${factura.descuentoValor}%)` : ""}
                  </span>
                  <span className="font-medium text-gray-800">- {factura.descuento.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-t border-gray-100">
                <span className="text-gray-500">Impuestos</span>
                <span className="font-medium text-gray-800">{factura.iva.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-gray-900 font-bold text-sm">
                <span>Total</span>
                <span>{factura.total.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Pie pago */}
          {(factura.cliente.formaPago || usuario?.iban) && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              {factura.cliente.formaPago && (
                <div className="text-gray-700 font-medium mb-0.5">Pago por {factura.cliente.formaPago}</div>
              )}
              {usuario?.iban && (
                <div className="text-gray-500 font-mono">{usuario.iban}</div>
              )}
            </div>
          )}

          {/* Notas */}
          {factura.notas && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-gray-500 leading-relaxed">{factura.notas}</p>
            </div>
          )}

          {/* RGPD */}
          {empresa?.textoRgpd && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-gray-400 leading-relaxed">{empresa.textoRgpd}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}