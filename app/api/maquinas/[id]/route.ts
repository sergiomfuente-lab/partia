import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const maquina = await prisma.maquina.findFirst({
    where: { id, cliente: { usuarioId: session.user.id } },
    include: {
      cliente: { select: { id: true, nombre: true } },
      ordenes: {
        orderBy: { fecha: "desc" },
        include: { _count: { select: { repuestos: true } } },
      },
    },
  });

  if (!maquina) {
    return NextResponse.json({ error: "Máquina no encontrada" }, { status: 404 });
  }

  return NextResponse.json(maquina);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { marca, modelo, numeroDeSerie, horasIniciales, horasActuales, observaciones, estado } = body;

  const maquina = await prisma.maquina.findFirst({
    where: { id, cliente: { usuarioId: session.user.id } },
  });
  if (!maquina) {
    return NextResponse.json({ error: "Máquina no encontrada" }, { status: 404 });
  }

  const updated = await prisma.maquina.update({
    where: { id },
    data: {
      ...(marca !== undefined && { marca }),
      ...(modelo !== undefined && { modelo }),
      ...(numeroDeSerie !== undefined && { numeroDeSerie }),
      ...(horasIniciales !== undefined && { horasIniciales }),
      ...(horasActuales !== undefined && { horasActuales }),
      ...(observaciones !== undefined && { observaciones }),
      ...(estado !== undefined && { estado }),
    },
    include: {
      cliente: { select: { id: true, nombre: true } },
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

  const maquina = await prisma.maquina.findFirst({
    where: { id, cliente: { usuarioId: session.user.id } },
  });
  if (!maquina) {
    return NextResponse.json({ error: "Máquina no encontrada" }, { status: 404 });
  }

  await prisma.maquina.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}