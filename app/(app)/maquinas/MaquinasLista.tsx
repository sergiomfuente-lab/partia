"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Wrench, Search, Clock, Building2 } from "lucide-react";

type Maquina = {
  id: string;
  marca: string;
  modelo: string;
  numeroDeSerie: string;
  matricula: string | null;
  horasActuales: number;
  estado: string;
  cliente: { id: string; nombre: string };
  _count: { ordenes: number };
};

type Cliente = { id: string; nombre: string };

const ESTADO_CONFIG: Record<string, { label: string; className: string }> = {
  activo:        { label: "Activo",        className: "bg-green-50 text-green-700" },
  inactivo:      { label: "Inactivo",      className: "bg-gray-100 text-gray-500" },
  en_reparacion: { label: "En reparación", className: "bg-amber-50 text-amber-700" },
};

export default function MaquinasLista() {
  const [maquinas, setMaquinas]   = useState<Maquina[]>([]);
  const [clientes, setClientes]   = useState<Cliente[]>([]);
  const [loading, setLoading]     = useState(true);
  const [q, setQ]                 = useState("");
  const [clienteId, setClienteId] = useState("");
  const [estado, setEstado]       = useState("");

  useEffect(() => {
    fetch("/api/clientes").then((r) => r.json()).then(setClientes);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q)         params.set("q", q);
    if (clienteId) params.set("clienteId", clienteId);
    if (estado)    params.set("estado", estado);

    fetch(`/api/maquinas?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setMaquinas(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [q, clienteId, estado]);

  const hayFiltros = q || clienteId || estado;

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Máquinas</h1>
          <p className="text-sm text-gray-400 mt-1">
            {maquinas.length} máquina{maquinas.length !== 1 ? "s" : ""} registrada{maquinas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/maquinas/nueva"
          className="bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Nueva máquina
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por marca, modelo o nº serie..."
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
            { value: "",             label: "Todos" },
            { value: "activo",       label: "Activos" },
            { value: "en_reparacion",label: "En reparación" },
            { value: "inactivo",     label: "Inactivos" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setEstado(f.value)}
              className={`px-4 py-2.5 text-sm rounded-lg font-medium transition-colors ${
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
        {/* Cabecera tabla */}
        <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div className="col-span-4 text-xs text-gray-400 uppercase tracking-wide">Máquina</div>
          <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Nº Serie</div>
          <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Cliente</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Horas</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Estado</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Órdenes</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Acciones</div>
        </div>

        {/* Estado vacío / loading */}
        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400">Cargando...</div>
        ) : maquinas.length === 0 ? (
          <div className="text-center py-20">
            <Wrench size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 text-sm mb-2">
              {hayFiltros ? "No hay máquinas que coincidan con los filtros" : "No hay máquinas todavía"}
            </p>
            {!hayFiltros && (
              <Link href="/maquinas/nueva" className="text-[#00C2FF] text-sm">
                Añadir primera máquina →
              </Link>
            )}
          </div>
        ) : (
          maquinas.map((m) => {
            const estadoInfo = ESTADO_CONFIG[m.estado] ?? ESTADO_CONFIG.activo;
            return (
              <div
                key={m.id}
                className="grid grid-cols-12 px-5 py-4 border-b border-gray-50 items-center hover:bg-gray-50 transition-colors"
              >
                {/* Máquina */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Wrench size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{m.marca} {m.modelo}</div>
                    <div className="text-xs text-gray-400">{m.cliente.nombre}</div>
                  </div>
                </div>

                {/* Nº serie / Matrícula */}
                <div className="col-span-2">
                  <div className="text-sm text-gray-500 font-mono">{m.numeroDeSerie}</div>
                  {m.matricula && (
                    <div className="text-xs text-gray-400 font-mono">{m.matricula}</div>
                  )}
                </div>

                {/* Cliente */}
                <div className="col-span-2 flex items-center gap-1.5 text-sm text-gray-500">
                  <Building2 size={13} className="text-gray-300 shrink-0" />
                  <span className="truncate">{m.cliente.nombre}</span>
                </div>

                {/* Horas */}
                <div className="col-span-1 flex items-center justify-center gap-1 text-sm text-gray-600">
                  <Clock size={13} className="text-gray-300" />
                  {m.horasActuales.toLocaleString("es-ES")}
                </div>

                {/* Estado */}
                <div className="col-span-1 flex justify-center">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${estadoInfo.className}`}>
                    {estadoInfo.label}
                  </span>
                </div>

                {/* Órdenes */}
                <div className="col-span-1 text-sm text-gray-600 text-center">
                  {m._count.ordenes}
                </div>

                {/* Acciones */}
                <div className="col-span-1 flex gap-2 justify-center">
                  <Link
                    href={`/maquinas/${m.id}`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                    title="Ver máquina"
                  >
                    <Eye size={15} />
                  </Link>
                  <Link
                    href={`/maquinas/${m.id}/editar`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors"
                    title="Editar máquina"
                  >
                    <Pencil size={15} />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {maquinas.length > 0 && (
        <div className="mt-3 text-xs text-gray-400 text-right">
          Mostrando {maquinas.length} máquina{maquinas.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}