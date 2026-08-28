"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Wrench,
  Clock,
  Building2,
  Hash,
  ClipboardList,
  Pencil,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Package,
} from "lucide-react";

const ESTADO_MAQUINA: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  activo: {
    label: "Activo",
    className: "bg-green-50 text-green-700",
    icon: <CheckCircle2 size={13} />,
  },
  inactivo: {
    label: "Inactivo",
    className: "bg-gray-100 text-gray-500",
    icon: <XCircle size={13} />,
  },
  en_reparacion: {
    label: "En reparación",
    className: "bg-amber-50 text-amber-700",
    icon: <AlertCircle size={13} />,
  },
};

const ESTADO_ORDEN: Record<string, { label: string; className: string }> = {
  pendiente:   { label: "Pendiente",   className: "bg-yellow-50 text-yellow-700" },
  en_curso:    { label: "En curso",    className: "bg-blue-50 text-blue-700" },
  completado:  { label: "Completado",  className: "bg-green-50 text-green-700" },
};

export default function MaquinaDetalle({ maquina }: { maquina: any }) {
  const router = useRouter();
  const estadoInfo = ESTADO_MAQUINA[maquina.estado] ?? ESTADO_MAQUINA.activo;

  const totalHorasOrdenes = maquina.ordenes.reduce(
    (acc: number, o: any) => acc + o.horasTrabajadas, 0
  );

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/maquinas")}
            className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1"
          >
            <ArrowLeft size={14} />
            Volver
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Wrench size={22} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-gray-900">
                  {maquina.marca} {maquina.modelo}
                </h1>
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${estadoInfo.className}`}>
                  {estadoInfo.icon}
                  {estadoInfo.label}
                </span>
              </div>
              <div className="text-sm text-gray-400 mt-0.5 font-mono">
                Nº serie: {maquina.numeroDeSerie}
              </div>
              {maquina.matricula && (
                <div className="text-sm text-gray-400 mt-0.5 font-mono">
                  Matrícula / Nº parque: {maquina.matricula}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/ordenes/nueva?maquinaId=${maquina.id}&clienteId=${maquina.clienteId}`)}
            className="bg-[#00C2FF] text-[#0B1120] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#00a8db] transition-colors flex items-center gap-2"
          >
            <Plus size={15} />
            Nueva orden
          </button>
          <button
            onClick={() => router.push(`/maquinas/${maquina.id}/editar`)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Pencil size={14} />
            Editar
          </button>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Horas iniciales</div>
          <div className="text-2xl font-semibold text-gray-900">
            {maquina.horasIniciales.toLocaleString("es-ES")}
            <span className="text-sm font-normal text-gray-400 ml-1">h</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Horas actuales</div>
          <div className="text-2xl font-semibold text-gray-900">
            {maquina.horasActuales.toLocaleString("es-ES")}
            <span className="text-sm font-normal text-gray-400 ml-1">h</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Horas trabajadas</div>
          <div className="text-2xl font-semibold text-gray-900">
            {totalHorasOrdenes.toLocaleString("es-ES")}
            <span className="text-sm font-normal text-gray-400 ml-1">h</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Órdenes</div>
          <div className="text-2xl font-semibold text-gray-900">{maquina.ordenes.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Columna izquierda — info */}
        <div className="space-y-4">
          {/* Datos de la máquina */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
              Datos de la máquina
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Wrench size={14} className="text-gray-300 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Marca y modelo</div>
                  <div className="text-sm font-medium text-gray-800">{maquina.marca} {maquina.modelo}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Hash size={14} className="text-gray-300 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Número de serie</div>
                  <div className="text-sm font-medium text-gray-800 font-mono">{maquina.numeroDeSerie}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Hash size={14} className="text-gray-300 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Matrícula / Nº parque</div>
                  <div className="text-sm font-medium text-gray-800 font-mono">{maquina.matricula || "—"}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 size={14} className="text-gray-300 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Cliente</div>
                  <Link
                    href={`/clientes/${maquina.clienteId}`}
                    className="text-sm font-medium text-[#00C2FF] hover:underline"
                  >
                    {maquina.cliente.nombre}
                  </Link>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={14} className="text-gray-300 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Alta en el sistema</div>
                  <div className="text-sm font-medium text-gray-800">
                    {new Date(maquina.createdAt).toLocaleDateString("es-ES")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          {maquina.observaciones && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Observaciones</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{maquina.observaciones}</p>
            </div>
          )}
        </div>

        {/* Columna derecha — historial órdenes */}
        <div className="col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ClipboardList size={15} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Historial de órdenes
                </h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {maquina.ordenes.length}
                </span>
              </div>
              <button
                onClick={() => router.push(`/ordenes/nueva?maquinaId=${maquina.id}&clienteId=${maquina.clienteId}`)}
                className="text-xs text-[#00C2FF] hover:text-[#00a8db] font-medium flex items-center gap-1"
              >
                <Plus size={13} />
                Nueva orden
              </button>
            </div>

            {maquina.ordenes.length === 0 ? (
              <div className="text-center py-16">
                <ClipboardList size={40} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm mb-3">Sin órdenes registradas</p>
                <button
                  onClick={() => router.push(`/ordenes/nueva?maquinaId=${maquina.id}&clienteId=${maquina.clienteId}`)}
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
                    <th className="text-left text-xs text-gray-400 uppercase tracking-wide px-5 py-3 text-center">Horas</th>
                    <th className="text-left text-xs text-gray-400 uppercase tracking-wide px-5 py-3 text-center">Km</th>
                    <th className="text-left text-xs text-gray-400 uppercase tracking-wide px-5 py-3 text-center">Repuestos</th>
                    <th className="text-left text-xs text-gray-400 uppercase tracking-wide px-5 py-3">Estado</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {maquina.ordenes.map((orden: any) => {
                    const estadoOrden = ESTADO_ORDEN[orden.estado] ?? ESTADO_ORDEN.pendiente;
                    return (
                      <tr key={orden.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 text-sm font-medium text-[#185FA5]">{orden.numero}</td>
                        <td className="px-5 py-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-gray-300" />
                            {new Date(orden.fecha).toLocaleDateString("es-ES")}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-800 text-center">{orden.horasTrabajadas}h</td>
                        <td className="px-5 py-4 text-sm text-gray-800 text-center">{orden.kmDesplazamiento} km</td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                            <Package size={12} className="text-gray-300" />
                            {orden._count.repuestos}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${estadoOrden.className}`}>
                            {estadoOrden.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => router.push(`/ordenes/${orden.id}`)}
                            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}