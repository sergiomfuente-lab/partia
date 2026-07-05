import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { searchParams } = new URL(req.url);
  const clienteId = searchParams.get("clienteId");
  const estado    = searchParams.get("estado");
  const q         = searchParams.get("q");

  const presupuestos = await prisma.presupuesto.findMany({
    where: {
      empresaId,
      ...(clienteId && { clienteId }),
      ...(estado    && { estado }),
      ...(q && {
        OR: [
          { numero:      { contains: q, mode: "insensitive" } },
          { descripcion: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      cliente:  { select: { id: true, nombre: true } },
      maquina:  { select: { id: true, marca: true, modelo: true } },
      _count:   { select: { ordenes: true } },
    },
    orderBy: { fecha: "desc" },
  });

  return NextResponse.json(presupuestos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const body      = await req.json();
  const {
    clienteId, maquinaId, fecha, validezHasta,
    direccionReparacion, descripcion, observaciones, notas,
    tipoDescuento, descuentoValor,
    serviciosLibres, repuestos,
  } = body;

  if (!clienteId) return NextResponse.json({ error: "El cliente es obligatorio" }, { status: 400 });

  // Calcular totales
  const totalServicios = (serviciosLibres ?? []).reduce(
    (acc: number, s: any) => acc + s.cantidad * s.precio, 0
  );
  const totalRepuestos = (repuestos ?? []).reduce(
    (acc: number, r: any) => acc + r.cantidad * r.precioVenta, 0
  );
  const baseImponible = totalServicios + totalRepuestos;

  let descuento = 0;
  if (tipoDescuento === "porcentaje") {
    descuento = baseImponible * ((descuentoValor ?? 0) / 100);
  } else {
    descuento = descuentoValor ?? 0;
  }

  const baseConDescuento = Math.max(0, baseImponible - descuento);
  const iva   = baseConDescuento * 0.21;
  const total = baseConDescuento + iva;

  // Generar número PRES-001-2026
  const fechaPresupuesto = fecha ? new Date(fecha) : new Date();
  const anio             = fechaPresupuesto.getFullYear();

  const contador = await prisma.contadorPresupuesto.upsert({
    where:  { empresaId_anio: { empresaId, anio } },
    update: { contador: { increment: 1 } },
    create: { empresaId, anio, contador: 1 },
  });

  const numero = `PRES-${String(contador.contador).padStart(3, "0")}-${anio}`;

  const presupuesto = await prisma.presupuesto.create({
    data: {
      numero, clienteId, empresaId,
      maquinaId:          maquinaId          ?? null,
      fecha:              fechaPresupuesto,
      validezHasta:       validezHasta ? new Date(validezHasta) : null,
      direccionReparacion: direccionReparacion ?? null,
      descripcion:        descripcion         ?? null,
      observaciones:      observaciones       ?? null,
      notas:              notas               ?? null,
      tipoDescuento:      tipoDescuento       ?? "euro",
      descuentoValor:     descuentoValor      ?? 0,
      descuento,
      baseImponible,
      iva,
      total,
      serviciosLibres: {
        create: (serviciosLibres ?? []).map((s: any) => ({
          descripcion: s.descripcion,
          cantidad:    parseFloat(s.cantidad),
          precio:      parseFloat(s.precio),
        })),
      },
      repuestos: {
        create: (repuestos ?? []).map((r: any) => ({
          referencia:  r.referencia  ?? null,
          descripcion: r.descripcion,
          cantidad:    parseInt(r.cantidad),
          precioCoste: parseFloat(r.precioCoste),
          precioVenta: parseFloat(r.precioVenta),
        })),
      },
    },
    include: {
      cliente:        { select: { id: true, nombre: true } },
      maquina:        { select: { id: true, marca: true, modelo: true } },
      serviciosLibres: true,
      repuestos:       true,
    },
  });

  return NextResponse.json(presupuesto, { status: 201 });
}