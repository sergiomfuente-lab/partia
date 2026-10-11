import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MaquinaDetalle from "./MaquinaDetalle";

export default async function MaquinaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const empresaId = (session.user as any).empresaId as string | undefined;
  if (!empresaId) redirect("/dashboard");

  const maquina = await prisma.maquina.findFirst({
    where: { id, cliente: { empresaId } },
    include: {
      cliente: true,
      ordenes: {
        orderBy: { fecha: "desc" },
        include: {
          repuestos: true,
          _count: { select: { repuestos: true } },
        },
      },
      historialHoras: {
        orderBy: { fecha: "desc" },
        include: {
          orden:   { select: { id: true, numero: true } },
          usuario: { select: { nombre: true } },
        },
      },
    },
  });

  if (!maquina) redirect("/maquinas");

  return <MaquinaDetalle maquina={JSON.parse(JSON.stringify(maquina))} />;
}