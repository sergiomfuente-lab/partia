import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ClientesLista from "./ClientesLista";

export default async function ClientesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const empresaId = (session.user as any).empresaId as string | undefined;
  if (!empresaId) redirect("/dashboard");

  const clientes = await prisma.cliente.findMany({
    where: { empresaId },
    include: { _count: { select: { maquinas: true, ordenes: true } } },
    orderBy: { nombre: "asc" },
  });

  return <ClientesLista clientes={JSON.parse(JSON.stringify(clientes))} />;
}