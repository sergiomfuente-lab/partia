import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrdenDetalle from "./OrdenDetalle";

export const metadata = { title: "Orden — Partia" };

export default async function OrdenDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id }    = await params;
  const empresaId = (session.user as any).empresaId;

  const [orden, tecnicos] = await Promise.all([
   prisma.orden.findFirst({
    where: { id, empresaId },
    include: {
      cliente:  true,
      maquina:  true,
      servicios: {
        include: { tipoServicio: true },
        orderBy: { fecha: "asc" },
      },
      serviciosLibres: true,
      repuestos:       true,
      sesionesTrabajo: { orderBy: { inicio: "asc" } },
      lineasCompra: {
        include: {
          compra: {
            include: {
              proveedor: { select: { nombre: true } },
              tecnico:   { select: { nombre: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      factura: { select: { id: true, numero: true, estado: true } },
    },
   }),
   // Personas que pueden figurar como técnico en el parte (activas, o la ya asignada)
   prisma.usuario.findMany({
    where:   { empresaId, rol: { not: "superadmin" }, OR: [{ activo: true }, { ordenesAsignadas: { some: { id } } }] },
    select:  { id: true, nombre: true },
    orderBy: { nombre: "asc" },
   }),
  ]);

  if (!orden) redirect("/ordenes");

  return <OrdenDetalle orden={JSON.parse(JSON.stringify(orden))} tecnicos={tecnicos} />;
}