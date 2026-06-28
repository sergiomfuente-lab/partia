import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;
    const { nombre, razonSocial, cif, email, telefono, tipo, direccionFacturacion, formaPago, observaciones, precioHoraEspecial } = await req.json();

    const cliente = await prisma.cliente.update({
      where: { id },
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
      },
    });

    return NextResponse.json(cliente);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;

    await prisma.cliente.delete({ where: { id } });

    return NextResponse.json({ message: "Cliente eliminado" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}