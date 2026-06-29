import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const anio     = new Date().getFullYear();
  const contador = await prisma.contadorFactura.findUnique({
    where: { usuarioId_anio: { usuarioId: session.user.id, anio } },
  });

  return NextResponse.json({ anio, contador: contador?.contador ?? 0 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { anio, contador } = body;

  if (!anio || contador === undefined) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const updated = await prisma.contadorFactura.upsert({
    where:  { usuarioId_anio: { usuarioId: session.user.id, anio } },
    update: { contador },
    create: { usuarioId: session.user.id, anio, contador },
  });

  return NextResponse.json(updated);
}