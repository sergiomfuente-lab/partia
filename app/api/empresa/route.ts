import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const empresaId = (session.user as any).empresaId;

  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: {
      id: true, nombre: true, logoBase64: true, textoRgpd: true,
    },
  });

  return NextResponse.json(empresa ?? {});
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const empresaId = (session.user as any).empresaId;
  const body      = await req.json();
  const { textoRgpd, logoBase64 } = body;

  const empresa = await prisma.empresa.update({
    where: { id: empresaId },
    data: {
      ...(textoRgpd  !== undefined && { textoRgpd }),
      ...(logoBase64 !== undefined && { logoBase64 }),
    },
  });

  return NextResponse.json(empresa);
}