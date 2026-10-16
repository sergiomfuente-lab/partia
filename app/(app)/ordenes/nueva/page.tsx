import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NuevaOrdenForm from "./NuevaOrdenForm";

export const metadata = { title: "Nueva orden — Partia" };

export default async function NuevaOrdenPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const empresaId = (session.user as any).empresaId;

  const [clientes, tiposServicio, empresa, tecnicos] = await Promise.all([
    prisma.cliente.findMany({
      where:   { empresaId, activo: true },
      select: {
        id: true, nombre: true,
        precioHoraEspecial:  true,
        precioPorKmEspecial: true,
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.tipoServicio.findMany({
      where:   { activo: true },
      orderBy: { orden:  "asc" },
    }),
    prisma.empresa.findUnique({
      where:  { id: empresaId },
      select: { precioHora: true, precioPorKm: true },
    }),
    prisma.usuario.findMany({
      where:   { empresaId, rol: { not: "superadmin" }, activo: true },
      select:  { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <NuevaOrdenForm
      clientes={clientes}
      tiposServicio={tiposServicio}
      tecnicos={tecnicos}
      precioHoraDefault={empresa?.precioHora   ?? 55}
      precioPorKmDefault={empresa?.precioPorKm ?? 0.35}
    />
  );
}