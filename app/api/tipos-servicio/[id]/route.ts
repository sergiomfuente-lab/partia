import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body   = await req.json();
  const { nombre, unidad, activo } = body;

  const updated = await prisma.tipoServicio.update({
    where: { id },
    data: {
      ...(nombre !== undefined && { nombre }),
      ...(unidad !== undefined && { unidad }),
      ...(activo !== undefined && { activo }),
    },
  });

  return NextResponse.json(updated);
}