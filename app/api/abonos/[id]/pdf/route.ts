import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });
  const { id }    = await params;

  const [abono, empresa] = await Promise.all([
    prisma.abono.findFirst({
      where: { id, empresaId },
      include: {
        serie:   true,
        factura: { select: { id: true, numero: true, cliente: true } },
        lineas:  true,
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

  if (!abono) return NextResponse.json({ error: "Abono no encontrado" }, { status: 404 });

  const { default: AbonoPDF } = await import("@/components/AbonoPDF");
  const { renderToBuffer }    = await import("@react-pdf/renderer");

  const buffer = await renderToBuffer(
    AbonoPDF({
      abono:   JSON.parse(JSON.stringify(abono)),
      empresa: JSON.parse(JSON.stringify(empresa ?? {})),
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `inline; filename="abono-${abono.numero}.pdf"`,
    },
  });
}