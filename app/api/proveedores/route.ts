import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;

  const proveedores = await prisma.proveedor.findMany({
    where:   { empresaId },
    include: { _count: { select: { compras: true } } },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(proveedores);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const body      = await req.json();
  const { nombre, cif, direccion, telefono, email, contacto } = body;

  if (!nombre) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });

  const proveedor = await prisma.proveedor.create({
    data: { nombre, cif, direccion, telefono, email, contacto, empresaId },
  });

  return NextResponse.json(proveedor, { status: 201 });
}