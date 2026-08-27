import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const empresaId = (session.user as any).empresaId;

  // Si es superadmin sin empresa activa redirigir a superadmin
  if (!empresaId) redirect("/superadmin");

  const [totalClientes, totalMaquinas, totalOrdenes, ultimasOrdenes] = await Promise.all([
    prisma.cliente.count({ where: { empresaId } }),
    prisma.maquina.count({ where: { cliente: { empresaId } } }),
    prisma.orden.count({ where: { empresaId } }),
    prisma.orden.findMany({
      where:   { empresaId },
      include: { maquina: true, cliente: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Bienvenido, {session.user?.name}</p>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Clientes</div>
          <div className="text-3xl font-semibold text-gray-900">{totalClientes}</div>
          <Link href="/clientes" className="text-xs text-[#00C2FF] mt-2 inline-block">Ver todos →</Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Máquinas</div>
          <div className="text-3xl font-semibold text-gray-900">{totalMaquinas}</div>
          <Link href="/maquinas" className="text-xs text-[#00C2FF] mt-2 inline-block">Ver todas →</Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Órdenes</div>
          <div className="text-3xl font-semibold text-gray-900">{totalOrdenes}</div>
          <Link href="/ordenes" className="text-xs text-[#00C2FF] mt-2 inline-block">Ver todas →</Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Últimas órdenes</h2>
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
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs text-gray-400 uppercase tracking-wide pb-3">Nº Orden</th>
                <th className="text-left text-xs text-gray-400 uppercase tracking-wide pb-3">Cliente</th>
                <th className="text-left text-xs text-gray-400 uppercase tracking-wide pb-3">Máquina</th>
                <th className="text-left text-xs text-gray-400 uppercase tracking-wide pb-3">Fecha</th>
                <th className="text-left text-xs text-gray-400 uppercase tracking-wide pb-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ultimasOrdenes.map((orden) => (
                <tr key={orden.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 text-sm font-medium text-[#185FA5]">{orden.numero}</td>
                  <td className="py-3 text-sm text-gray-800">{orden.cliente.nombre}</td>
                  <td className="py-3 text-sm text-gray-600">{orden.maquina.marca} {orden.maquina.modelo}</td>
                  <td className="py-3 text-sm text-gray-400">{new Date(orden.fecha).toLocaleDateString("es-ES")}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      orden.estado === "completado" ? "bg-green-50 text-green-700" :
                      orden.estado === "pendiente"  ? "bg-yellow-50 text-yellow-700" :
                      "bg-blue-50 text-blue-700"
                    }`}>
                      {orden.estado === "completado" ? "Completado" :
                       orden.estado === "pendiente"  ? "Pendiente" : "En curso"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}