import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NuevoAbonoForm from "./NuevoAbonoForm";

export const metadata = { title: "Crear abono — Partia" };

export default async function NuevoAbonoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id }      = await params;
  const empresaId   = (session.user as any).empresaId;

  const [factura, series] = await Promise.all([
    prisma.factura.findFirst({
      where: { id, cliente: { empresaId } },
      include: {
        cliente:        true,
        lineasDirectas: true,
        ordenes: {
          include: {
            servicios:       { include: { tipoServicio: true } },
            serviciosLibres: true,
            repuestos:       true,
          },
        },
      },
    }),
    prisma.serieFacturacion.findMany({
      where:   { empresaId, activa: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!factura) redirect("/facturas");

  return (
    <NuevoAbonoForm
      factura={JSON.parse(JSON.stringify(factura))}
      series={JSON.parse(JSON.stringify(series))}
    />
  );
}