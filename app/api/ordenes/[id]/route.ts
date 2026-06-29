import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const orden = await prisma.orden.findFirst({
    where: { id, cliente: { usuarioId: session.user.id } },
    include: {
      cliente:  true,
      maquina:  true,
      servicios:{ include: { tipoServicio: true }, orderBy: { fecha: "asc" } },
      repuestos: true,
      factura:  { select: { id: true, numero: true, estado: true } },
    },
  });

  if (!orden) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  return NextResponse.json(orden);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body   = await req.json();
  const {
    fecha,
    direccionReparacion,
    trabajosRealizados,
    observaciones,
    estado,
    servicios,
    repuestos,
  } = body;

  const orden = await prisma.orden.findFirst({
    where: { id, cliente: { usuarioId: session.user.id } },
  });
  if (!orden) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  // Actualizar orden — si vienen servicios/repuestos los reemplazamos completos
  const updated = await prisma.orden.update({
    where: { id },
    data: {
      ...(fecha               !== undefined && { fecha: new Date(fecha) }),
      ...(direccionReparacion !== undefined && { direccionReparacion }),
      ...(trabajosRealizados  !== undefined && { trabajosRealizados }),
      ...(observaciones       !== undefined && { observaciones }),
      ...(estado              !== undefined && { estado }),
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
      cliente:  { select: { id: true, nombre: true } },
      maquina:  { select: { id: true, marca: true, modelo: true } },
      servicios:{ include: { tipoServicio: true } },
      repuestos: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const orden = await prisma.orden.findFirst({
    where: { id, cliente: { usuarioId: session.user.id } },
  });
  if (!orden) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  // Borrar servicios y repuestos primero
  await prisma.servicio.deleteMany({ where: { ordenId: id } });
  await prisma.repuesto.deleteMany({ where: { ordenId: id } });
  await prisma.orden.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}