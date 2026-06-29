import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrdenesLista from "./OrdenesLista";

export const metadata = { title: "Órdenes — Partia" };

export default async function OrdenesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const clientes = await prisma.cliente.findMany({
    where: { usuarioId: session.user!.id, activo: true },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });

  return <OrdenesLista clientes={clientes} />;
}