import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InformesPanel from "./InformesPanel";

export const metadata = { title: "Informes — Partia" };

export default async function InformesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const rol = (session.user as any).rol;
  // Igual que el Dashboard: es una herramienta de gestión, los técnicos no
  // la necesitan y ya tienen su propia sección en /tecnico.
  if (rol === "tecnico") redirect("/ordenes");

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) redirect("/superadmin");

  const [clientes, tecnicos] = await Promise.all([
    prisma.cliente.findMany({
      where:   { empresaId },
      select:  { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.usuario.findMany({
      where:   { empresaId, rol: "tecnico" },
      select:  { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <InformesPanel
      clientes={JSON.parse(JSON.stringify(clientes))}
      tecnicos={JSON.parse(JSON.stringify(tecnicos))}
    />
  );
}
