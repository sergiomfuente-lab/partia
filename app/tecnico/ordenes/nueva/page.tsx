import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TecnicoNuevaOrdenForm from "./TecnicoNuevaOrdenForm";

export const metadata = { title: "Nueva orden — Partia" };

export default async function TecnicoNuevaOrdenPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) redirect("/tecnico");

  const clientes = await prisma.cliente.findMany({
    where:   { empresaId, activo: true },
    select:  { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <TecnicoNuevaOrdenForm
      clientes={clientes}
      tecnicoId={session.user.id}
    />
  );
}
