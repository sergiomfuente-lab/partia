import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FacturaDetalle from "./FacturaDetalle";

export const metadata = { title: "Factura — Partia" };

export default async function FacturaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const empresaId = (session.user as any).empresaId;

  const [factura, empresa] = await Promise.all([
    prisma.factura.findFirst({
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
    }),
    prisma.empresa.findUnique({
      where: { id: empresaId },
      select: {
        nombreFiscal: true, cifNif: true,
        direccionFiscal: true, codigoPostal: true,
        ciudad: true, provincia: true,
        telefono: true, emailFacturacion: true,
        iban: true, logoBase64: true, textoRgpd: true,
      },
    }),
  ]);

  if (!factura) redirect("/facturas");

  return (
    <FacturaDetalle
      factura={JSON.parse(JSON.stringify(factura))}
      usuario={JSON.parse(JSON.stringify(empresa ?? {}))}
      empresa={JSON.parse(JSON.stringify(empresa ?? {}))}
    />
  );
}