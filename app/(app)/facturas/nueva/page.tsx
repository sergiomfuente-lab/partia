import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NuevaFacturaForm from "./NuevaFacturaForm";

export const metadata = { title: "Nueva factura — Partia" };

export default async function NuevaFacturaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const clientes = await prisma.cliente.findMany({
    where: { usuarioId: session.user!.id, activo: true },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });

  return <NuevaFacturaForm clientes={clientes} />;
}