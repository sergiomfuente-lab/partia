"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

type Stats = {
  periodo: { valor: string; label: string };
  facturacion: { totalFacturado: number; totalCobrado: number; numFacturas: number };
  pendienteCobro: {
    total: number;
    numPendientes: number;
    numVencidas: number;
    facturas: {
      id: string; numero: string; fecha: string; vencimiento: string | null;
      total: number; estado: string; cliente: { nombre: string }; diasAntiguedad: number;
    }[];
  };
  tecnicos: { id: string; nombre: string; ordenesCompletadas: number; horasTrabajo: number }[];
  stockBajo: { id: string; nombre: string; stock: number; stockMinimo: number; unidad: string }[];
};

const PERIODOS = [
  { value: "mes",          label: "Este mes" },
  { value: "mes_anterior", label: "Mes anterior" },
  { value: "anio",         label: "Este año" },
  { value: "historico",    label: "Histórico" },
];

const formatHoras = (horas: number) => {
  const totalMin = Math.round((horas ?? 0) * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

export default function DashboardPanel() {
  const [periodo, setPeriodo] = useState("mes");
  const [stats, setStats]     = useState<Stats | null>(null);
  const [error, setError]     = useState("");

  useEffect(() => {
    setStats(null);
    setError("");
    fetch(`/api/dashboard/stats?periodo=${periodo}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setStats(data);
      })
      .catch(() => setError("No se pudieron cargar los indicadores."));
  }, [periodo]);

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Indicadores</h2>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriodo(p.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                periodo === p.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

      {!stats && !error && (
        <div className="text-sm text-gray-400 text-center py-10 bg-white rounded-xl border border-gray-100">
          Cargando indicadores...
        </div>
      )}

      {stats && (
        <div className="space-y-6">
          {/* Facturación y cobros */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Facturado · {stats.periodo.label}</div>
              <div className="text-3xl font-semibold text-gray-900">{stats.facturacion.totalFacturado.toFixed(2)} €</div>
              <div className="text-xs text-gray-400 mt-2">
                {stats.facturacion.numFacturas} factura{stats.facturacion.numFacturas !== 1 ? "s" : ""} emitida{stats.facturacion.numFacturas !== 1 ? "s" : ""}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Cobrado · {stats.periodo.label}</div>
              <div className="text-3xl font-semibold text-green-700">{stats.facturacion.totalCobrado.toFixed(2)} €</div>
            </div>
            <div className="bg-amber-50/60 rounded-xl border border-amber-200 p-6">
              <div className="text-xs text-amber-600 uppercase tracking-wide mb-2">Pendiente de cobro (total)</div>
              <div className="text-3xl font-semibold text-amber-700">{stats.pendienteCobro.total.toFixed(2)} €</div>
              <div className="text-xs text-amber-600 mt-2">
                {stats.pendienteCobro.numPendientes} factura{stats.pendienteCobro.numPendientes !== 1 ? "s" : ""}
                {stats.pendienteCobro.numVencidas > 0 && ` · ${stats.pendienteCobro.numVencidas} vencida${stats.pendienteCobro.numVencidas !== 1 ? "s" : ""}`}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Facturas pendientes de cobro */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Facturas pendientes de cobro</h3>
                <Link href="/facturas?estado=pendiente" className="text-xs text-[#00C2FF]">Ver todas →</Link>
              </div>
              {stats.pendienteCobro.facturas.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-400">No hay facturas pendientes de cobro.</div>
              ) : (
                <div>
                  {stats.pendienteCobro.facturas.map((f) => (
                    <Link
                      key={f.id}
                      href={`/facturas/${f.id}`}
                      className="flex items-center justify-between px-5 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{f.numero} — {f.cliente.nombre}</div>
                        <div className={`text-xs mt-0.5 ${f.estado === "vencida" ? "text-red-500" : "text-gray-400"}`}>
                          {f.estado === "vencida" ? "Vencida" : "Pendiente"} · {f.diasAntiguedad} día{f.diasAntiguedad !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-800 shrink-0 ml-3">{f.total.toFixed(2)} €</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Rendimiento por técnico */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Rendimiento por técnico · {stats.periodo.label}</h3>
              </div>
              {stats.tecnicos.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-400">No hay técnicos dados de alta.</div>
              ) : (
                <div>
                  <div className="grid grid-cols-12 px-5 py-2 bg-gray-50 border-b border-gray-100">
                    <div className="col-span-6 text-xs text-gray-400 uppercase tracking-wide">Técnico</div>
                    <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide text-center">Órdenes</div>
                    <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide text-right">Horas</div>
                  </div>
                  {stats.tecnicos.map((t) => (
                    <div key={t.id} className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center">
                      <div className="col-span-6 text-sm text-gray-800 truncate">{t.nombre}</div>
                      <div className="col-span-3 text-sm text-gray-600 text-center">{t.ordenesCompletadas}</div>
                      <div className="col-span-3 text-sm text-gray-600 text-right">{formatHoras(t.horasTrabajo)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stock bajo mínimo */}
          {stats.stockBajo.length > 0 && (
            <div className="bg-white rounded-xl border border-red-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-red-100 bg-red-50/40">
                <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                  <AlertTriangle size={15} /> Stock por debajo del mínimo
                </h3>
                <Link href="/compras" className="text-xs text-[#00C2FF]">Ir a Almacén →</Link>
              </div>
              <div>
                {stats.stockBajo.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
                    <div className="text-sm text-gray-800">{p.nombre}</div>
                    <div className="text-xs text-gray-500">
                      Stock: <span className="font-semibold text-red-600">{p.stock}</span> / mínimo {p.stockMinimo} {p.unidad}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
