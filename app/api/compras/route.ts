import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { searchParams } = new URL(req.url);
  const proveedorId = searchParams.get("proveedorId");

  const compras = await prisma.compra.findMany({
    where: {
      empresaId,
      ...(proveedorId && { proveedorId }),
    },
    include: {
      proveedor: { select: { id: true, nombre: true } },
      lineas:    true,
      _count:    { select: { lineas: true } },
    },
    orderBy: { fecha: "desc" },
  });

  return NextResponse.json(compras);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const body      = await req.json();
  const { fecha, numeroAlbaran, proveedorId, proveedorNombre, observaciones, lineas } = body;

  if (!lineas?.length) {
    return NextResponse.json({ error: "Añade al menos una línea" }, { status: 400 });
  }

  const total = lineas.reduce((acc: number, l: any) => acc + l.cantidad * l.precioCoste, 0);

  const compra = await prisma.$transaction(async (tx) => {
    const compra = await tx.compra.create({
      data: {
        fecha:           fecha ? new Date(fecha) : new Date(),
        numeroAlbaran:   numeroAlbaran ?? null,
        proveedorId:     proveedorId   ?? null,
        proveedorNombre: proveedorNombre ?? null,
        observaciones:   observaciones  ?? null,
        total,
        empresaId,
        lineas: {
          create: lineas.map((l: any) => ({
            productoId:  l.productoId  ?? null,
            descripcion: l.descripcion,
            referencia:  l.referencia  ?? null,
            cantidad:    parseFloat(l.cantidad),
            precioCoste: parseFloat(l.precioCoste),
            precioVenta: parseFloat(l.precioVenta),
            aStock:      l.aStock ?? false,
            ordenId:     l.ordenId ?? null,
          })),
        },
      },
      include: {
        lineas: true,
        proveedor: true,
      },
    });

    // Procesar líneas: actualizar stock y crear movimientos
    for (const linea of lineas) {
      if (linea.aStock && linea.productoId) {
        // Entrada a stock
        await tx.producto.update({
          where: { id: linea.productoId },
          data:  { stock: { increment: parseFloat(linea.cantidad) } },
        });
        await tx.movimientoStock.create({
          data: {
            productoId:  linea.productoId,
            tipo:        "entrada",
            cantidad:    parseFloat(linea.cantidad),
            precioCoste: parseFloat(linea.precioCoste),
            compraId:    compra.id,
            motivo:      `Compra ${numeroAlbaran ?? compra.id}`,
          },
        });
      }
    }

    return compra;
  });

  return NextResponse.json(compra, { status: 201 });
}