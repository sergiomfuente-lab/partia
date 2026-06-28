import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditarClienteForm from "./EditarClienteForm";

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const cliente = await prisma.cliente.findFirst({
    where: { id },
  });

  if (!cliente) redirect("/clientes");

  return <EditarClienteForm cliente={JSON.parse(JSON.stringify(cliente))} />;
}