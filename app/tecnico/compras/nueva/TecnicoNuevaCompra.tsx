"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TecnicoCompraForm from "@/components/TecnicoCompraForm";

export default function TecnicoNuevaCompra({
  tecnicoId,
  ordenes,
  proveedores,
  productos,
}: {
  tecnicoId:   string;
  ordenes:     { id: string; numero: string; cliente?: { nombre: string } }[];
  proveedores: { id: string; nombre: string }[];
  productos:   any[];
}) {
  const router = useRouter();

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/tecnico/compras"
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 active:bg-gray-50"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Nueva compra</h1>
          <p className="text-xs text-gray-400">Materiales comprados por tu cuenta</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <TecnicoCompraForm
          ordenesDisponibles={ordenes}
          proveedores={proveedores}
          productos={productos}
          tecnicoId={tecnicoId}
          onCancel={() => router.push("/tecnico/compras")}
          onSaved={() => router.push("/tecnico/compras")}
        />
      </div>
    </div>
  );
}
