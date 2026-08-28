import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q    = searchParams.get("q");
  const tipo = searchParams.get("tipo");

  const clientes = await prisma.cliente.findMany({
    where: {
      empresaId,
      ...(tipo && tipo !== "todos" && { tipo }),
      ...(q && {
        OR: [
          { nombre:      { contains: q, mode: "insensitive" } },
          { cif:         { contains: q, mode: "insensitive" } },
          { email:       { contains: q, mode: "insensitive" } },
          { razonSocial: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      _count: { select: { maquinas: true, ordenes: true } },
    },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(clientes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });
  }

  const body = await req.json();
  const {
    nombre, nombreComercial, razonSocial, cif, direccionFacturacion,
    formaPago, email, telefono, tipo,
    observaciones, precioHoraEspecial, precioPorKmEspecial,
  } = body;

  // El CIF es obligatorio en el formulario de oficina (validacion HTML alli),
  // pero se permite crear clientes sin CIF desde la app del tecnico (llamada
  // de un cliente nuevo sobre la marcha, sin todos los datos fiscales a mano).
  if (!nombre) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }

  const cliente = await prisma.cliente.create({
    data: {
      nombre, nombreComercial, razonSocial, cif, direccionFacturacion,
      formaPago, email, telefono,
      tipo:               tipo ?? "empresa",
      observaciones,
      precioHoraEspecial: precioHoraEspecial  ? parseFloat(precioHoraEspecial)  : null,
      precioPorKmEspecial: precioPorKmEspecial ? parseFloat(precioPorKmEspecial) : null,
      empresaId,
      usuarioId: session.user.id,
    },
  });

  return NextResponse.json(cliente, { status: 201 });
}