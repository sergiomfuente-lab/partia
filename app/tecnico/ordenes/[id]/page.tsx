import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TecnicoOrdenDetalle from "./TecnicoOrdenDetalle";

export const metadata = { title: "Orden — Partia Técnico" };

export default async function TecnicoOrdenPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id }    = await params;
  const empresaId = (session.user as any).empresaId;

  const [orden, tiposServicio, empresa, proveedores, productos] = await Promise.all([
    prisma.orden.findFirst({
      where: { id, empresaId },
      include: {
        cliente:         true,
        maquina:         true,
        tecnico:         { select: { id: true, nombre: true } },
        servicios:       { include: { tipoServicio: true }, orderBy: { fecha: "asc" } },
        serviciosLibres: true,
        repuestos:       true,
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
      },
    }),
    prisma.tipoServicio.findMany({
      where:   { activo: true },
      orderBy: { orden:  "asc" },
    }),
    prisma.empresa.findUnique({
      where:  { id: empresaId },
      select: { precioHora: true, precioPorKm: true },
    }),
    prisma.proveedor.findMany({
      where:   { empresaId, activo: true },
      select:  { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.producto.findMany({
      where:   { empresaId, activo: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  if (!orden) redirect("/tecnico");

  return (
    <TecnicoOrdenDetalle
      orden={JSON.parse(JSON.stringify(orden))}
      tiposServicio={JSON.parse(JSON.stringify(tiposServicio))}
      precioHoraDefault={empresa?.precioHora   ?? 55}
      precioPorKmDefault={empresa?.precioPorKm ?? 0.35}
      tecnicoId={session.user.id}
      proveedores={JSON.parse(JSON.stringify(proveedores))}
      productos={JSON.parse(JSON.stringify(productos))}
    />
  );
}
