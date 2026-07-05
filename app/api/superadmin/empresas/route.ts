import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if ((session.user as any).rol !== "superadmin") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const empresas = await prisma.empresa.findMany({
    include: {
      _count: {
        select: { usuarios: true, clientes: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(empresas);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if ((session.user as any).rol !== "superadmin") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const body = await req.json();
  const {
    nombre, nombreFiscal, cifNif, direccionFiscal,
    codigoPostal, ciudad, provincia, telefono,
    emailFacturacion, iban, precioHora, precioPorKm,
    // Admin inicial
    adminNombre, adminEmail, adminPassword,
  } = body;

  if (!nombre) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  if (!adminNombre || !adminEmail || !adminPassword) {
    return NextResponse.json({ error: "Los datos del administrador son obligatorios" }, { status: 400 });
  }

  // Verificar que el email no existe
  const existe = await prisma.usuario.findUnique({ where: { email: adminEmail } });
  if (existe) return NextResponse.json({ error: "El email del administrador ya está en uso" }, { status: 400 });

  // Crear empresa y admin en una transacción
  const empresa = await prisma.$transaction(async (tx) => {
    const empresa = await tx.empresa.create({
      data: {
        nombre, nombreFiscal, cifNif, direccionFiscal,
        codigoPostal, ciudad, provincia, telefono,
        emailFacturacion, iban,
        precioHora:  precioHora  ? parseFloat(precioHora)  : 55,
        precioPorKm: precioPorKm ? parseFloat(precioPorKm) : 0.35,
      },
    });

    const hash = await bcrypt.hash(adminPassword, 10);
    await tx.usuario.create({
      data: {
        nombre:              adminNombre,
        email:               adminEmail,
        password:            hash,
        rol:                 "administrador",
        activo:              true,
        debeCambiarPassword: true,
        empresaId:           empresa.id,
      },
    });

    // Tipos de servicio por defecto
    await tx.tipoServicio.createMany({
      data: [
        { nombre: "Mano de obra",   unidad: "h",  orden: 1 },
        { nombre: "Desplazamiento", unidad: "km", orden: 2 },
      ],
    });

    return empresa;
  });

  return NextResponse.json(empresa, { status: 201 });
}