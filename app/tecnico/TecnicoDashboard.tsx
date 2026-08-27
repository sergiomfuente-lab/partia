"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus, Clock, PlayCircle, PauseCircle, CheckCircle2, AlertCircle,
  ChevronRight, Building2, Wrench,
} from "lucide-react";

type Orden = {
  id: string;
  numero: string;
  fecha: string;
  estado: string;
  cliente: { id: string; nombre: string };
  maquina: { id: string; marca: string; modelo: string };
  tecnico: { id: string; nombre: string } | null;
};

const ESTADO_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pendiente:  { label: "Pendiente",  className: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: <Clock size={12} /> },
  en_curso:   { label: "En curso",   className: "bg-blue-50 text-blue-700 border-blue-200",       icon: <PlayCircle size={12} /> },
  pausado:    { label: "Pausada",    className: "bg-orange-50 text-orange-700 border-orange-200", icon: <PauseCircle size={12} /> },
  completado: { label: "Completado", className: "bg-green-50 text-green-700 border-green-200",    icon: <CheckCircle2 size={12} /> },
  cancelado:  { label: "Cancelado",  className: "bg-red-50 text-red-700 border-red-200",          icon: <AlertCircle size={12} /> },
};

export default function TecnicoDashboard({ tecnicoId }: { tecnicoId: string }) {
  const [tab, setTab]       = useState<"mias" | "todas">("mias");
  const [ordenes, setOrdenes] = useState<Orden[] | null>(null);
  const [error, setError]   = useState("");

  useEffect(() => {
    setOrdenes(null);
    const url = tab === "mias" ? `/api/ordenes?tecnicoId=${tecnicoId}` : "/api/ordenes";
    fetch(url)
      .then((r) => r.json())
      .then((data) => setOrdenes(Array.isArray(data) ? data : []))
      .catch(() => setError("No se pudieron cargar las órdenes."));
  }, [tab, tecnicoId]);

  const activas = (ordenes ?? []).filter((o) => o.estado !== "completado" && o.estado !== "cancelado");
  const resto   = (ordenes ?? []).filter((o) => o.estado === "completado" || o.estado === "cancelado");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Órdenes</h1>
        <Link
          href="/tecnico/ordenes/nueva"
          className="flex items-center gap-1.5 bg-[#00C2FF] text-white text-sm font-medium px-3.5 py-2 rounded-lg active:opacity-80"
        >
          <Plus size={16} /> Nueva
        </Link>
      </div>

      <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
        <button
          onClick={() => setTab("mias")}
          className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
            tab === "mias" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          Mis órdenes
        </button>
        <button
          onClick={() => setTab("todas")}
          className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
            tab === "todas" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          Todas
        </button>
      </div>

      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

      {ordenes === null && !error && (
        <div className="text-sm text-gray-400 text-center py-10">Cargando…</div>
      )}

      {ordenes !== null && ordenes.length === 0 && (
        <div className="text-sm text-gray-400 text-center py-10">
          {tab === "mias" ? "No tienes órdenes asignadas." : "No hay órdenes todavía."}
        </div>
      )}

      {[...activas, ...resto].length > 0 && (
        <div className="space-y-2.5">
          {[...activas, ...resto].map((orden) => {
            const estadoInfo = ESTADO_CONFIG[orden.estado] ?? ESTADO_CONFIG.pendiente;
            return (
              <Link
                key={orden.id}
                href={`/tecnico/ordenes/${orden.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-4 active:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">{orden.numero}</span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded border ${estadoInfo.className}`}>
                        {estadoInfo.icon} {estadoInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
                      <Building2 size={12} className="shrink-0" /> {orden.cliente?.nombre}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 truncate mt-0.5">
                      <Wrench size={12} className="shrink-0" /> {orden.maquina?.marca} {orden.maquina?.modelo}
                    </div>
                    {tab === "todas" && orden.tecnico && (
                      <div className="text-[11px] text-gray-400 mt-1">Asignada a {orden.tecnico.nombre}</div>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-gray-300 shrink-0 mt-1" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
