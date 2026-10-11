import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditarFacturaForm from "./EditarFacturaForm";

export const metadata = { title: "Editar factura — Partia" };

export default async function EditarFacturaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const empresaId = (session.user as any).empresaId as string | undefined;
  if (!empresaId) redirect("/dashboard");

  const factura = await prisma.factura.findFirst({
    where: { id, cliente: { empresaId } },
    include: {
      cliente: true,
      ordenes: {
        include: {
          servicios:  { include: { tipoServicio: true } },
          repuestos:  true,
          maquina:    true,
        },
      },
    },
  });

  if (!factura) redirect("/facturas");

  return <EditarFacturaForm factura={JSON.parse(JSON.stringify(factura))} />;
}