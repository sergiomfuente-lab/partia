import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let empresa = await prisma.configuracionEmpresa.findFirst();
  if (!empresa) {
    empresa = await prisma.configuracionEmpresa.create({
      data: {
        textoRgpd: "De conformidad con lo dispuesto en el RGPD y LOPDGDD, le informamos que los datos personales serán tratados para cumplir con la obligación tributaria de emitir facturas. Podrá solicitar más información y ejercer sus derechos escribiendo a la dirección indicada.",
      },
    });
  }

  return NextResponse.json(empresa);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { textoRgpd, logoBase64 } = body;

  let empresa = await prisma.configuracionEmpresa.findFirst();

  if (!empresa) {
    empresa = await prisma.configuracionEmpresa.create({
      data: {
        ...(textoRgpd  !== undefined && { textoRgpd }),
        ...(logoBase64 !== undefined && { logoBase64 }),
      },
    });
  } else {
    empresa = await prisma.configuracionEmpresa.update({
      where: { id: empresa.id },
      data: {
        ...(textoRgpd  !== undefined && { textoRgpd }),
        ...(logoBase64 !== undefined && { logoBase64 }),
      },
    });
  }

  return NextResponse.json(empresa);
}