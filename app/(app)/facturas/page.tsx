import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FacturasLista from "./FacturasLista";

export const metadata = { title: "Facturas — Partia" };

export default async function FacturasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) redirect("/dashboard");

  const [clientes, series] = await Promise.all([
    prisma.cliente.findMany({
      where:   { empresaId, activo: true },
      select:  { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.serieFacturacion.findMany({
      where:   { empresaId, activa: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return <FacturasLista clientes={clientes} series={series} />;
}