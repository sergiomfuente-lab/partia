"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search, Plus, FileText, Building2,
  Calendar, Eye, CheckCircle2, Clock, AlertCircle,
} from "lucide-react";

type Factura = {
  id:            string;
  numero:        string;
  fecha:         string;
  vencimiento:   string | null;
  estado:        string;
  baseImponible: number;
  descuento:     number;
  iva:           number;
  total:         number;
  cliente:       { id: string; nombre: string };
  ordenes:       { id: string; numero: string }[];
};

type Cliente = { id: string; nombre: string };

const ESTADO_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pendiente: {
    label:     "Pendiente",
    className: "bg-yellow-50 text-yellow-700",
    icon:      <Clock size={12} />,
  },
  cobrada: {
    label:     "Cobrada",
    className: "bg-green-50 text-green-700",
    icon:      <CheckCircle2 size={12} />,
  },
  vencida: {
    label:     "Vencida",
    className: "bg-red-50 text-red-700",
    icon:      <AlertCircle size={12} />,
  },
};

export default function FacturasLista({ clientes }: { clientes: Cliente[] }) {
  const [facturas, setFacturas]     = useState<Factura[]>([]);
  const [loading, setLoading]       = useState(true);
  const [q, setQ]                   = useState("");
  const [clienteId, setClienteId]   = useState("");
  const [estado, setEstado]         = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q)         params.set("q", q);
    if (clienteId) params.set("clienteId", clienteId);
    if (estado)    params.set("estado", estado);

    fetch(`/api/facturas?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setFacturas(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [q, clienteId, estado]);

  const hayFiltros = q || clienteId || estado;

  // Totales
  const totalPendiente = facturas
    .filter((f) => f.estado === "pendiente")
    .reduce((acc, f) => acc + f.total, 0);
  const totalCobrado = facturas
    .filter((f) => f.estado === "cobrada")
    .reduce((acc, f) => acc + f.total, 0);

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Facturas</h1>
          <p className="text-sm text-gray-400 mt-1">
            {facturas.length} factura{facturas.length !== 1 ? "s" : ""} registrada{facturas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/facturas/nueva"
          className="bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Nueva factura
        </Link>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total facturas</div>
          <div className="text-2xl font-semibold text-gray-900">{facturas.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-yellow-100 p-4">
          <div className="text-xs text-yellow-600 uppercase tracking-wide mb-1">Pendiente de cobro</div>
          <div className="text-2xl font-semibold text-yellow-700">
            {totalPendiente.toFixed(2)}
            <span className="text-sm font-normal text-yellow-400 ml-1">€</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-green-100 p-4">
          <div className="text-xs text-green-600 uppercase tracking-wide mb-1">Total cobrado</div>
          <div className="text-2xl font-semibold text-green-700">
            {totalCobrado.toFixed(2)}
            <span className="text-sm font-normal text-green-400 ml-1">€</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número de factura..."
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
            { value: "",          label: "Todas" },
            { value: "pendiente", label: "Pendientes" },
            { value: "cobrada",   label: "Cobradas" },
            { value: "vencida",   label: "Vencidas" },
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
          <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Nº Factura</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide">Fecha</div>
          <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Cliente</div>
          <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Órdenes</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-right">Base</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-right">IVA</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-right">Total</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Estado</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Acción</div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400">Cargando...</div>
        ) : facturas.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 text-sm mb-2">
              {hayFiltros ? "No hay facturas que coincidan" : "No hay facturas todavía"}
            </p>
            {!hayFiltros && (
              <Link href="/facturas/nueva" className="text-[#00C2FF] text-sm">
                Crear primera factura →
              </Link>
            )}
          </div>
        ) : (
          facturas.map((f) => {
            const estadoInfo = ESTADO_CONFIG[f.estado] ?? ESTADO_CONFIG.pendiente;
            return (
              <div
                key={f.id}
                className="grid grid-cols-12 px-5 py-4 border-b border-gray-50 items-center hover:bg-gray-50 transition-colors"
              >
                {/* Nº Factura */}
                <div className="col-span-2 text-sm font-medium text-[#185FA5] font-mono">
                  {f.numero}
                </div>

                {/* Fecha */}
                <div className="col-span-1 flex items-center gap-1 text-sm text-gray-500">
                  <Calendar size={12} className="text-gray-300 shrink-0" />
                  {new Date(f.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                </div>

                {/* Cliente */}
                <div className="col-span-2 flex items-center gap-1.5 text-sm text-gray-700 truncate">
                  <Building2 size={13} className="text-gray-300 shrink-0" />
                  <span className="truncate">{f.cliente.nombre}</span>
                </div>

                {/* Órdenes */}
                <div className="col-span-2 text-xs text-gray-400 truncate">
                  {f.ordenes.map((o) => o.numero).join(", ")}
                </div>

                {/* Base */}
                <div className="col-span-1 text-sm text-gray-600 text-right">
                  {f.baseImponible.toFixed(2)} €
                </div>

                {/* IVA */}
                <div className="col-span-1 text-sm text-gray-600 text-right">
                  {f.iva.toFixed(2)} €
                </div>

                {/* Total */}
                <div className="col-span-1 text-sm font-bold text-gray-900 text-right">
                  {f.total.toFixed(2)} €
                </div>

                {/* Estado */}
                <div className="col-span-1 flex justify-center">
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${estadoInfo.className}`}>
                    {estadoInfo.icon}
                    {estadoInfo.label}
                  </span>
                </div>

                {/* Acción */}
                <div className="col-span-1 flex justify-center">
                  <Link
                    href={`/facturas/${f.id}`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors cursor-pointer"
                    title="Ver factura"
                  >
                    <Eye size={15} />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {facturas.length > 0 && (
        <div className="mt-3 text-xs text-gray-400 text-right">
          Mostrando {facturas.length} factura{facturas.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}