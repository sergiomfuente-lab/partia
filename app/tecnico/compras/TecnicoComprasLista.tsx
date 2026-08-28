"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Building2 } from "lucide-react";

type Compra = {
  id: string;
  fecha: string;
  proveedorNombre?: string;
  proveedor?: { nombre: string };
  total: number;
  fotoTicketBase64?: string;
  lineas: {
    id: string;
    descripcion: string;
    orden?: { id: string; numero: string } | null;
  }[];
};

export default function TecnicoComprasLista({ tecnicoId }: { tecnicoId: string }) {
  const [compras, setCompras]     = useState<Compra[] | null>(null);
  const [error, setError]         = useState("");
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/compras?tecnicoId=${tecnicoId}`)
      .then((r) => r.json())
      .then((data) => setCompras(Array.isArray(data) ? data : []))
      .catch(() => setError("No se pudieron cargar las compras."));
  }, [tecnicoId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Compras</h1>
        <Link
          href="/tecnico/compras/nueva"
          className="flex items-center gap-1.5 bg-[#00C2FF] text-white text-sm font-medium px-3.5 py-2 rounded-lg active:opacity-80"
        >
          <Plus size={16} /> Nueva
        </Link>
      </div>

      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

      {compras === null && !error && (
        <div className="text-sm text-gray-400 text-center py-10">Cargando…</div>
      )}

      {compras !== null && compras.length === 0 && (
        <div className="text-sm text-gray-400 text-center py-10">
          Todavía no has registrado ninguna compra.
        </div>
      )}

      {compras && compras.length > 0 && (
        <div className="space-y-2.5">
          {compras.map((c) => {
            const nombreProveedor = c.proveedor?.nombre ?? c.proveedorNombre ?? "Proveedor sin especificar";
            const ordenLigada     = c.lineas.find((l) => l.orden)?.orden;
            const fecha = new Date(c.fecha).toLocaleDateString("es-ES", {
              day: "2-digit", month: "2-digit", year: "numeric",
            });
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                      <Building2 size={13} className="text-gray-400 shrink-0" /> {nombreProveedor}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {fecha}{ordenLigada ? ` · Orden ${ordenLigada.numero}` : " · Compra suelta"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {c.lineas.map((l) => l.descripcion).join(", ")}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-sm font-semibold text-gray-800">{c.total.toFixed(2)} €</span>
                    {c.fotoTicketBase64 && (
                      <button type="button" onClick={() => setFotoAmpliada(c.fotoTicketBase64!)}>
                        <img
                          src={c.fotoTicketBase64}
                          alt="Ticket"
                          className="w-10 h-10 rounded-md object-cover border border-gray-200"
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {fotoAmpliada && (
        <div
          className="fixed inset-0 bg-black/70 z-30 flex items-center justify-center p-4"
          onClick={() => setFotoAmpliada(null)}
        >
          <img src={fotoAmpliada} alt="Ticket ampliado" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
