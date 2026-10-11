import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditarMaquinaForm from "./EditarMaquinaForm";

export default async function EditarMaquinaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const empresaId = (session.user as any).empresaId as string | undefined;
  if (!empresaId) redirect("/dashboard");

  const maquina = await prisma.maquina.findFirst({
    where: { id, cliente: { empresaId } },
    include: {
      cliente: { select: { id: true, nombre: true } },
    },
  });

  if (!maquina) redirect("/maquinas");

  return <EditarMaquinaForm maquina={JSON.parse(JSON.stringify(maquina))} />;
}