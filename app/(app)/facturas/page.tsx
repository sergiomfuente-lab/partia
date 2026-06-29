import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FacturasLista from "./FacturasLista";

export const metadata = { title: "Facturas — Partia" };

export default async function FacturasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const clientes = await prisma.cliente.findMany({
    where: { usuarioId: session.user!.id, activo: true },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });

  return <FacturasLista clientes={clientes} />;
}