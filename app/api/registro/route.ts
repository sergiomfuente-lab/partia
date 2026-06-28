import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { nombre, email, password } = await req.json();

    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    const usuarioExiste = await prisma.usuario.findUnique({
      where: { email },
    });

    if (usuarioExiste) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: passwordHash,
      },
    });

    return NextResponse.json(
      { message: "Usuario creado correctamente", id: usuario.id },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}