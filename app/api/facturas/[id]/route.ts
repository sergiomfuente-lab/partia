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
        pagadoPor: { select: { id: true, nombre: true } },
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
  if (!empresaId) return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });
  const body      = await req.json();
  const { estado, vencimiento, notas, tipoDescuento, descuentoValor } = body;

  const [factura, empresa] = await Promise.all([
    prisma.factura.findFirst({ where: { id, empresaId } }),
    prisma.empresa.findUnique({ where: { id: empresaId }, select: { facturacionInmutableActiva: true } }),
  ]);
  if (!factura) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
  }

  // Veri*Factu / RRSIF: una vez activada la inmutabilidad para esta empresa
  // (Configuración → Veri*Factu), los importes de una factura ya emitida no
  // se pueden modificar — cualquier corrección debe hacerse con un Abono
  // (factura rectificativa), que es lo que exige la normativa.
  const tocaImporte = tipoDescuento !== undefined || descuentoValor !== undefined;
  if (tocaImporte && empresa?.facturacionInmutableActiva) {
    return NextResponse.json(
      {
        error:
          "Esta factura ya está emitida y la empresa tiene activada la inmutabilidad de facturación (Veri*Factu). " +
          "Para corregir el importe, genera un Abono (factura rectificativa) en lugar de editar esta factura.",
      },
      { status: 409 }
    );
  }

  let updateData: any = {};

  // Registrar quién y cuándo marca la factura como pagada (o revertir el
  // registro si se cambia a un estado distinto de "cobrada").
  if (estado !== undefined && estado !== factura.estado) {
    if (estado === "cobrada") {
      updateData.fechaPago   = new Date();
      updateData.pagadoPorId = session.user.id;
    } else {
      updateData.fechaPago   = null;
      updateData.pagadoPorId = null;
    }
  }

  if (tocaImporte) {
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
      pagadoPor: { select: { id: true, nombre: true } },
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
