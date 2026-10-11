import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ClienteDetalle from "./ClienteDetalle";

export default async function ClienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const empresaId = (session.user as any).empresaId as string | undefined;
  if (!empresaId) redirect("/dashboard");

  const { id } = await params;

  const cliente = await prisma.cliente.findFirst({
    where: { id, empresaId },
    include: {
      maquinas: true,
      ordenes: {
        // La firma (imagen base64) pesa mucho y esta pantalla no la usa
        omit: { firmaBase64: true },
        include: {
          maquina: true,
          servicios: {
            include: { tipoServicio: true },
          },
        },
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