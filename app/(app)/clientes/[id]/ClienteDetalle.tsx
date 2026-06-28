"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  cliente: any;
}

export default function ClienteDetalle({ cliente }: Props) {
  const router = useRouter();
  const [pestanaActiva, setPestanaActiva] = useState("informacion");

  const pestanas = [
    { id: "informacion", label: "Información" },
    { id: "maquinas", label: `Máquinas (${cliente.maquinas.length})` },
    { id: "ordenes", label: `Órdenes (${cliente.ordenes.length})` },
    { id: "facturas", label: `Facturas (${cliente.facturas.length})` },
  ];

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/clientes")}
            className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1"
          >
            ← Volver
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl font-bold">
              {cliente.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-gray-900">{cliente.nombre}</h1>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  cliente.activo ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}>
                  {cliente.activo ? "Activo" : "Inactivo"}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-50 text-blue-700">
                  {cliente.tipo === "empresa" ? "Empresa" : "Autónomo"}
                </span>
              </div>
              <div className="text-sm text-gray-400 mt-0.5">{cliente.cif} · {cliente.razonSocial || cliente.nombre}</div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/ordenes/nueva?clienteId=${cliente.id}`)}
            className="bg-[#00C2FF] text-[#0B1120] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#00a8db] transition-colors"
          >
            + Nueva orden
          </button>
          <button
            onClick={() => router.push(`/clientes/${cliente.id}/editar`)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Editar
          </button>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Máquinas</div>
          <div className="text-2xl font-semibold text-gray-900">{cliente.maquinas.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Órdenes</div>
          <div className="text-2xl font-semibold text-gray-900">{cliente.ordenes.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Facturas</div>
          <div className="text-2xl font-semibold text-gray-900">{cliente.facturas.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Precio/hora</div>
          <div className="text-2xl font-semibold text-gray-900">
            {cliente.precioHoraEspecial ? `${cliente.precioHoraEspecial}€` : "Estándar"}
          </div>
        </div>
      </div>

      {/* Pestañas escritorio */}
      <div className="hidden md:flex border-b border-gray-200 mb-6">
        {pestanas.map((p) => (
          <button
            key={p.id}
            onClick={() => setPestanaActiva(p.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              pestanaActiva === p.id
                ? "border-[#00C2FF] text-[#0B1120]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Pestañas móvil */}
      <div className="flex md:hidden overflow-x-auto gap-2 mb-6 pb-2">
        {pestanas.map((p) => (
          <button
            key={p.id}
            onClick={() => setPestanaActiva(p.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              pestanaActiva === p.id
                ? "bg-[#0B1120] text-white"
                : "bg-white border border-gray-200 text-gray-500"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Pestaña Información */}
      {pestanaActiva === "informacion" && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">Datos de facturación</h3>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Nombre</div>
                  <div className="text-sm font-medium text-gray-800">{cliente.nombre}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Razón social</div>
                  <div className="text-sm font-medium text-gray-800">{cliente.razonSocial || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">CIF / NIF</div>
                  <div className="text-sm font-medium text-gray-800">{cliente.cif}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Tipo</div>
                  <div className="text-sm font-medium text-gray-800">{cliente.tipo === "empresa" ? "Empresa" : "Autónomo"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-400 mb-1">Dirección de facturación</div>
                  <div className="text-sm font-medium text-gray-800">{cliente.direccionFacturacion || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Forma de pago</div>
                  <div className="text-sm font-medium text-gray-800">{cliente.formaPago || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Precio hora especial</div>
                  <div className="text-sm font-medium text-gray-800">
                    {cliente.precioHoraEspecial ? `${cliente.precioHoraEspecial}€/h` : "Precio estándar"}
                  </div>
                </div>
              </div>
            </div>

            {cliente.observaciones && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Observaciones</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{cliente.observaciones}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">Contacto</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Email</div>
                  <div className="text-sm font-medium text-gray-800">{cliente.email || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Teléfono</div>
                  <div className="text-sm font-medium text-gray-800">{cliente.telefono || "—"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pestaña Máquinas */}
      {pestanaActiva === "maquinas" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{cliente.maquinas.length} máquinas registradas</p>
            <button
              onClick={() => router.push(`/maquinas/nueva?clienteId=${cliente.id}`)}
              className="bg-[#0B1120] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#162030]"
            >
              + Nueva máquina
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {cliente.maquinas.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">⚙️</div>
                <p className="text-gray-400 text-sm mb-3">No hay máquinas registradas</p>
                <button
                  onClick={() => router.push(`/maquinas/nueva?clienteId=${cliente.id}`)}
                  className="text-[#00C2FF] text-sm"
                >
                  Añadir primera máquina →
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 uppercase tracking-wide px-5 py-3">Marca</th>
                    <th className="text-left text-xs text-gray-400 uppercase tracking-wide px-5 py-3">Modelo</th>
                    <th className="text-left text-xs text-gray-400 uppercase tracking-wide px-5 py-3">Nº Serie</th>
                    <th className="text-left text-xs text-gray-400 uppercase tracking-wide px-5 py-3">Horas</th>
                    <th className="text-left text-xs text-gray-400 uppercase tracking-wide px-5 py-3">Estado</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {cliente.maquinas.map((maquina: any) => (
                    <tr key={maquina.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-gray-800">{maquina.marca}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{maquina.modelo}</td>
                      <td className="px-5 py-4 text-sm text-gray-400 font-mono">{maquina.numeroDeSerie}</td>
                      <td className="px-5 py-4 text-sm text-gray-800">{maquina.horasActuales}h</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          maquina.estado === "activo" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        }`}>
                          {maquina.estado === "activo" ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => router.push(`/maquinas/${maquina.id}`)}
                          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Pestaña Órdenes */}
      {pestanaActiva === "ordenes" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{cliente.ordenes.length} órdenes registradas</p>
            <button
              onClick={() => router.push(`/ordenes/nueva?clienteId=${cliente.id}`)}
              className="bg-[#0B1120] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#162030]"
            >
              + Nueva orden
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {cliente.ordenes.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-400 text-sm mb-3">No hay órdenes registradas</p>
                <button
                  onClick={() => router.push(`/ordenes/nueva?clienteId=${cliente.id}`)}
                  className="text-[#00C2FF] text-sm"
                >
                  Crear primera orden →
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 uppercase tracking-wide px-5 py-3">Nº Orden</th>
                    <th className="text-left text-xs text-gray-400 uppercase tracking-wide px-5 py-3">Fecha</th>
                    <th className="text-left text-xs text-gray-400 uppercase tracking-wide px-5 py-3">Máquina</th>
                    <th className="text-left text-xs text-gray-400 uppercase tracking-wide px-5 py-3">Horas</th>
                    <th className="text-left text-xs text-gray-400 uppercase tracking-wide px-5 py-3">Km</th>
                    <th className="text-left text-xs text-gray-400 uppercase tracking-wide px-5 py-3">Estado</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {cliente.ordenes.map((orden: any) => (
                    <tr key={orden.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-[#185FA5]">{orden.numero}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{new Date(orden.fecha).toLocaleDateString("es-ES")}</td>
                      <td className="px-5 py-4 text-sm text-gray-800">{orden.maquina.marca} {orden.maquina.modelo}</td>
                      <td className="px-5 py-4 text-sm text-gray-800">{orden.horasTrabajadas}h</td>
                      <td className="px-5 py-4 text-sm text-gray-800">{orden.kmDesplazamiento} km</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          orden.estado === "completado" ? "bg-green-50 text-green-700" :
                          orden.estado === "pendiente" ? "bg-yellow-50 text-yellow-700" :
                          "bg-blue-50 text-blue-700"
                        }`}>
                          {orden.estado}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => router.push(`/ordenes/${orden.id}`)}
                          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-500 hover:bg-gray-50"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Pestaña Facturas */}
      {pestanaActiva === "facturas" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{cliente.facturas.length} facturas emitidas</p>
            <button
              onClick={() => router.push(`/facturas/nueva?clienteId=${cliente.id}`)}
              className="bg-[#0B1120] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#162030]"
            >
              + Nueva factura
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {cliente.facturas.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">🧾</div>
                <p className="text-gray-400 text-sm mb-3">No hay facturas emitidas</p>
                <button
                  onClick={() => router.push(`/facturas/nueva?clienteId=${cliente.id}`)}
                  className="text-[#00C2FF] text-sm"
                >
                  Crear primera factura →
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 uppercase tracking-wide px-5 py-3">Nº Factura</th>
                    <th className="text-left text-xs text-gray-400 uppercase tracking-wide px-5 py-3">Fecha</th>
                    <th className="text-left text-xs text-gray-400 uppercase tracking-wide px-5 py-3">Vencimiento</th>
                    <th className="text-left text-xs text-gray-400 uppercase tracking-wide px-5 py-3">Total</th>
                    <th className="text-left text-xs text-gray-400 uppercase tracking-wide px-5 py-3">Estado</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {cliente.facturas.map((factura: any) => (
                    <tr key={factura.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-[#185FA5]">{factura.numero}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{new Date(factura.fecha).toLocaleDateString("es-ES")}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{factura.vencimiento ? new Date(factura.vencimiento).toLocaleDateString("es-ES") : "—"}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-800">{factura.total.toFixed(2)}€</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          factura.estado === "cobrada" ? "bg-green-50 text-green-700" :
                          factura.estado === "pendiente" ? "bg-yellow-50 text-yellow-700" :
                          "bg-red-50 text-red-700"
                        }`}>
                          {factura.estado}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => router.push(`/facturas/${factura.id}`)}
                          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-500 hover:bg-gray-50"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}