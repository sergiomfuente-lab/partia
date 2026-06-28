"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Users, Search } from "lucide-react";

interface Cliente {
  id: string;
  nombre: string;
  razonSocial: string | null;
  cif: string;
  email: string | null;
  tipo: string;
  _count: { maquinas: number; ordenes: number };
}

interface Props {
  clientes: Cliente[];
}

export default function ClientesLista({ clientes }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const clientesFiltrados = clientes.filter((c) => {
    const coincideBusqueda =
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.cif.toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.email?.toLowerCase().includes(busqueda.toLowerCase()) ?? false) ||
      (c.razonSocial?.toLowerCase().includes(busqueda.toLowerCase()) ?? false);

    const coincideTipo =
      filtroTipo === "todos" || c.tipo === filtroTipo;

    return coincideBusqueda && coincideTipo;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-400 mt-1">{clientes.length} clientes registrados</p>
        </div>
        <Link
          href="/clientes/nuevo"
          className="bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Nuevo cliente
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, CIF, razón social o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: "todos", label: "Todos" },
            { value: "empresa", label: "Empresas" },
            { value: "autonomo", label: "Autónomos" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltroTipo(f.value)}
              className={`px-4 py-2.5 text-sm rounded-lg font-medium transition-colors ${
                filtroTipo === f.value
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
          <div className="col-span-4 text-xs text-gray-400 uppercase tracking-wide">Cliente</div>
          <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">CIF / NIF</div>
          <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Tipo</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Máquinas</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Órdenes</div>
          <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">Acciones</div>
        </div>

        {clientesFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <Users size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 text-sm mb-2">
              {busqueda || filtroTipo !== "todos"
                ? "No hay clientes que coincidan con los filtros"
                : "No hay clientes todavía"}
            </p>
            {!busqueda && filtroTipo === "todos" && (
              <Link href="/clientes/nuevo" className="text-[#00C2FF] text-sm">
                Añadir primer cliente →
              </Link>
            )}
          </div>
        ) : (
          clientesFiltrados.map((cliente) => (
            <div
              key={cliente.id}
              className="grid grid-cols-12 px-5 py-4 border-b border-gray-50 items-center hover:bg-gray-50 transition-colors"
            >
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-sm font-bold flex-shrink-0">
                  {cliente.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{cliente.nombre}</div>
                  <div className="text-xs text-gray-400">{cliente.email || "Sin email"}</div>
                </div>
              </div>
              <div className="col-span-2 text-sm text-gray-500 font-mono">{cliente.cif}</div>
              <div className="col-span-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  cliente.tipo === "empresa"
                    ? "bg-green-50 text-green-700"
                    : "bg-blue-50 text-blue-700"
                }`}>
                  {cliente.tipo === "empresa" ? "Empresa" : "Autónomo"}
                </span>
              </div>
              <div className="col-span-1 text-sm text-gray-600 text-center">{cliente._count.maquinas}</div>
              <div className="col-span-1 text-sm text-gray-600 text-center">{cliente._count.ordenes}</div>
              <div className="col-span-2 flex gap-2 justify-center">
                <Link
                  href={`/clientes/${cliente.id}`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                  title="Ver cliente"
                >
                  <Eye size={15} />
                </Link>
                <Link
                  href={`/clientes/${cliente.id}/editar`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors"
                  title="Editar cliente"
                >
                  <Pencil size={15} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {clientesFiltrados.length > 0 && (
        <div className="mt-3 text-xs text-gray-400 text-right">
          Mostrando {clientesFiltrados.length} de {clientes.length} clientes
        </div>
      )}
    </div>
  );
}