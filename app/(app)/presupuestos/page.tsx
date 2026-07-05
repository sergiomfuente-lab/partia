import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PresupuestosLista from "./PresupuestosLista";

export const metadata = { title: "Presupuestos — Partia" };

export default async function PresupuestosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) redirect("/dashboard");

  const clientes = await prisma.cliente.findMany({
    where:   { empresaId, activo: true },
    select:  { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });

  return <PresupuestosLista clientes={clientes} />;
}