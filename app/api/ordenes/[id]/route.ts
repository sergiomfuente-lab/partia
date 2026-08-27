import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });
  const { id }    = await params;

  const orden = await prisma.orden.findFirst({
    where: { id, empresaId },
    include: {
      cliente:         true,
      maquina:         true,
      servicios:       { include: { tipoServicio: true }, orderBy: { fecha: "asc" } },
      serviciosLibres: true,
      repuestos:       true,
      factura:         { select: { id: true, numero: true, estado: true } },
    },
  });

  if (!orden) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  return NextResponse.json(orden);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });
  const { id }    = await params;
  const body      = await req.json();
  const {
    fecha, direccionReparacion, trabajosRealizados,
    observaciones, estado, servicios, serviciosLibres, repuestos,
    firmaDni, firmaObservaciones, firmaBase64,
    mostrarPrecios,
  } = body;

  const orden = await prisma.orden.findFirst({
    where: { id, empresaId },
  });
  if (!orden) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  const updated = await prisma.orden.update({
    where: { id },
    data: {
      ...(fecha               !== undefined && { fecha:               new Date(fecha) }),
      ...(direccionReparacion !== undefined && { direccionReparacion }),
      ...(trabajosRealizados  !== undefined && { trabajosRealizados }),
      ...(observaciones       !== undefined && { observaciones }),
      ...(estado              !== undefined && { estado }),
      ...(mostrarPrecios      !== undefined && { mostrarPrecios }),
      ...(firmaDni            !== undefined && { firmaDni }),
      ...(firmaObservaciones  !== undefined && { firmaObservaciones }),
      ...(firmaBase64         !== undefined && { firmaBase64 }),
      ...(servicios !== undefined && {
        servicios: {
          deleteMany: {},
          create: servicios.map((s: any) => ({
            fecha:          s.fecha ? new Date(s.fecha) : new Date(),
            tipoServicioId: s.tipoServicioId,
            cantidad:       s.cantidad,
            precio:         s.precio,
            descripcion:    s.descripcion ?? null,
          })),
        },
      }),
      ...(serviciosLibres !== undefined && {
        serviciosLibres: {
          deleteMany: {},
          create: serviciosLibres.map((s: any) => ({
            descripcion: s.descripcion,
            cantidad:    s.cantidad,
            precio:      s.precio,
          })),
        },
      }),
      ...(repuestos !== undefined && {
        repuestos: {
          deleteMany: {},
          create: repuestos.map((r: any) => ({
            referencia:  r.referencia  ?? null,
            descripcion: r.descripcion,
            cantidad:    r.cantidad,
            precioCoste: r.precioCoste,
            precioVenta: r.precioVenta,
          })),
        },
      }),
    },
    include: {
      cliente:         { select: { id: true, nombre: true } },
      maquina:         { select: { id: true, marca: true, modelo: true } },
      servicios:       { include: { tipoServicio: true } },
      serviciosLibres: true,
      repuestos:       true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });
  const { id }    = await params;

  const orden = await prisma.orden.findFirst({
    where: { id, empresaId },
  });
  if (!orden) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  await prisma.servicio.deleteMany({ where: { ordenId: id } });
  await prisma.servicioLibre.deleteMany({ where: { ordenId: id } });
  await prisma.repuesto.deleteMany({ where: { ordenId: id } });
  await prisma.orden.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}