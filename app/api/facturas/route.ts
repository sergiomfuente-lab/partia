import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const clienteId = searchParams.get("clienteId");
  const estado    = searchParams.get("estado");
  const q         = searchParams.get("q");

  const facturas = await prisma.factura.findMany({
    where: {
      empresaId,
      ...(clienteId && { clienteId }),
      ...(estado    && { estado }),
      ...(q && { OR: [{ numero: { contains: q, mode: "insensitive" } }] }),
    },
    include: {
      cliente:       { select: { id: true, nombre: true } },
      ordenes:       { select: { id: true, numero: true, fecha: true } },
      serie:         { select: { id: true, nombre: true, prefijo: true } },
      lineasDirectas:true,
    },
    orderBy: { fecha: "desc" },
  });

  return NextResponse.json(facturas);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });
  const body      = await req.json();
  const {
    clienteId, serieId, fecha, vencimiento,
    tipoDescuento, descuentoValor, notas,
    esDirecta, ordenIds, lineasDirectas,
  } = body;

  if (!clienteId) {
    return NextResponse.json({ error: "El cliente es obligatorio" }, { status: 400 });
  }

  const cliente = await prisma.cliente.findFirst({ where: { id: clienteId, empresaId } });
  if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  // Validar serie
  let serie = null;
  if (serieId) {
    serie = await prisma.serieFacturacion.findFirst({ where: { id: serieId, empresaId } });
    if (!serie) return NextResponse.json({ error: "Serie no encontrada" }, { status: 404 });
  }

  const fechaFactura = fecha ? new Date(fecha) : new Date();
  const anio         = fechaFactura.getFullYear();
  const dia          = String(fechaFactura.getDate()).padStart(2, "0");
  const mes          = String(fechaFactura.getMonth() + 1).padStart(2, "0");

  let numero = "";
  let baseImponible = 0;
  let descuento     = 0;

  if (esDirecta) {
    // ---- FACTURA DIRECTA ----
    if (!lineasDirectas?.length) {
      return NextResponse.json({ error: "Añade al menos una línea" }, { status: 400 });
    }

    baseImponible = lineasDirectas.reduce(
      (acc: number, l: any) => acc + l.cantidad * l.precioVenta, 0
    );

    if (tipoDescuento === "porcentaje") {
      descuento = baseImponible * ((descuentoValor ?? 0) / 100);
    } else {
      descuento = descuentoValor ?? 0;
    }

    // Generar número con serie o contador legado
    if (serie) {
      const serieActualizada = await prisma.serieFacturacion.update({
        where: { id: serie.id },
        data:  { contadorActual: { increment: 1 } },
      });
      numero = `${serie.prefijo}-${String(serieActualizada.contadorActual).padStart(3, "0")}-${anio}`;
    } else {
      const contador = await prisma.contadorFactura.upsert({
        where:  { empresaId_anio: { empresaId, anio } },
        update: { contador: { increment: 1 } },
        create: { empresaId, anio, contador: 1 },
      });
      numero = `${contador.contador}_${dia}-${mes}-${anio}`;
    }

    const baseConDescuento = Math.max(0, baseImponible - descuento);
    const iva   = baseConDescuento * 0.21;
    const total = baseConDescuento + iva;

    const factura = await prisma.factura.create({
      data: {
        numero, clienteId, empresaId,
        serieId:        serieId ?? null,
        fecha:          fechaFactura,
        vencimiento:    vencimiento ? new Date(vencimiento) : null,
        baseImponible,
        descuento,
        tipoDescuento:  tipoDescuento  ?? "euro",
        descuentoValor: descuentoValor ?? 0,
        iva, total,
        notas:          notas ?? null,
        esDirecta:      true,
        lineasDirectas: {
          create: lineasDirectas.map((l: any) => ({
            tipo:           l.tipo          ?? "libre",
            tipoServicioId: l.tipoServicioId ?? null,
            descripcion:    l.descripcion,
            cantidad:       l.cantidad,
            precioCoste:    l.precioCoste   ?? 0,
            precioVenta:    l.precioVenta,
          })),
        },
      },
      include: {
        cliente:        true,
        serie:          true,
        lineasDirectas: true,
        ordenes:        true,
      },
    });

    return NextResponse.json(factura, { status: 201 });

  } else {
    // ---- FACTURA DESDE ÓRDENES ----
    if (!ordenIds?.length) {
      return NextResponse.json({ error: "Selecciona al menos una orden" }, { status: 400 });
    }

    const ordenes = await prisma.orden.findMany({
      where:   { id: { in: ordenIds }, clienteId },
      include: { servicios: true, serviciosLibres: true, repuestos: true },
    });

    baseImponible = ordenes.reduce((acc, orden) => {
      const s  = orden.servicios.reduce((a, s) => a + s.cantidad * s.precio, 0);
      const sl = orden.serviciosLibres.reduce((a, s) => a + s.cantidad * s.precio, 0);
      const r  = orden.repuestos.reduce((a, r) => a + r.cantidad * r.precioVenta, 0);
      return acc + s + sl + r;
    }, 0);

    if (tipoDescuento === "porcentaje") {
      descuento = baseImponible * ((descuentoValor ?? 0) / 100);
    } else {
      descuento = descuentoValor ?? 0;
    }

    // Generar número con serie o contador legado
    if (serie) {
      const serieActualizada = await prisma.serieFacturacion.update({
        where: { id: serie.id },
        data:  { contadorActual: { increment: 1 } },
      });
      numero = `${serie.prefijo}-${String(serieActualizada.contadorActual).padStart(3, "0")}-${anio}`;
    } else {
      const contador = await prisma.contadorFactura.upsert({
        where:  { empresaId_anio: { empresaId, anio } },
        update: { contador: { increment: 1 } },
        create: { empresaId, anio, contador: 1 },
      });
      numero = `${contador.contador}_${dia}-${mes}-${anio}`;
    }

    const baseConDescuento = Math.max(0, baseImponible - descuento);
    const iva   = baseConDescuento * 0.21;
    const total = baseConDescuento + iva;

    const factura = await prisma.factura.create({
      data: {
        numero, clienteId, empresaId,
        serieId:        serieId ?? null,
        fecha:          fechaFactura,
        vencimiento:    vencimiento ? new Date(vencimiento) : null,
        baseImponible,
        descuento,
        tipoDescuento:  tipoDescuento  ?? "euro",
        descuentoValor: descuentoValor ?? 0,
        iva, total,
        notas:          notas ?? null,
        esDirecta:      false,
        ordenes: { connect: ordenIds.map((id: string) => ({ id })) },
      },
      include: {
        cliente: true,
        serie:   true,
        ordenes: {
          include: {
            servicios:       { include: { tipoServicio: true } },
            serviciosLibres: true,
            repuestos:       true,
            maquina:         true,
          },
        },
      },
    });

    await prisma.orden.updateMany({
      where: { id: { in: ordenIds }, estado: { not: "completado" } },
      data:  { estado: "completado" },
    });

    return NextResponse.json(factura, { status: 201 });
  }
}