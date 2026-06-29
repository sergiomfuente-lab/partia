import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditarOrdenForm from "./EditarOrdenForm";

export const metadata = { title: "Editar orden — Partia" };

export default async function EditarOrdenPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const [orden, tiposServicio, usuario] = await Promise.all([
    prisma.orden.findFirst({
      where: { id, cliente: { usuarioId: session.user!.id } },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            precioHoraEspecial: true,
            precioPorKmEspecial: true,
          },
        },
        maquina: true,
        servicios: {
          include: { tipoServicio: true },
          orderBy: { fecha: "asc" },
        },
        repuestos: true,
      },
    }),
    prisma.tipoServicio.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    }),
    prisma.usuario.findUnique({
      where: { id: session.user!.id },
      select: { precioHora: true, precioPorKm: true },
    }),
  ]);

  if (!orden) redirect("/ordenes");

  return (
    <EditarOrdenForm
      orden={JSON.parse(JSON.stringify(orden))}
      tiposServicio={tiposServicio}
      precioHoraDefault={usuario?.precioHora ?? 55}
      precioPorKmDefault={usuario?.precioPorKm ?? 0.35}
    />
  );
}