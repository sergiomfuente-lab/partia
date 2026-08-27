import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { searchParams } = new URL(req.url);
  const clienteId = searchParams.get("clienteId");
  const maquinaId = searchParams.get("maquinaId");
  const estado    = searchParams.get("estado");
  const q         = searchParams.get("q");

  const ordenes = await prisma.orden.findMany({
    where: {
      empresaId,
      ...(clienteId && { clienteId }),
      ...(maquinaId && { maquinaId }),
      ...(estado    && { estado }),
      ...(q && {
        OR: [
          { numero:              { contains: q, mode: "insensitive" } },
          { trabajosRealizados:  { contains: q, mode: "insensitive" } },
          { direccionReparacion: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      cliente:         { select: { id: true, nombre: true } },
      maquina:         { select: { id: true, marca: true, modelo: true } },
      servicios:       { include: { tipoServicio: true } },
      serviciosLibres: true,
      _count:          { select: { repuestos: true, servicios: true } },
    },
    orderBy: { fecha: "desc" },
  });

  return NextResponse.json(ordenes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const body      = await req.json();
  const {
    clienteId, maquinaId, fecha,
    direccionReparacion, trabajosRealizados, observaciones,
    servicios, serviciosLibres, repuestos,
  } = body;

  if (!clienteId || !maquinaId) {
    return NextResponse.json({ error: "Cliente y máquina son obligatorios" }, { status: 400 });
  }

  const cliente = await prisma.cliente.findFirst({ where: { id: clienteId, empresaId } });
  if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  // Numeración atómica por empresa (evita colisiones si dos personas
  // crean una orden a la vez, cosa que el cálculo anterior por
  // "última orden + 1" no garantizaba).
  const orden = await prisma.$transaction(async (tx) => {
    const contador = await tx.contadorOrden.upsert({
      where:  { empresaId },
      create: { empresaId, contador: 1 },
      update: { contador: { increment: 1 } },
    });
    const numero = `ORD-${String(contador.contador).padStart(5, "0")}`;

    return tx.orden.create({
      data: {
        numero,
        empresaId,
        clienteId,
        maquinaId,
        fecha:               fecha ? new Date(fecha) : new Date(),
        direccionReparacion: direccionReparacion ?? null,
        trabajosRealizados:  trabajosRealizados  ?? null,
        observaciones:       observaciones       ?? null,
        servicios: {
          create: (servicios ?? []).map((s: any) => ({
            fecha:          s.fecha ? new Date(s.fecha) : new Date(),
            tipoServicioId: s.tipoServicioId,
            cantidad:       s.cantidad,
            precio:         s.precio,
            descripcion:    s.descripcion ?? null,
          })),
        },
        serviciosLibres: {
          create: (serviciosLibres ?? []).map((s: any) => ({
            descripcion: s.descripcion,
            cantidad:    s.cantidad,
            precio:      s.precio,
          })),
        },
        repuestos: {
          create: (repuestos ?? []).map((r: any) => ({
            referencia:  r.referencia  ?? null,
            descripcion: r.descripcion,
            cantidad:    r.cantidad,
            precioCoste: r.precioCoste,
            precioVenta: r.precioVenta,
          })),
        },
      },
      include: {
        cliente:         { select: { id: true, nombre: true } },
        maquina:         { select: { id: true, marca: true, modelo: true } },
        servicios:       { include: { tipoServicio: true } },
        serviciosLibres: true,
        repuestos:       true,
      },
    });
  });

  // Actualizar horas máquina
  const horasManoObra = (servicios ?? [])
    .filter((s: any) => s.esManoObra)
    .reduce((acc: number, s: any) => acc + (s.cantidad ?? 0), 0);

  if (horasManoObra > 0) {
    await prisma.maquina.update({
      where: { id: maquinaId },
      data:  { horasActuales: { increment: horasManoObra } },
    });
  }

  return NextResponse.json(orden, { status: 201 });
}