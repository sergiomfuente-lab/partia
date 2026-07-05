import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import FacturaPDF from "@/components/FacturaPDF";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const [factura, usuario, empresa] = await Promise.all([
    prisma.factura.findFirst({
      where: { id, cliente: { usuarioId: session.user!.id } },
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
    prisma.usuario.findUnique({
      where: { id: session.user!.id },
      select: {
        nombreFiscal: true, cifNif: true,
        direccionFiscal: true, codigoPostal: true,
        ciudad: true, provincia: true,
        telefono: true, emailFacturacion: true, iban: true,
      },
    }),
    prisma.configuracionEmpresa.findFirst(),
  ]);

  if (!factura) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    FacturaPDF({
      factura: JSON.parse(JSON.stringify(factura)),
      usuario: JSON.parse(JSON.stringify(usuario)),
      empresa: JSON.parse(JSON.stringify(empresa ?? {})),
    })
  );

  const uint8Array = new Uint8Array(buffer);

  return new NextResponse(uint8Array, {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `inline; filename="factura-${factura.numero}.pdf"`,
    },
  });
}