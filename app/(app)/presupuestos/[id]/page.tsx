import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PresupuestoDetalle from "./PresupuestoDetalle";

export const metadata = { title: "Presupuesto — Partia" };

export default async function PresupuestoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id }      = await params;
  const empresaId   = (session.user as any).empresaId;

  const [presupuesto, empresa] = await Promise.all([
    prisma.presupuesto.findFirst({
      where: { id, empresaId },
      include: {
        cliente:         true,
        maquina:         true,
        serviciosLibres: true,
        repuestos:       true,
        ordenes:         { select: { id: true, numero: true, estado: true, fecha: true } },
      },
    }),
    prisma.empresa.findUnique({
      where:  { id: empresaId },
      select: {
        nombreFiscal: true, cifNif: true,
        direccionFiscal: true, codigoPostal: true,
        ciudad: true, provincia: true,
        telefono: true, emailFacturacion: true, logoBase64: true,
      },
    }),
  ]);

  if (!presupuesto) redirect("/presupuestos");

  return (
    <PresupuestoDetalle
      presupuesto={JSON.parse(JSON.stringify(presupuesto))}
      empresa={JSON.parse(JSON.stringify(empresa ?? {}))}
    />
  );
}