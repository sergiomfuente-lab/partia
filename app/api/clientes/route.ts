import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { nombre, nif, email, telefono, tipo, direccion } = await req.json();

    if (!nombre || !nif || !tipo) {
      return NextResponse.json({ error: "Nombre, NIF y tipo son obligatorios" }, { status: 400 });
    }

    const existe = await prisma.cliente.findUnique({ where: { nif } });
    if (existe) {
      return NextResponse.json({ error: "Ya existe un cliente con ese NIF" }, { status: 400 });
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombre,
        nif,
        email: email || null,
        telefono: telefono || null,
        tipo,
        usuarioId: session.user?.id as string,
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
      where: { usuarioId: session.user?.id as string },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(clientes);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}