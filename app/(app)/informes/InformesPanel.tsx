"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, Download, CheckSquare, Square } from "lucide-react";

type Cliente = { id: string; nombre: string };
type Tecnico = { id: string; nombre: string };

type Tabla = "clientes" | "maquinas" | "ordenes" | "facturas" | "presupuestos";

type Columna = { key: string; label: string };

// Debe reflejar exactamente las columnas disponibles en lib/informes.ts
// (COLUMNAS) — si se añade un campo allí, añadirlo también aquí para que
// aparezca como opción marcable.
const COLUMNAS: Record<Tabla, Columna[]> = {
  clientes: [
    { key: "nombre", label: "Nombre" },
    { key: "nombreComercial", label: "Nombre comercial" },
    { key: "razonSocial", label: "Razón social" },
    { key: "cif", label: "CIF / NIF" },
    { key: "tipo", label: "Tipo" },
    { key: "email", label: "Email" },
    { key: "telefono", label: "Teléfono" },
    { key: "direccionFacturacion", label: "Dirección de facturación" },
    { key: "formaPago", label: "Forma de pago" },
    { key: "observaciones", label: "Observaciones" },
    { key: "activo", label: "Activo" },
    { key: "precioHoraEspecial", label: "Precio/hora especial" },
    { key: "precioPorKmEspecial", label: "Precio/km especial" },
    { key: "totalMaquinas", label: "Nº máquinas" },
    { key: "totalOrdenes", label: "Nº órdenes" },
    { key: "fechaAlta", label: "Fecha de alta" },
  ],
  maquinas: [
    { key: "marca", label: "Marca" },
    { key: "modelo", label: "Modelo" },
    { key: "numeroDeSerie", label: "Número de serie" },
    { key: "matricula", label: "Matrícula / Nº parque" },
    { key: "cliente", label: "Cliente" },
    { key: "estado", label: "Estado" },
    { key: "horasIniciales", label: "Horas iniciales" },
    { key: "horasActuales", label: "Horas actuales" },
    { key: "observaciones", label: "Observaciones" },
    { key: "totalOrdenes", label: "Nº órdenes" },
    { key: "fechaAlta", label: "Fecha de alta" },
  ],
  ordenes: [
    { key: "numero", label: "Nº orden" },
    { key: "fecha", label: "Fecha" },
    { key: "cliente", label: "Cliente" },
    { key: "maquina", label: "Máquina" },
    { key: "matricula", label: "Matrícula máquina" },
    { key: "tecnico", label: "Técnico" },
    { key: "estado", label: "Estado" },
    { key: "horasTrabajo", label: "Horas de trabajo" },
    { key: "direccionReparacion", label: "Dirección reparación" },
    { key: "trabajosRealizados", label: "Trabajos realizados" },
    { key: "observaciones", label: "Observaciones" },
    { key: "numServicios", label: "Nº servicios" },
    { key: "numRepuestos", label: "Nº repuestos" },
    { key: "facturada", label: "Facturada" },
    { key: "fechaAlta", label: "Fecha de creación" },
  ],
  facturas: [
    { key: "numero", label: "Nº factura" },
    { key: "fecha", label: "Fecha" },
    { key: "vencimiento", label: "Vencimiento" },
    { key: "cliente", label: "Cliente" },
    { key: "estado", label: "Estado" },
    { key: "esDirecta", label: "Factura directa" },
    { key: "serie", label: "Serie" },
    { key: "baseImponible", label: "Base imponible" },
    { key: "descuento", label: "Descuento" },
    { key: "iva", label: "IVA" },
    { key: "total", label: "Total" },
    { key: "fechaPago", label: "Fecha de pago" },
    { key: "pagadoPor", label: "Pagada / marcada por" },
    { key: "notas", label: "Notas" },
  ],
  presupuestos: [
    { key: "numero", label: "Nº presupuesto" },
    { key: "fecha", label: "Fecha" },
    { key: "validezHasta", label: "Válido hasta" },
    { key: "cliente", label: "Cliente" },
    { key: "maquina", label: "Máquina" },
    { key: "estado", label: "Estado" },
    { key: "direccionReparacion", label: "Dirección reparación" },
    { key: "descripcion", label: "Descripción" },
    { key: "observaciones", label: "Observaciones" },
    { key: "baseImponible", label: "Base imponible" },
    { key: "descuento", label: "Descuento" },
    { key: "iva", label: "IVA" },
    { key: "total", label: "Total" },
    { key: "notas", label: "Notas" },
  ],
};

const TABLA_LABELS: Record<Tabla, string> = {
  clientes: "Clientes",
  maquinas: "Máquinas",
  ordenes: "Órdenes de trabajo",
  facturas: "Facturas",
  presupuestos: "Presupuestos",
};

const ESTADOS_POR_TABLA: Record<Tabla, { value: string; label: string }[] | null> = {
  clientes: null,
  maquinas: [
    { value: "activo", label: "Activo" },
    { value: "inactivo", label: "Inactivo" },
    { value: "en_reparacion", label: "En reparación" },
  ],
  ordenes: [
    { value: "pendiente", label: "Pendiente" },
    { value: "en_curso", label: "En curso" },
    { value: "pausado", label: "Pausada" },
    { value: "completado", label: "Completado" },
    { value: "cancelado", label: "Cancelado" },
  ],
  facturas: [
    { value: "pendiente", label: "Pendiente" },
    { value: "cobrada", label: "Cobrada" },
    { value: "vencida", label: "Vencida" },
  ],
  presupuestos: [
    { value: "borrador", label: "Borrador" },
    { value: "enviado", label: "Enviado" },
    { value: "aceptado", label: "Aceptado" },
    { value: "rechazado", label: "Rechazado" },
  ],
};

// Qué filtros extra (aparte de fechas, que siempre están disponibles) tiene
// cada tabla.
const MUESTRA_CLIENTE: Record<Tabla, boolean> = {
  clientes: false, maquinas: true, ordenes: true, facturas: true, presupuestos: true,
};
const MUESTRA_TECNICO: Record<Tabla, boolean> = {
  clientes: false, maquinas: false, ordenes: true, facturas: false, presupuestos: false,
};
const MUESTRA_TIPO_ACTIVO: Record<Tabla, boolean> = {
  clientes: true, maquinas: false, ordenes: false, facturas: false, presupuestos: false,
};

interface Filtros {
  clienteId: string;
  tecnicoId: string;
  estado: string;
  fechaDesde: string;
  fechaHasta: string;
  activo: string;
  tipo: string;
}

const FILTROS_VACIOS: Filtros = {
  clienteId: "", tecnicoId: "", estado: "", fechaDesde: "", fechaHasta: "", activo: "", tipo: "",
};

export default function InformesPanel({ clientes, tecnicos }: { clientes: Cliente[]; tecnicos: Tecnico[] }) {
  const [tabla, setTabla] = useState<Tabla>("clientes");
  const [camposPorTabla, setCamposPorTabla] = useState<Record<Tabla, string[]>>(() => {
    const inicial: any = {};
    (Object.keys(COLUMNAS) as Tabla[]).forEach((t) => { inicial[t] = COLUMNAS[t].map((c) => c.key); });
    return inicial;
  });
  const [filtrosPorTabla, setFiltrosPorTabla] = useState<Record<Tabla, Filtros>>(() => {
    const inicial: any = {};
    (Object.keys(COLUMNAS) as Tabla[]).forEach((t) => { inicial[t] = { ...FILTROS_VACIOS }; });
    return inicial;
  });
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");

  const campos = camposPorTabla[tabla];
  const filtros = filtrosPorTabla[tabla];
  const columnasTabla = COLUMNAS[tabla];
  const estadosTabla = ESTADOS_POR_TABLA[tabla];

  const setCampos = (nuevos: string[]) =>
    setCamposPorTabla((prev) => ({ ...prev, [tabla]: nuevos }));
  const setFiltro = (campo: keyof Filtros, valor: string) =>
    setFiltrosPorTabla((prev) => ({ ...prev, [tabla]: { ...prev[tabla], [campo]: valor } }));

  const toggleCampo = (key: string) => {
    setCampos(campos.includes(key) ? campos.filter((k) => k !== key) : [...campos, key]);
  };

  const seleccionarTodos = () => setCampos(columnasTabla.map((c) => c.key));
  const seleccionarNinguno = () => setCampos([]);

  const handleGenerar = async () => {
    if (campos.length === 0) { setError("Selecciona al menos una columna."); return; }
    setGenerando(true);
    setError("");

    try {
      const res = await fetch("/api/informes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tabla, campos, filtros }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo generar el informe.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tabla}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message ?? "No se pudo generar el informe.");
    } finally {
      setGenerando(false);
    }
  };

  const hayFiltrosActivos = useMemo(
    () => Object.values(filtros).some((v) => v !== ""),
    [filtros]
  );

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Informes</h1>
        <p className="text-sm text-gray-400 mt-1">
          Genera extracciones en Excel eligiendo qué campos incluir de cada tabla.
        </p>
      </div>

      {/* Pestañas de tabla */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {(Object.keys(TABLA_LABELS) as Tabla[]).map((t) => (
          <button key={t} onClick={() => setTabla(t)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              tabla === t
                ? "border-[#00C2FF] text-[#0B1120]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}>
            <FileSpreadsheet size={15} />
            {TABLA_LABELS[t]}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Columnas a exportar */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Campos a incluir</h2>
            <div className="flex gap-3 text-xs">
              <button onClick={seleccionarTodos} className="text-[#00C2FF] hover:underline cursor-pointer flex items-center gap-1">
                <CheckSquare size={13} /> Todos
              </button>
              <button onClick={seleccionarNinguno} className="text-gray-400 hover:underline cursor-pointer flex items-center gap-1">
                <Square size={13} /> Ninguno
              </button>
            </div>
          </div>
          <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-3">
            {columnasTabla.map((c) => (
              <label key={c.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={campos.includes(c.key)}
                  onChange={() => toggleCampo(c.key)}
                  className="w-4 h-4 accent-[#0B1120] cursor-pointer"
                />
                {c.label}
              </label>
            ))}
          </div>
        </div>

        {/* Filtros + generar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 pb-1">Filtros</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Desde</label>
                <input type="date" value={filtros.fechaDesde}
                  onChange={(e) => setFiltro("fechaDesde", e.target.value)}
                  className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Hasta</label>
                <input type="date" value={filtros.fechaHasta}
                  onChange={(e) => setFiltro("fechaHasta", e.target.value)}
                  className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
              </div>
            </div>

            {MUESTRA_CLIENTE[tabla] && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Cliente</label>
                <select value={filtros.clienteId} onChange={(e) => setFiltro("clienteId", e.target.value)}
                  className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white">
                  <option value="">Todos los clientes</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            )}

            {MUESTRA_TECNICO[tabla] && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Técnico</label>
                <select value={filtros.tecnicoId} onChange={(e) => setFiltro("tecnicoId", e.target.value)}
                  className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white">
                  <option value="">Todos los técnicos</option>
                  {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
            )}

            {estadosTabla && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Estado</label>
                <select value={filtros.estado} onChange={(e) => setFiltro("estado", e.target.value)}
                  className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white">
                  <option value="">Todos los estados</option>
                  {estadosTabla.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
            )}

            {MUESTRA_TIPO_ACTIVO[tabla] && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Tipo</label>
                  <select value={filtros.tipo} onChange={(e) => setFiltro("tipo", e.target.value)}
                    className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white">
                    <option value="">Todos</option>
                    <option value="empresa">Empresa</option>
                    <option value="autonomo">Autónomo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Estado</label>
                  <select value={filtros.activo} onChange={(e) => setFiltro("activo", e.target.value)}
                    className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white">
                    <option value="">Todos</option>
                    <option value="true">Solo activos</option>
                    <option value="false">Solo inactivos</option>
                  </select>
                </div>
              </>
            )}

            {hayFiltrosActivos && (
              <button onClick={() => setFiltrosPorTabla((prev) => ({ ...prev, [tabla]: { ...FILTROS_VACIOS } }))}
                className="text-xs text-gray-400 hover:underline cursor-pointer">
                Quitar filtros
              </button>
            )}
          </div>

          <button onClick={handleGenerar} disabled={generando}
            className="w-full flex items-center justify-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-3 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer">
            <Download size={16} />
            {generando ? "Generando..." : "Generar Excel"}
          </button>
          <p className="text-xs text-gray-400 text-center">
            {campos.length} de {columnasTabla.length} campos seleccionados
          </p>
        </div>
      </div>
    </div>
  );
}
