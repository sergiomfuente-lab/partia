import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { id } = await params;

  const cliente = await prisma.cliente.findFirst({
    where: { id, empresaId },
    include: {
      maquinas: true,
      ordenes: {
        include: { maquina: true, servicios: { include: { tipoServicio: true } } },
        orderBy: { createdAt: "desc" },
      },
      facturas: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  return NextResponse.json(cliente);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { id }    = await params;
  const body      = await req.json();

  const cliente = await prisma.cliente.findFirst({ where: { id, empresaId } });
  if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  const updated = await prisma.cliente.update({
    where: { id },
    data: {
      ...(body.nombre              !== undefined && { nombre: body.nombre }),
      ...(body.razonSocial         !== undefined && { razonSocial: body.razonSocial }),
      ...(body.cif                 !== undefined && { cif: body.cif }),
      ...(body.direccionFacturacion!== undefined && { direccionFacturacion: body.direccionFacturacion }),
      ...(body.formaPago           !== undefined && { formaPago: body.formaPago }),
      ...(body.email               !== undefined && { email: body.email }),
      ...(body.telefono            !== undefined && { telefono: body.telefono }),
      ...(body.tipo                !== undefined && { tipo: body.tipo }),
      ...(body.observaciones       !== undefined && { observaciones: body.observaciones }),
      ...(body.activo              !== undefined && { activo: body.activo }),
      ...(body.precioHoraEspecial  !== undefined && { precioHoraEspecial:  body.precioHoraEspecial  ? parseFloat(body.precioHoraEspecial)  : null }),
      ...(body.precioPorKmEspecial !== undefined && { precioPorKmEspecial: body.precioPorKmEspecial ? parseFloat(body.precioPorKmEspecial) : null }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { id }    = await params;

  const cliente = await prisma.cliente.findFirst({ where: { id, empresaId } });
  if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  await prisma.cliente.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}