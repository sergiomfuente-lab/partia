import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { searchParams } = new URL(req.url);
  const facturaId = searchParams.get("facturaId");

  const abonos = await prisma.abono.findMany({
    where: {
      empresaId,
      ...(facturaId && { facturaId }),
    },
    include: {
      serie:   { select: { id: true, nombre: true, prefijo: true } },
      factura: { select: { id: true, numero: true } },
      lineas:  true,
    },
    orderBy: { fecha: "desc" },
  });

  return NextResponse.json(abonos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const body      = await req.json();
  const { facturaId, serieId, tipo, motivo, lineas, fecha } = body;

  if (!facturaId) return NextResponse.json({ error: "La factura es obligatoria" }, { status: 400 });
  if (!serieId)   return NextResponse.json({ error: "La serie es obligatoria" }, { status: 400 });
  if (!lineas?.length) return NextResponse.json({ error: "Añade al menos una línea" }, { status: 400 });

  // Verificar factura
  const factura = await prisma.factura.findFirst({
    where: { id: facturaId, cliente: { empresaId } },
  });
  if (!factura) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });

  // Verificar serie
  const serie = await prisma.serieFacturacion.findFirst({ where: { id: serieId, empresaId } });
  if (!serie) return NextResponse.json({ error: "Serie no encontrada" }, { status: 404 });

  // Calcular totales
  const baseImponible = lineas.reduce(
    (acc: number, l: any) => acc + l.cantidad * l.precio, 0
  );
  const iva   = baseImponible * 0.21;
  const total = baseImponible + iva;

  // Generar número de abono con el contador de abonos de la serie
  const fechaAbono = fecha ? new Date(fecha) : new Date();
  const anio       = fechaAbono.getFullYear();

  const serieActualizada = await prisma.serieFacturacion.update({
    where: { id: serie.id },
    data:  { contadorAbono: { increment: 1 } },
  });

  const prefijo = serie.prefijoAbono || `ABO-${serie.prefijo}`;
  const numero  = `${prefijo}-${String(serieActualizada.contadorAbono).padStart(3, "0")}-${anio}`;

  const abono = await prisma.abono.create({
    data: {
      numero,
      facturaId,
      serieId,
      empresaId,
      tipo:         tipo    ?? "parcial",
      motivo:       motivo  ?? null,
      fecha:        fechaAbono,
      baseImponible,
      iva,
      total,
      lineas: {
        create: lineas.map((l: any) => ({
          descripcion: l.descripcion,
          cantidad:    l.cantidad,
          precio:      l.precio,
          total:       l.cantidad * l.precio,
        })),
      },
    },
    include: {
      serie:   true,
      factura: { select: { id: true, numero: true } },
      lineas:  true,
    },
  });

  return NextResponse.json(abono, { status: 201 });
}