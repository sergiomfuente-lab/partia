import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Eye, Pencil, Plus, Users } from "lucide-react";

export default async function ClientesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const usuarioId = (session.user as any).id as string;

  const clientes = await prisma.cliente.findMany({
    where: { usuarioId },
    include: { _count: { select: { maquinas: true, ordenes: true } } },
    orderBy: { createdAt: "desc" },
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

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div className="col-span-4 text-xs text-gray-400 uppercase tracking-wide">Cliente</div>
          <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">CIF / NIF</div>
          <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Tipo</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide">Máquinas</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide">Órdenes</div>
          <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Acciones</div>
        </div>

        {clientes.length === 0 ? (
          <div className="text-center py-20">
            <Users size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 text-sm mb-4">No hay clientes todavía</p>
            <Link href="/clientes/nuevo" className="text-[#00C2FF] text-sm">
              Añadir primer cliente →
            </Link>
          </div>
        ) : (
          clientes.map((cliente) => (
            <div key={cliente.id} className="grid grid-cols-12 px-5 py-4 border-b border-gray-50 items-center hover:bg-gray-50 transition-colors">
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
              <div className="col-span-1 text-sm text-gray-600">{cliente._count.maquinas}</div>
              <div className="col-span-1 text-sm text-gray-600">{cliente._count.ordenes}</div>
              <div className="col-span-2 flex gap-2">
                <Link
                  href={`/clientes/${cliente.id}`}
                  className="flex items-center gap-1.5 text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                >
                  <Eye size={13} />
                  Ver
                </Link>
                <Link
                  href={`/clientes/${cliente.id}/editar`}
                  className="flex items-center gap-1.5 text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                >
                  <Pencil size={13} />
                  Editar
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}