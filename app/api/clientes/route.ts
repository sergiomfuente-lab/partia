import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { nombre, razonSocial, cif, email, telefono, tipo, direccionFacturacion, formaPago, observaciones, precioHoraEspecial } = await req.json();

    if (!nombre || !cif || !tipo) {
      return NextResponse.json({ error: "Nombre, CIF y tipo son obligatorios" }, { status: 400 });
    }

    const existe = await prisma.cliente.findUnique({ where: { cif } });
    if (existe) {
      return NextResponse.json({ error: "Ya existe un cliente con ese CIF" }, { status: 400 });
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombre,
        razonSocial: razonSocial || null,
        cif,
        email: email || null,
        telefono: telefono || null,
        tipo,
        direccionFacturacion: direccionFacturacion || null,
        formaPago: formaPago || "Transferencia bancaria",
        observaciones: observaciones || null,
        precioHoraEspecial: precioHoraEspecial ? parseFloat(precioHoraEspecial) : null,
        usuarioId: (session.user as any).id as string,
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const clientes = await prisma.cliente.findMany({
      where: { usuarioId: (session.user as any).id as string },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(clientes);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}