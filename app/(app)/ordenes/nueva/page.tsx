import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NuevaOrdenForm from "./NuevaOrdenForm";

export const metadata = { title: "Nueva orden — Partia" };

export default async function NuevaOrdenPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [clientes, tiposServicio, usuario] = await Promise.all([
    prisma.cliente.findMany({
      where: { usuarioId: session.user!.id, activo: true },
      select: {
        id: true,
        nombre: true,
        precioHoraEspecial: true,
        precioPorKmEspecial: true,
      },
      orderBy: { nombre: "asc" },
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

  return (
    <NuevaOrdenForm
      clientes={clientes}
      tiposServicio={tiposServicio}
      precioHoraDefault={usuario?.precioHora ?? 55}
      precioPorKmDefault={usuario?.precioPorKm ?? 0.35}
    />
  );
}