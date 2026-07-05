import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import UsuariosPanel from "./UsuariosPanel";

export const metadata = { title: "Usuarios — Partia" };

export default async function UsuariosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const rol = (session.user as any).rol;
  if (!["superadmin", "administrador"].includes(rol)) redirect("/dashboard");

  const empresaId = (session.user as any).empresaId;

  const usuarios = await prisma.usuario.findMany({
    where:   { empresaId },
    select: {
      id: true, nombre: true, email: true,
      rol: true, activo: true, createdAt: true,
    },
    orderBy: { nombre: "asc" },
  });

  return (
    <UsuariosPanel
      usuarios={JSON.parse(JSON.stringify(usuarios))}
      rolActual={rol}
    />
  );
}