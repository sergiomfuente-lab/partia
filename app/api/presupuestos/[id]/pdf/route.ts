import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { id }    = await params;

  const [presupuesto, empresa] = await Promise.all([
    prisma.presupuesto.findFirst({
      where: { id, empresaId },
      include: {
        cliente:         true,
        maquina:         true,
        serviciosLibres: true,
        repuestos:       true,
      },
    }),
    prisma.empresa.findUnique({
      where:  { id: empresaId },
      select: {
        nombreFiscal: true, cifNif: true,
        direccionFiscal: true, codigoPostal: true,
        ciudad: true, provincia: true,
        telefono: true, emailFacturacion: true,
        logoBase64: true,
      },
    }),
  ]);

  if (!presupuesto) return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });

  const { default: PresupuestoPDF } = await import("@/components/PresupuestoPDF");
  const { renderToBuffer }          = await import("@react-pdf/renderer");

  const buffer = await renderToBuffer(
    PresupuestoPDF({
      presupuesto: JSON.parse(JSON.stringify(presupuesto)),
      empresa:     JSON.parse(JSON.stringify(empresa ?? {})),
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `inline; filename="presupuesto-${presupuesto.numero}.pdf"`,
    },
  });
}