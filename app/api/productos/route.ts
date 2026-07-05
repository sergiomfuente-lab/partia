import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  const productos = await prisma.producto.findMany({
    where: {
      empresaId,
      activo: true,
      ...(q && {
        OR: [
          { nombre:     { contains: q, mode: "insensitive" } },
          { referencia: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(productos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const body      = await req.json();
  const { nombre, referencia, descripcion, precioCoste, precioVenta, stockMinimo, unidad } = body;

  if (!nombre) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });

  const producto = await prisma.producto.create({
    data: {
      nombre, referencia, descripcion,
      precioCoste:  precioCoste  ? parseFloat(precioCoste)  : 0,
      precioVenta:  precioVenta  ? parseFloat(precioVenta)  : 0,
      stock:        0,
      stockMinimo:  stockMinimo  ? parseFloat(stockMinimo)  : 0,
      unidad:       unidad ?? "ud",
      empresaId,
    },
  });

  return NextResponse.json(producto, { status: 201 });
}