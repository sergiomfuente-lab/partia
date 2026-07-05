import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { id }    = await params;

  const presupuesto = await prisma.presupuesto.findFirst({
    where: { id, empresaId },
    include: {
      cliente:         true,
      maquina:         true,
      serviciosLibres: true,
      repuestos:       true,
      ordenes:         { select: { id: true, numero: true, estado: true } },
    },
  });

  if (!presupuesto) return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });

  const empresa = await prisma.empresa.findUnique({
    where:  { id: empresaId },
    select: {
      nombreFiscal: true, cifNif: true,
      direccionFiscal: true, codigoPostal: true,
      ciudad: true, provincia: true,
      telefono: true, emailFacturacion: true,
      iban: true, logoBase64: true,
    },
  });

  return NextResponse.json({ ...presupuesto, empresa });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { id }    = await params;
  const body      = await req.json();

  const presupuesto = await prisma.presupuesto.findFirst({ where: { id, empresaId } });
  if (!presupuesto) return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });

  // Si vienen líneas recalcular totales
  let totalesData = {};
  if (body.serviciosLibres !== undefined || body.repuestos !== undefined) {
    const serviciosLibres = body.serviciosLibres ?? [];
    const repuestos       = body.repuestos       ?? [];

    const baseImponible = 
      serviciosLibres.reduce((acc: number, s: any) => acc + s.cantidad * s.precio, 0) +
      repuestos.reduce((acc: number, r: any) => acc + r.cantidad * r.precioVenta, 0);

    const tipoDescuento  = body.tipoDescuento  ?? presupuesto.tipoDescuento;
    const descuentoValor = body.descuentoValor ?? presupuesto.descuentoValor;
    const descuento      = tipoDescuento === "porcentaje"
      ? baseImponible * (descuentoValor / 100)
      : descuentoValor;

    const baseConDescuento = Math.max(0, baseImponible - descuento);
    const iva   = baseConDescuento * 0.21;
    const total = baseConDescuento + iva;

    totalesData = { baseImponible, descuento, iva, total, tipoDescuento, descuentoValor };
  }

  const updated = await prisma.presupuesto.update({
    where: { id },
    data: {
      ...totalesData,
      ...(body.estado              !== undefined && { estado: body.estado }),
      ...(body.validezHasta        !== undefined && { validezHasta: body.validezHasta ? new Date(body.validezHasta) : null }),
      ...(body.direccionReparacion !== undefined && { direccionReparacion: body.direccionReparacion }),
      ...(body.descripcion         !== undefined && { descripcion: body.descripcion }),
      ...(body.observaciones       !== undefined && { observaciones: body.observaciones }),
      ...(body.notas               !== undefined && { notas: body.notas }),
      ...(body.serviciosLibres !== undefined && {
        serviciosLibres: {
          deleteMany: {},
          create: body.serviciosLibres.map((s: any) => ({
            descripcion: s.descripcion,
            cantidad:    parseFloat(s.cantidad),
            precio:      parseFloat(s.precio),
          })),
        },
      }),
      ...(body.repuestos !== undefined && {
        repuestos: {
          deleteMany: {},
          create: body.repuestos.map((r: any) => ({
            referencia:  r.referencia  ?? null,
            descripcion: r.descripcion,
            cantidad:    parseInt(r.cantidad),
            precioCoste: parseFloat(r.precioCoste),
            precioVenta: parseFloat(r.precioVenta),
          })),
        },
      }),
    },
    include: {
      cliente:         { select: { id: true, nombre: true } },
      maquina:         { select: { id: true, marca: true, modelo: true } },
      serviciosLibres: true,
      repuestos:       true,
      ordenes:         { select: { id: true, numero: true, estado: true } },
    },
  });

  return NextResponse.json(updated);
}