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
  const estado    = searchParams.get("estado");
  const q         = searchParams.get("q");

  const facturas = await prisma.factura.findMany({
    where: {
      cliente: { usuarioId: session.user.id },
      ...(clienteId && { clienteId }),
      ...(estado    && { estado }),
      ...(q && {
        OR: [
          { numero: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      cliente: { select: { id: true, nombre: true } },
      ordenes: {
        select: {
          id:     true,
          numero: true,
          fecha:  true,
        },
      },
    },
    orderBy: { fecha: "desc" },
  });

  return NextResponse.json(facturas);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const {
    clienteId,
    ordenIds,
    fecha,
    vencimiento,
    tipoDescuento,
    descuentoValor,
    notas,
  } = body;

  if (!clienteId || !ordenIds?.length) {
    return NextResponse.json(
      { error: "Cliente y al menos una orden son obligatorios" },
      { status: 400 }
    );
  }

  // Verificar cliente
  const cliente = await prisma.cliente.findFirst({
    where: { id: clienteId, usuarioId: session.user.id },
  });
  if (!cliente) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  // Cargar órdenes con servicios y repuestos
  const ordenes = await prisma.orden.findMany({
    where: { id: { in: ordenIds }, clienteId },
    include: {
      servicios:  { include: { tipoServicio: true } },
      repuestos:  true,
      maquina:    true,
    },
  });

  // Calcular base imponible
  const baseImponible = ordenes.reduce((acc, orden) => {
    const totalServicios = orden.servicios.reduce(
      (a, s) => a + s.cantidad * s.precio, 0
    );
    const totalRepuestos = orden.repuestos.reduce(
      (a, r) => a + r.cantidad * r.precioVenta, 0
    );
    return acc + totalServicios + totalRepuestos;
  }, 0);

  // Calcular descuento
  let descuento = 0;
  if (tipoDescuento === "porcentaje") {
    descuento = baseImponible * (descuentoValor / 100);
  } else {
    descuento = descuentoValor ?? 0;
  }

  const baseConDescuento = baseImponible - descuento;
  const iva   = baseConDescuento * 0.21;
  const total = baseConDescuento + iva;

  // Generar número de factura — formato: CONTADOR_DD-MM-YYYY
  const fechaFactura = fecha ? new Date(fecha) : new Date();
  const anio         = fechaFactura.getFullYear();

  // Buscar o crear contador del año
  const contador = await prisma.contadorFactura.upsert({
    where:  { usuarioId_anio: { usuarioId: session.user.id, anio } },
    update: { contador: { increment: 1 } },
    create: { usuarioId: session.user.id, anio, contador: 1 },
  });

  const numeroContador = contador.contador;
  const dia    = String(fechaFactura.getDate()).padStart(2, "0");
  const mes    = String(fechaFactura.getMonth() + 1).padStart(2, "0");
  const numero = `${numeroContador}_${dia}-${mes}-${anio}`;

  // Crear factura
  const factura = await prisma.factura.create({
    data: {
      numero,
      clienteId,
      fecha:          fechaFactura,
      vencimiento:    vencimiento ? new Date(vencimiento) : null,
      baseImponible,
      descuento,
      tipoDescuento:  tipoDescuento  ?? "euro",
      descuentoValor: descuentoValor ?? 0,
      iva,
      total,
      notas:          notas ?? null,
      ordenes: {
        connect: ordenIds.map((id: string) => ({ id })),
      },
    },
    include: {
      cliente: true,
      ordenes: {
        include: {
          servicios:  { include: { tipoServicio: true } },
          repuestos:  true,
          maquina:    true,
        },
      },
    },
  });

  // Marcar órdenes como completadas si no lo están
  await prisma.orden.updateMany({
    where: { id: { in: ordenIds }, estado: { not: "completado" } },
    data:  { estado: "completado" },
  });

  return NextResponse.json(factura, { status: 201 });
}