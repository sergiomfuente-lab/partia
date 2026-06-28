import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ClienteDetalle from "./ClienteDetalle";

export default async function ClienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const cliente = await prisma.cliente.findFirst({
    where: { id },
    include: {
      maquinas: true,
      ordenes: {
        include: { maquina: true },
        orderBy: { createdAt: "desc" },
      },
      facturas: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!cliente) redirect("/clientes");

  return <ClienteDetalle cliente={JSON.parse(JSON.stringify(cliente))} />;
}