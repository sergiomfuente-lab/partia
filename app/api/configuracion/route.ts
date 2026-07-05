import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;

  const [usuario, empresa] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { id: true, nombre: true, email: true },
    }),
    prisma.empresa.findUnique({
      where: { id: empresaId },
      select: {
        id: true, nombre: true, nombreFiscal: true, cifNif: true,
        direccionFiscal: true, codigoPostal: true, ciudad: true,
        provincia: true, telefono: true, emailFacturacion: true,
        iban: true, precioHora: true, precioPorKm: true,
        logoBase64: true, textoRgpd: true,
      },
    }),
  ]);

  return NextResponse.json({ usuario, empresa });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const body      = await req.json();

  const {
    nombre,
    nombreFiscal, cifNif, direccionFiscal, codigoPostal,
    ciudad, provincia, telefono, emailFacturacion, iban,
    precioHora, precioPorKm, logoBase64, textoRgpd,
  } = body;

  const [usuario, empresa] = await Promise.all([
    nombre !== undefined
      ? prisma.usuario.update({ where: { id: session.user.id }, data: { nombre } })
      : Promise.resolve(null),
    prisma.empresa.update({
      where: { id: empresaId },
      data: {
        ...(nombreFiscal     !== undefined && { nombreFiscal }),
        ...(cifNif           !== undefined && { cifNif }),
        ...(direccionFiscal  !== undefined && { direccionFiscal }),
        ...(codigoPostal     !== undefined && { codigoPostal }),
        ...(ciudad           !== undefined && { ciudad }),
        ...(provincia        !== undefined && { provincia }),
        ...(telefono         !== undefined && { telefono }),
        ...(emailFacturacion !== undefined && { emailFacturacion }),
        ...(iban             !== undefined && { iban }),
        ...(precioHora       !== undefined && { precioHora:  parseFloat(precioHora) }),
        ...(precioPorKm      !== undefined && { precioPorKm: parseFloat(precioPorKm) }),
        ...(logoBase64       !== undefined && { logoBase64 }),
        ...(textoRgpd        !== undefined && { textoRgpd }),
      },
    }),
  ]);

  return NextResponse.json({ usuario, empresa });
}