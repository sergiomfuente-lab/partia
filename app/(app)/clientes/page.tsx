import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ClientesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const clientes = await prisma.cliente.findMany({
    where: { usuarioId: session.user?.id as string },
    include: { _count: { select: { maquinas: true, facturas: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-[#0B1120] flex flex-col p-4 fixed h-full">
        <div className="flex items-center gap-2 mb-8 pb-4 border-b border-[#1e2d42]">
          <svg width="24" height="24" viewBox="0 0 56 56">
            <polygon points="28,4 50,16 50,40 28,52 6,40 6,16" fill="none" stroke="#00C2FF" strokeWidth="2.5"/>
            <circle cx="28" cy="28" r="7" fill="#00C2FF"/>
            <circle cx="28" cy="28" r="3.5" fill="#0B1120"/>
          </svg>
          <span className="text-white font-bold text-base tracking-wide">Partia</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          <a href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#6a8aaa] hover:text-white">Dashboard</a>
          <a href="/clientes" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-[#162030] text-[#00C2FF]">Clientes</a>
          <a href="/maquinas" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#6a8aaa] hover:text-white">Máquinas</a>
          <a href="/partes" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#6a8aaa] hover:text-white">Partes</a>
          <a href="/facturas" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#6a8aaa] hover:text-white">Facturas</a>
          <a href="/compras" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#6a8aaa] hover:text-white">Compras</a>
          <a href="/configuracion" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#6a8aaa] hover:text-white">Configuración</a>
        </nav>
        <div className="border-t border-[#1e2d42] pt-4">
          <div className="flex items-center gap-2 px-2">
            <div className="w-7 h-7 rounded-full bg-[#00C2FF] flex items-center justify-center text-[#0B1120] text-xs font-bold">
              {session.user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-[#6a8aaa] text-xs truncate">{session.user?.name}</span>
          </div>
        </div>
      </aside>

      <main className="ml-56 flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-medium text-gray-900">Clientes</h1>
            <p className="text-sm text-gray-500">{clientes.length} registros</p>
          </div>
          <Link
            href="/clientes/nuevo"
            className="bg-[#0B1120] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#162030] transition-colors"
          >
            + Nuevo cliente
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-5 px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div className="text-xs text-gray-400 uppercase tracking-wide col-span-2">Cliente</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Tipo</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Máquinas</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Acciones</div>
          </div>

          {clientes.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-sm mb-4">No hay clientes todavía</p>
              <Link href="/clientes/nuevo" className="text-[#00C2FF] text-sm">
                Añadir primer cliente →
              </Link>
            </div>
          ) : (
            clientes.map((cliente) => (
              <div key={cliente.id} className="grid grid-cols-5 px-4 py-3 border-b border-gray-50 items-center hover:bg-gray-50">
                <div className="col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                      {cliente.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{cliente.nombre}</div>
                      <div className="text-xs text-gray-400">{cliente.nif}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    cliente.tipo === "empresa"
                      ? "bg-green-50 text-green-700"
                      : "bg-blue-50 text-blue-700"
                  }`}>
                    {cliente.tipo === "empresa" ? "Empresa" : "Autónomo"}
                  </span>
                </div>
                <div className="text-sm text-gray-600">{cliente._count.maquinas} máquinas</div>
                <div className="flex gap-2">
                  <Link href={`/clientes/${cliente.id}`} className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-500 hover:bg-gray-50">
                    Ver
                  </Link>
                  <Link href={`/clientes/${cliente.id}/editar`} className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-500 hover:bg-gray-50">
                    Editar
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}