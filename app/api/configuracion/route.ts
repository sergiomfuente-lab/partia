import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: {
      id:               true,
      nombre:           true,
      email:            true,
      precioHora:       true,
      precioPorKm:      true,
      nombreFiscal:     true,
      cifNif:           true,
      direccionFiscal:  true,
      codigoPostal:     true,
      ciudad:           true,
      provincia:        true,
      telefono:         true,
      emailFacturacion: true,
      iban:             true,
    },
  });

  return NextResponse.json(usuario);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const {
    nombre,
    precioHora,
    precioPorKm,
    nombreFiscal,
    cifNif,
    direccionFiscal,
    codigoPostal,
    ciudad,
    provincia,
    telefono,
    emailFacturacion,
    iban,
  } = body;

  const updated = await prisma.usuario.update({
    where: { id: session.user.id },
    data: {
      ...(nombre           !== undefined && { nombre }),
      ...(precioHora       !== undefined && { precioHora:       parseFloat(precioHora) }),
      ...(precioPorKm      !== undefined && { precioPorKm:      parseFloat(precioPorKm) }),
      ...(nombreFiscal     !== undefined && { nombreFiscal }),
      ...(cifNif           !== undefined && { cifNif }),
      ...(direccionFiscal  !== undefined && { direccionFiscal }),
      ...(codigoPostal     !== undefined && { codigoPostal }),
      ...(ciudad           !== undefined && { ciudad }),
      ...(provincia        !== undefined && { provincia }),
      ...(telefono         !== undefined && { telefono }),
      ...(emailFacturacion !== undefined && { emailFacturacion }),
      ...(iban             !== undefined && { iban }),
    },
  });

  return NextResponse.json(updated);
}