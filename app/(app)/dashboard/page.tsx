import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const usuarioId = (session.user as any).id as string;

  const totalClientes = await prisma.cliente.count({
    where: { usuarioId },
  });

  const totalMaquinas = await prisma.maquina.count({
    where: { cliente: { usuarioId } },
  });

  const totalOrdenes = await prisma.orden.count({
    where: { cliente: { usuarioId } },
  });

  const ultimasOrdenes = await prisma.orden.findMany({
    where: { cliente: { usuarioId } },
    include: { maquina: true, cliente: true },
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
          <a href="/ordenes" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#6a8aaa] hover:text-white">Órdenes</a>
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

      <main className="ml-56 flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Bienvenido, {session.user?.name}</p>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Clientes</div>
            <div className="text-3xl font-medium text-gray-900">{totalClientes}</div>
            <Link href="/clientes" className="text-xs text-[#00C2FF] mt-2 inline-block">Ver todos →</Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Máquinas</div>
            <div className="text-3xl font-medium text-gray-900">{totalMaquinas}</div>
            <Link href="/maquinas" className="text-xs text-[#00C2FF] mt-2 inline-block">Ver todas →</Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Órdenes</div>
            <div className="text-3xl font-medium text-gray-900">{totalOrdenes}</div>
            <Link href="/ordenes" className="text-xs text-[#00C2FF] mt-2 inline-block">Ver todas →</Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-gray-700">Últimas órdenes</h2>
            <Link href="/ordenes" className="text-xs text-[#00C2FF]">Ver todas →</Link>
          </div>
          {ultimasOrdenes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm mb-3">No hay órdenes registradas todavía</p>
              <Link href="/ordenes/nueva" className="text-[#00C2FF] text-sm">Crear primera orden →</Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-xs text-gray-400 uppercase pb-3">Nº Orden</th>
                  <th className="text-left text-xs text-gray-400 uppercase pb-3">Cliente</th>
                  <th className="text-left text-xs text-gray-400 uppercase pb-3">Máquina</th>
                  <th className="text-left text-xs text-gray-400 uppercase pb-3">Fecha</th>
                  <th className="text-left text-xs text-gray-400 uppercase pb-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ultimasOrdenes.map((orden) => (
                  <tr key={orden.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 text-sm font-medium text-[#185FA5]">{orden.numero}</td>
                    <td className="py-3 text-sm text-gray-800">{orden.cliente.nombre}</td>
                    <td className="py-3 text-sm text-gray-600">{orden.maquina.marca} {orden.maquina.modelo}</td>
                    <td className="py-3 text-sm text-gray-400">{new Date(orden.fecha).toLocaleDateString("es-ES")}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        orden.estado === "completado" ? "bg-green-50 text-green-700" :
                        orden.estado === "pendiente" ? "bg-yellow-50 text-yellow-700" :
                        "bg-blue-50 text-blue-700"
                      }`}>
                        {orden.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}