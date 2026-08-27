import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id }    = await params;
  const empresaId = (session.user as any).empresaId;
  if (!empresaId) return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });

  const [factura, empresa] = await Promise.all([
    prisma.factura.findFirst({
      where: { id, empresaId },
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
      where:  { id: empresaId },
      select: {
        nombreFiscal: true, cifNif: true,
        direccionFiscal: true, codigoPostal: true,
        ciudad: true, provincia: true,
        telefono: true, emailFacturacion: true,
        iban: true, logoBase64: true, textoRgpd: true,
      },
    }),
  ]);

  if (!factura) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
  }

  const { default: FacturaPDF } = await import("@/components/FacturaPDF");
  const { renderToBuffer }      = await import("@react-pdf/renderer");

  const buffer = await renderToBuffer(
    FacturaPDF({
      factura: JSON.parse(JSON.stringify(factura)),
      usuario: JSON.parse(JSON.stringify(empresa ?? {})),
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