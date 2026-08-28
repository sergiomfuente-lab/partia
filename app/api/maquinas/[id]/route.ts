import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { id }    = await params;

  const maquina = await prisma.maquina.findFirst({
    where: { id, cliente: { empresaId } },
    include: {
      cliente: { select: { id: true, nombre: true } },
      ordenes: {
        orderBy: { fecha: "desc" },
        include: { _count: { select: { repuestos: true } } },
      },
    },
  });

  if (!maquina) return NextResponse.json({ error: "Máquina no encontrada" }, { status: 404 });
  return NextResponse.json(maquina);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { id }    = await params;
  const body      = await req.json();

  const maquina = await prisma.maquina.findFirst({ where: { id, cliente: { empresaId } } });
  if (!maquina) return NextResponse.json({ error: "Máquina no encontrada" }, { status: 404 });

  const updated = await prisma.maquina.update({
    where: { id },
    data: {
      ...(body.marca          !== undefined && { marca: body.marca }),
      ...(body.modelo         !== undefined && { modelo: body.modelo }),
      ...(body.numeroDeSerie  !== undefined && { numeroDeSerie: body.numeroDeSerie }),
      ...(body.matricula      !== undefined && { matricula: body.matricula }),
      ...(body.horasIniciales !== undefined && { horasIniciales: body.horasIniciales }),
      ...(body.horasActuales  !== undefined && { horasActuales: body.horasActuales }),
      ...(body.observaciones  !== undefined && { observaciones: body.observaciones }),
      ...(body.estado         !== undefined && { estado: body.estado }),
    },
    include: { cliente: { select: { id: true, nombre: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { id }    = await params;

  const maquina = await prisma.maquina.findFirst({ where: { id, cliente: { empresaId } } });
  if (!maquina) return NextResponse.json({ error: "Máquina no encontrada" }, { status: 404 });

  await prisma.maquina.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}