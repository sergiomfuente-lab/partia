import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { searchParams } = new URL(req.url);
  const proveedorId = searchParams.get("proveedorId");
  const tecnicoId    = searchParams.get("tecnicoId");
  const ordenId      = searchParams.get("ordenId");

  const compras = await prisma.compra.findMany({
    where: {
      empresaId,
      ...(proveedorId && { proveedorId }),
      ...(tecnicoId    && { tecnicoId }),
      ...(ordenId      && { lineas: { some: { ordenId } } }),
    },
    include: {
      proveedor: { select: { id: true, nombre: true } },
      tecnico:   { select: { id: true, nombre: true } },
      lineas:    { include: { orden: { select: { id: true, numero: true } } } },
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
  if (!empresaId) return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });

  const body = await req.json();
  const {
    fecha, numeroAlbaran, proveedorId, proveedorNombre, observaciones,
    fotoTicketBase64, tecnicoId, lineas,
  } = body;

  if (!lineas?.length) {
    return NextResponse.json({ error: "Añade al menos una línea" }, { status: 400 });
  }

  // Seguridad: si alguna línea va ligada a una orden concreta (compra de
  // materiales hecha sobre la marcha para ese trabajo), comprobar que esa
  // orden pertenece de verdad a la empresa del usuario antes de tocar nada.
  const ordenIds = [...new Set(lineas.map((l: any) => l.ordenId).filter(Boolean))] as string[];
  if (ordenIds.length) {
    const ordenesValidas = await prisma.orden.findMany({
      where:  { id: { in: ordenIds }, empresaId },
      select: { id: true },
    });
    if (ordenesValidas.length !== ordenIds.length) {
      return NextResponse.json({ error: "Alguna de las órdenes indicadas no es válida" }, { status: 400 });
    }
  }

  const total = lineas.reduce((acc: number, l: any) => acc + l.cantidad * l.precioCoste, 0);

  const { compra, repuestosCreados } = await prisma.$transaction(async (tx) => {
    const compra = await tx.compra.create({
      data: {
        fecha:            fecha ? new Date(fecha) : new Date(),
        numeroAlbaran:    numeroAlbaran    ?? null,
        proveedorId:      proveedorId      ?? null,
        proveedorNombre:  proveedorNombre  ?? null,
        observaciones:    observaciones    ?? null,
        fotoTicketBase64: fotoTicketBase64 ?? null,
        tecnicoId:        tecnicoId        ?? null,
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

    // Líneas ligadas a una orden concreta: material comprado sobre la
    // marcha para ese trabajo. Se refleja también como recambio facturable
    // de esa orden, además de quedar el registro de la compra en sí.
    const repuestosCreados = [];
    for (const linea of lineas) {
      if (linea.ordenId) {
        const repuesto = await tx.repuesto.create({
          data: {
            ordenId:     linea.ordenId,
            referencia:  linea.referencia ?? null,
            descripcion: linea.descripcion,
            cantidad:    parseFloat(linea.cantidad),
            precioCoste: parseFloat(linea.precioCoste),
            precioVenta: parseFloat(linea.precioVenta),
          },
        });
        repuestosCreados.push(repuesto);
      }
    }

    return { compra, repuestosCreados };
  });

  return NextResponse.json({ ...compra, repuestosCreados }, { status: 201 });
}
