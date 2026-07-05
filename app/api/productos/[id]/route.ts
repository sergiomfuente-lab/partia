import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { id }    = await params;
  const body      = await req.json();

  const producto = await prisma.producto.findFirst({ where: { id, empresaId } });
  if (!producto) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  const updated = await prisma.producto.update({
    where: { id },
    data: {
      ...(body.nombre       !== undefined && { nombre:       body.nombre }),
      ...(body.referencia   !== undefined && { referencia:   body.referencia }),
      ...(body.descripcion  !== undefined && { descripcion:  body.descripcion }),
      ...(body.precioCoste  !== undefined && { precioCoste:  parseFloat(body.precioCoste) }),
      ...(body.precioVenta  !== undefined && { precioVenta:  parseFloat(body.precioVenta) }),
      ...(body.stockMinimo  !== undefined && { stockMinimo:  parseFloat(body.stockMinimo) }),
      ...(body.unidad       !== undefined && { unidad:       body.unidad }),
      ...(body.activo       !== undefined && { activo:       body.activo }),
    },
  });

  return NextResponse.json(updated);
}