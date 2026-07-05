import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NuevoPresupuestoForm from "./NuevoPresupuestoForm";

export const metadata = { title: "Nuevo presupuesto — Partia" };

export default async function NuevoPresupuestoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) redirect("/dashboard");

  const [clientes, empresa] = await Promise.all([
    prisma.cliente.findMany({
      where:   { empresaId, activo: true },
      select:  {
        id: true, nombre: true,
        precioHoraEspecial:  true,
        precioPorKmEspecial: true,
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.empresa.findUnique({
      where:  { id: empresaId },
      select: { precioHora: true, precioPorKm: true },
    }),
  ]);

  return (
    <NuevoPresupuestoForm
      clientes={clientes}
      precioHoraDefault={empresa?.precioHora   ?? 55}
      precioPorKmDefault={empresa?.precioPorKm ?? 0.35}
    />
  );
}