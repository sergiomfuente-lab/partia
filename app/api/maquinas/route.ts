import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clienteId = searchParams.get("clienteId");
  const estado = searchParams.get("estado");
  const q = searchParams.get("q");

  const maquinas = await prisma.maquina.findMany({
    where: {
      cliente: { usuarioId: session.user.id },
      ...(clienteId && { clienteId }),
      ...(estado && { estado }),
      ...(q && {
        OR: [
          { marca: { contains: q, mode: "insensitive" } },
          { modelo: { contains: q, mode: "insensitive" } },
          { numeroDeSerie: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      cliente: { select: { id: true, nombre: true } },
      _count: { select: { ordenes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(maquinas);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { marca, modelo, numeroDeSerie, horasIniciales, observaciones, clienteId } = body;

  if (!marca || !modelo || !numeroDeSerie || !clienteId) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const cliente = await prisma.cliente.findFirst({
    where: { id: clienteId, usuarioId: session.user.id },
  });
  if (!cliente) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const maquina = await prisma.maquina.create({
    data: {
      marca,
      modelo,
      numeroDeSerie,
      horasIniciales: horasIniciales ?? 0,
      horasActuales: horasIniciales ?? 0,
      observaciones,
      clienteId,
    },
    include: {
      cliente: { select: { id: true, nombre: true } },
    },
  });

  return NextResponse.json(maquina, { status: 201 });
}