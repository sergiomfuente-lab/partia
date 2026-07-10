import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { id }    = await params;

  const abono = await prisma.abono.findFirst({
    where: { id, empresaId },
    include: {
      serie:   true,
      factura: { select: { id: true, numero: true, clienteId: true, cliente: true } },
      lineas:  true,
    },
  });

  if (!abono) return NextResponse.json({ error: "Abono no encontrado" }, { status: 404 });

  const empresa = await prisma.empresa.findUnique({
    where:  { id: empresaId },
    select: {
      nombreFiscal: true, cifNif: true,
      direccionFiscal: true, codigoPostal: true,
      ciudad: true, provincia: true,
      telefono: true, emailFacturacion: true,
      iban: true, logoBase64: true, textoRgpd: true,
    },
  });

  return NextResponse.json({ ...abono, empresa });
}