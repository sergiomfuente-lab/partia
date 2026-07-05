"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search, Plus, FileText, Building2,
  Calendar, Eye, Clock, CheckCircle2,
  XCircle, Send,
} from "lucide-react";

type Presupuesto = {
  id:            string;
  numero:        string;
  fecha:         string;
  validezHasta:  string | null;
  estado:        string;
  total:         number;
  descripcion:   string | null;
  cliente:       { id: string; nombre: string };
  maquina:       { id: string; marca: string; modelo: string } | null;
  _count:        { ordenes: number };
};

type Cliente = { id: string; nombre: string };

const ESTADO_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  borrador:  { label: "Borrador",  className: "bg-gray-100 text-gray-500",    icon: <Clock size={12} /> },
  enviado:   { label: "Enviado",   className: "bg-blue-50 text-blue-700",     icon: <Send size={12} /> },
  aceptado:  { label: "Aceptado",  className: "bg-green-50 text-green-700",   icon: <CheckCircle2 size={12} /> },
  rechazado: { label: "Rechazado", className: "bg-red-50 text-red-700",       icon: <XCircle size={12} /> },
};

export default function PresupuestosLista({ clientes }: { clientes: Cliente[] }) {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loading, setLoading]           = useState(true);
  const [q, setQ]                       = useState("");
  const [clienteId, setClienteId]       = useState("");
  const [estado, setEstado]             = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q)         params.set("q", q);
    if (clienteId) params.set("clienteId", clienteId);
    if (estado)    params.set("estado", estado);

    fetch(`/api/presupuestos?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setPresupuestos(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [q, clienteId, estado]);

  const hayFiltros = q || clienteId || estado;

  const totalAceptado = presupuestos
    .filter((p) => p.estado === "aceptado")
    .reduce((acc, p) => acc + p.total, 0);

  const totalPendiente = presupuestos
    .filter((p) => p.estado === "enviado")
    .reduce((acc, p) => acc + p.total, 0);

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Presupuestos</h1>
          <p className="text-sm text-gray-400 mt-1">
            {presupuestos.length} presupuesto{presupuestos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/presupuestos/nuevo"
          className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors"
        >
          <Plus size={16} />
          Nuevo presupuesto
        </Link>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total presupuestos</div>
          <div className="text-2xl font-semibold text-gray-900">{presupuestos.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-blue-100 p-4">
          <div className="text-xs text-blue-500 uppercase tracking-wide mb-1">Pendiente respuesta</div>
          <div className="text-2xl font-semibold text-blue-700">
            {totalPendiente.toFixed(2)} <span className="text-sm font-normal text-blue-300">€</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-green-100 p-4">
          <div className="text-xs text-green-500 uppercase tracking-wide mb-1">Aceptado</div>
          <div className="text-2xl font-semibold text-green-700">
            {totalAceptado.toFixed(2)} <span className="text-sm font-normal text-green-300">€</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número o descripción..."
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
            { value: "",          label: "Todos" },
            { value: "borrador",  label: "Borrador" },
            { value: "enviado",   label: "Enviado" },
            { value: "aceptado",  label: "Aceptado" },
            { value: "rechazado", label: "Rechazado" },
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
          <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Número</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide">Fecha</div>
          <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Cliente</div>
          <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Descripción</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Órdenes</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-right">Total</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Estado</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Ver</div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400">Cargando...</div>
        ) : presupuestos.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 text-sm mb-2">
              {hayFiltros ? "No hay presupuestos que coincidan" : "No hay presupuestos todavía"}
            </p>
            {!hayFiltros && (
              <Link href="/presupuestos/nuevo" className="text-[#00C2FF] text-sm">
                Crear primer presupuesto →
              </Link>
            )}
          </div>
        ) : (
          presupuestos.map((p) => {
            const estadoInfo = ESTADO_CONFIG[p.estado] ?? ESTADO_CONFIG.borrador;
            const caducado   = p.validezHasta && new Date(p.validezHasta) < new Date();
            return (
              <div
                key={p.id}
                className="grid grid-cols-12 px-5 py-4 border-b border-gray-50 items-center hover:bg-gray-50 transition-colors"
              >
                <div className="col-span-2 text-sm font-medium text-[#185FA5] font-mono">
                  {p.numero}
                </div>
                <div className="col-span-1 flex items-center gap-1 text-sm text-gray-500">
                  <Calendar size={12} className="text-gray-300 shrink-0" />
                  {new Date(p.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                </div>
                <div className="col-span-3 flex items-center gap-1.5 text-sm text-gray-700 truncate">
                  <Building2 size={13} className="text-gray-300 shrink-0" />
                  <span className="truncate">{p.cliente.nombre}</span>
                </div>
                <div className="col-span-2 text-sm text-gray-400 truncate">
                  {p.descripcion || "—"}
                </div>
                <div className="col-span-1 text-sm text-gray-600 text-center">
                  {p._count.ordenes > 0 ? (
                    <span className="text-green-600 font-medium">{p._count.ordenes}</span>
                  ) : "—"}
                </div>
                <div className="col-span-1 text-sm font-semibold text-gray-800 text-right">
                  {p.total.toFixed(2)} €
                </div>
                <div className="col-span-1 flex justify-center">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                    caducado && p.estado === "enviado"
                      ? "bg-orange-50 text-orange-600"
                      : estadoInfo.className
                  }`}>
                    {estadoInfo.icon}
                    {caducado && p.estado === "enviado" ? "Caducado" : estadoInfo.label}
                  </span>
                </div>
                <div className="col-span-1 flex justify-center">
                  <Link
                    href={`/presupuestos/${p.id}`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors cursor-pointer"
                  >
                    <Eye size={15} />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {presupuestos.length > 0 && (
        <div className="mt-3 text-xs text-gray-400 text-right">
          Mostrando {presupuestos.length} presupuesto{presupuestos.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}