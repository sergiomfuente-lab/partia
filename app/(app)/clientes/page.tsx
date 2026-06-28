import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ClientesLista from "./ClientesLista";

export default async function ClientesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const usuarioId = (session.user as any).id as string;

  const clientes = await prisma.cliente.findMany({
    where: { usuarioId },
    include: { _count: { select: { maquinas: true, ordenes: true } } },
    orderBy: { nombre: "asc" },
  });

  return <ClientesLista clientes={JSON.parse(JSON.stringify(clientes))} />;
}