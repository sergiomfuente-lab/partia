import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol       = (session.user as any).rol;
  const empresaId = (session.user as any).empresaId;

  if (!["superadmin", "administrador"].includes(rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const usuarios = await prisma.usuario.findMany({
    where:   { empresaId },
    select: {
      id: true, nombre: true, email: true,
      rol: true, activo: true, createdAt: true,
    },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol       = (session.user as any).rol;
  const empresaId = (session.user as any).empresaId;

  if (!["superadmin", "administrador"].includes(rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await req.json();
  const { nombre, email, password, rolNuevo } = body;

  if (!nombre || !email || !password) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  // El administrador no puede crear superadmins
  if (rol === "administrador" && rolNuevo === "superadmin") {
    return NextResponse.json({ error: "Sin permisos para crear superadmin" }, { status: 403 });
  }

  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) {
    return NextResponse.json({ error: "El email ya está en uso" }, { status: 400 });
  }

  const hash    = await bcrypt.hash(password, 10);
  const usuario = await prisma.usuario.create({
    data: {
      nombre, email,
      password:  hash,
      rol:       rolNuevo ?? "tecnico",
      activo:    true,
      empresaId,
    },
    select: {
      id: true, nombre: true, email: true,
      rol: true, activo: true, createdAt: true,
    },
  });

  return NextResponse.json(usuario, { status: 201 });
}