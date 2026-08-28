import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { id }    = await params;
  const body      = await req.json();
  const { cantidad, ordenId, motivo } = body;

  if (!cantidad || cantidad <= 0) {
    return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
  }

  const producto = await prisma.producto.findFirst({ where: { id, empresaId } });
  if (!producto) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  if (producto.stock < cantidad) {
    return NextResponse.json({ error: `Stock insuficiente. Disponible: ${producto.stock}` }, { status: 400 });
  }

  // Seguridad: si se indica una orden, comprobar que pertenece de verdad a
  // la empresa del usuario (esta ruta la puede llamar también un técnico
  // desde el móvil, al usar material del almacén en un trabajo).
  if (ordenId) {
    const ordenValida = await prisma.orden.findFirst({ where: { id: ordenId, empresaId }, select: { id: true } });
    if (!ordenValida) {
      return NextResponse.json({ error: "La orden indicada no es válida" }, { status: 400 });
    }
  }

  const resultado = await prisma.$transaction(async (tx) => {
    const updated = await tx.producto.update({
      where: { id },
      data:  { stock: { decrement: parseFloat(cantidad) } },
    });

    const movimiento = await tx.movimientoStock.create({
      data: {
        productoId:  id,
        tipo:        "salida",
        cantidad:    parseFloat(cantidad),
        precioCoste: producto.precioCoste,
        ordenId:     ordenId ?? null,
        motivo:      motivo  ?? null,
      },
    });

    // Si va a una orden, crear repuesto automáticamente
    let repuestoCreado = null;
    if (ordenId) {
      repuestoCreado = await tx.repuesto.create({
        data: {
          referencia:  producto.referencia  ?? null,
          descripcion: producto.nombre,
          cantidad:    parseInt(cantidad),
          precioCoste: producto.precioCoste,
          precioVenta: producto.precioVenta,
          ordenId,
        },
      });
    }

    return { producto: updated, movimiento, repuestoCreado };
  });

  return NextResponse.json(resultado);
}