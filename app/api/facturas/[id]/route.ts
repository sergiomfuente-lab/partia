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

  return NextResponse.json({ ...factura, usuario: empresa });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id }    = await params;
  const empresaId = (session.user as any).empresaId;
  const body      = await req.json();
  const { estado, vencimiento, notas, tipoDescuento, descuentoValor } = body;

  const factura = await prisma.factura.findFirst({
    where: { id, cliente: { empresaId } },
  });
  if (!factura) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
  }

  let updateData: any = {};

  if (tipoDescuento !== undefined || descuentoValor !== undefined) {
    const nuevoTipo  = tipoDescuento  ?? factura.tipoDescuento;
    const nuevoValor = descuentoValor ?? factura.descuentoValor;
    let descuento = 0;
    if (nuevoTipo === "porcentaje") {
      descuento = factura.baseImponible * (nuevoValor / 100);
    } else {
      descuento = nuevoValor;
    }
    const baseConDescuento = factura.baseImponible - descuento;
    const iva   = baseConDescuento * 0.21;
    const total = baseConDescuento + iva;
    updateData = { ...updateData, tipoDescuento: nuevoTipo, descuentoValor: nuevoValor, descuento, iva, total };
  }

  const updated = await prisma.factura.update({
    where: { id },
    data: {
      ...updateData,
      ...(estado      !== undefined && { estado }),
      ...(vencimiento !== undefined && { vencimiento: vencimiento ? new Date(vencimiento) : null }),
      ...(notas       !== undefined && { notas }),
    },
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

  return NextResponse.json(updated);
}