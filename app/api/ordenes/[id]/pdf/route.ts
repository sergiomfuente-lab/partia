import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { id }    = await params;

  const [orden, empresa, tecnico] = await Promise.all([
    prisma.orden.findFirst({
      where: { id, cliente: { empresaId } },
      include: {
        cliente:         true,
        maquina:         true,
        servicios:       { include: { tipoServicio: true }, orderBy: { fecha: "asc" } },
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
        logoBase64: true, textoRgpd: true,
      },
    }),
    prisma.usuario.findUnique({
      where:  { id: session.user.id },
      select: { nombre: true, dni: true },
    }),
  ]);

  if (!orden) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  const mostrarPrecios = orden.mostrarPrecios ?? true;

  const { default: OrdenPDF } = await import("@/components/OrdenPDF");
  const { renderToBuffer }    = await import("@react-pdf/renderer");

  const buffer = await renderToBuffer(
    OrdenPDF({
      orden:          JSON.parse(JSON.stringify(orden)),
      empresa:        JSON.parse(JSON.stringify(empresa ?? {})),
      tecnico:        JSON.parse(JSON.stringify(tecnico ?? {})),
      mostrarPrecios,
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `inline; filename="orden-${orden.numero}.pdf"`,
    },
  });
}