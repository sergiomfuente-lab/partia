import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SuperadminPanel from "./SuperadminPanel";

export const metadata = { title: "Superadmin — Partia" };

export default async function SuperadminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if ((session.user as any).rol !== "superadmin") redirect("/dashboard");

  const empresas = await prisma.empresa.findMany({
    include: {
      _count: { select: { usuarios: true, clientes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const usuarioActual = await prisma.usuario.findUnique({
    where:  { id: session.user.id },
    select: { empresaActivaId: true },
  });

  return (
    <SuperadminPanel
      empresas={JSON.parse(JSON.stringify(empresas))}
      empresaActivaId={usuarioActual?.empresaActivaId ?? null}
    />
  );
}