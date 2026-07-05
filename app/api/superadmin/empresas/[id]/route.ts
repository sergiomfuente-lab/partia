import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if ((session.user as any).rol !== "superadmin") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const { id } = await params;
  const body   = await req.json();

  const empresa = await prisma.empresa.findUnique({ where: { id } });
  if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });

  const updated = await prisma.empresa.update({
    where: { id },
    data: {
      ...(body.nombre          !== undefined && { nombre: body.nombre }),
      ...(body.nombreFiscal    !== undefined && { nombreFiscal: body.nombreFiscal }),
      ...(body.cifNif          !== undefined && { cifNif: body.cifNif }),
      ...(body.direccionFiscal !== undefined && { direccionFiscal: body.direccionFiscal }),
      ...(body.codigoPostal    !== undefined && { codigoPostal: body.codigoPostal }),
      ...(body.ciudad          !== undefined && { ciudad: body.ciudad }),
      ...(body.provincia       !== undefined && { provincia: body.provincia }),
      ...(body.telefono        !== undefined && { telefono: body.telefono }),
      ...(body.emailFacturacion!== undefined && { emailFacturacion: body.emailFacturacion }),
      ...(body.iban            !== undefined && { iban: body.iban }),
      ...(body.precioHora      !== undefined && { precioHora:  parseFloat(body.precioHora) }),
      ...(body.precioPorKm     !== undefined && { precioPorKm: parseFloat(body.precioPorKm) }),
      ...(body.activa          !== undefined && { activa: body.activa }),
    },
    include: {
      _count: { select: { usuarios: true, clientes: true } },
    },
  });

  return NextResponse.json(updated);
}