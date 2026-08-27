"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search, Plus, ClipboardList, Building2,
  Wrench, Calendar, ChevronRight, Eye,
} from "lucide-react";

type Orden = {
  id: string;
  numero: string;
  fecha: string;
  estado: string;
  direccionReparacion: string | null;
  cliente: { id: string; nombre: string };
  maquina: { id: string; marca: string; modelo: string };
  _count: { servicios: number; repuestos: number };
};

type Cliente = { id: string; nombre: string };

const ESTADO_CONFIG: Record<string, { label: string; className: string }> = {
  pendiente:  { label: "Pendiente",  className: "bg-yellow-50 text-yellow-700" },
  en_curso:   { label: "En curso",   className: "bg-blue-50 text-blue-700" },
  pausado:    { label: "Pausada",    className: "bg-orange-50 text-orange-700" },
  completado: { label: "Completado", className: "bg-green-50 text-green-700" },
};

export default function OrdenesLista({ clientes }: { clientes: Cliente[] }) {
  const [ordenes, setOrdenes]   = useState<Orden[]>([]);
  const [loading, setLoading]   = useState(true);
  const [q, setQ]               = useState("");
  const [clienteId, setClienteId] = useState("");
  const [estado, setEstado]     = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q)         params.set("q", q);
    if (clienteId) params.set("clienteId", clienteId);
    if (estado)    params.set("estado", estado);

    fetch(`/api/ordenes?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setOrdenes(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [q, clienteId, estado]);

  const hayFiltros = q || clienteId || estado;

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Órdenes</h1>
          <p className="text-sm text-gray-400 mt-1">
            {ordenes.length} orden{ordenes.length !== 1 ? "es" : ""} registrada{ordenes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/ordenes/nueva"
          className="bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Nueva orden
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nº orden, dirección o trabajos..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
          />
        </div>
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-gray-500"
        >
          <option value="">Todos los clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <div className="flex gap-2">
          {[
            { value: "",           label: "Todas" },
            { value: "pendiente",  label: "Pendientes" },
            { value: "en_curso",   label: "En curso" },
            { value: "pausado",    label: "Pausadas" },
            { value: "completado", label: "Completadas" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setEstado(f.value)}
              className={`px-4 py-2.5 text-sm rounded-lg font-medium transition-colors cursor-pointer ${
                estado === f.value
                  ? "bg-[#0B1120] text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Nº Orden</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide">Fecha</div>
          <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Cliente</div>
          <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Máquina</div>
          <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Dirección</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Servicios</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Estado</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Acciones</div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400">Cargando...</div>
        ) : ordenes.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardList size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 text-sm mb-2">
              {hayFiltros ? "No hay órdenes que coincidan con los filtros" : "No hay órdenes todavía"}
            </p>
            {!hayFiltros && (
              <Link href="/ordenes/nueva" className="text-[#00C2FF] text-sm">
                Crear primera orden →
              </Link>
            )}
          </div>
        ) : (
          ordenes.map((o) => {
            const estadoInfo = ESTADO_CONFIG[o.estado] ?? ESTADO_CONFIG.pendiente;
            return (
              <div
                key={o.id}
                className="grid grid-cols-12 px-5 py-4 border-b border-gray-50 items-center hover:bg-gray-50 transition-colors"
              >
                {/* Nº Orden */}
                <div className="col-span-2 text-sm font-medium text-[#185FA5] font-mono">
                  {o.numero}
                </div>

                {/* Fecha */}
                <div className="col-span-1 flex items-center gap-1.5 text-sm text-gray-500">
                  <Calendar size={12} className="text-gray-300 shrink-0" />
                  {new Date(o.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                </div>

                {/* Cliente */}
                <div className="col-span-2 flex items-center gap-1.5 text-sm text-gray-700 truncate">
                  <Building2 size={13} className="text-gray-300 shrink-0" />
                  <span className="truncate">{o.cliente.nombre}</span>
                </div>

                {/* Máquina */}
                <div className="col-span-2 flex items-center gap-1.5 text-sm text-gray-600 truncate">
                  <Wrench size={13} className="text-gray-300 shrink-0" />
                  <span className="truncate">{o.maquina.marca} {o.maquina.modelo}</span>
                </div>

                {/* Dirección */}
                <div className="col-span-2 text-sm text-gray-400 truncate">
                  {o.direccionReparacion || "—"}
                </div>

                {/* Servicios */}
                <div className="col-span-1 text-sm text-gray-600 text-center">
                  {o._count.servicios}
                </div>

                {/* Estado */}
                <div className="col-span-1 flex justify-center">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${estadoInfo.className}`}>
                    {estadoInfo.label}
                  </span>
                </div>

                {/* Acciones */}
                <div className="col-span-1 flex justify-center">
                  <Link
                    href={`/ordenes/${o.id}`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors cursor-pointer"
                    title="Ver orden"
                  >
                    <Eye size={15} />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {ordenes.length > 0 && (
        <div className="mt-3 text-xs text-gray-400 text-right">
          Mostrando {ordenes.length} orden{ordenes.length !== 1 ? "es" : ""}
        </div>
      )}
    </div>
  );
}