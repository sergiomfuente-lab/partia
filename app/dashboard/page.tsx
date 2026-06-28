import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) redirect("/login");

  const totalClientes = await prisma.cliente.count({
    where: { usuarioId: session.user?.id as string },
  });

  const totalMaquinas = await prisma.maquina.count({
    where: { cliente: { usuarioId: session.user?.id as string } },
  });

  const totalPartes = await prisma.parte.count({
    where: { maquina: { cliente: { usuarioId: session.user?.id as string } } },
  });

  const ultimosPartes = await prisma.parte.findMany({
    where: { maquina: { cliente: { usuarioId: session.user?.id as string } } },
    include: { maquina: { include: { cliente: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
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
          <a href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-[#162030] text-[#00C2FF]">Dashboard</a>
          <a href="/clientes" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#6a8aaa] hover:text-white">Clientes</a>
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
        <div className="mb-6">
          <h1 className="text-lg font-medium text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Resumen general</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-gray-400 mb-1">Clientes</div>
            <div className="text-2xl font-medium text-gray-900">{totalClientes}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-gray-400 mb-1">Máquinas</div>
            <div className="text-2xl font-medium text-gray-900">{totalMaquinas}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-gray-400 mb-1">Partes</div>
            <div className="text-2xl font-medium text-gray-900">{totalPartes}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Últimos partes</h2>
          {ultimosPartes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No hay partes registrados todavía</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {ultimosPartes.map((parte) => (
                <div key={parte.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{parte.numero}</div>
                    <div className="text-xs text-gray-400">{parte.maquina.nombre} · {parte.maquina.cliente.nombre}</div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(parte.createdAt).toLocaleDateString("es-ES")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}