import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tipos = await prisma.tipoServicio.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
  });

  return NextResponse.json(tipos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { nombre, unidad } = body;

  if (!nombre?.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }

  const ultimo = await prisma.tipoServicio.findFirst({
    orderBy: { orden: "desc" },
  });

  const tipo = await prisma.tipoServicio.create({
    data: {
      nombre,
      unidad: unidad ?? "ud",
      orden: (ultimo?.orden ?? 0) + 1,
    },
  });

  return NextResponse.json(tipo, { status: 201 });
}