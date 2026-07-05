import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditarOrdenForm from "./EditarOrdenForm";

export const metadata = { title: "Editar orden — Partia" };

export default async function EditarOrdenPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id }      = await params;
  const empresaId   = (session.user as any).empresaId;

  const [orden, tiposServicio, empresa] = await Promise.all([
    prisma.orden.findFirst({
      where: { id, cliente: { empresaId } },
      include: {
        cliente: {
          select: {
            id: true, nombre: true,
            precioHoraEspecial: true,
            precioPorKmEspecial: true,
          },
        },
        maquina:  true,
        servicios:{ include: { tipoServicio: true }, orderBy: { fecha: "asc" } },
        repuestos: true,
      },
    }),
    prisma.tipoServicio.findMany({
      where:   { activo: true },
      orderBy: { orden: "asc" },
    }),
    prisma.empresa.findUnique({
      where:  { id: empresaId },
      select: { precioHora: true, precioPorKm: true },
    }),
  ]);

  if (!orden) redirect("/ordenes");

  return (
    <EditarOrdenForm
      orden={JSON.parse(JSON.stringify(orden))}
      tiposServicio={tiposServicio}
      precioHoraDefault={empresa?.precioHora   ?? 55}
      precioPorKmDefault={empresa?.precioPorKm ?? 0.35}
    />
  );
}