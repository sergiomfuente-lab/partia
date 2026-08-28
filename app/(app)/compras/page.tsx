import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ComprasPanel from "./ComprasPanel";

export const metadata = { title: "Compras — Partia" };

export default async function ComprasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) redirect("/dashboard");

  const [compras, proveedores, productos] = await Promise.all([
    prisma.compra.findMany({
      where:   { empresaId },
      include: {
        proveedor: { select: { id: true, nombre: true } },
        tecnico:   { select: { id: true, nombre: true } },
        lineas:    { include: { orden: { select: { id: true, numero: true } } } },
        _count:    { select: { lineas: true } },
      },
      orderBy: { fecha: "desc" },
      take:    50,
    }),
    prisma.proveedor.findMany({
      where:   { empresaId, activo: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.producto.findMany({
      where:   { empresaId, activo: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <ComprasPanel
      compras={JSON.parse(JSON.stringify(compras))}
      proveedores={JSON.parse(JSON.stringify(proveedores))}
      productos={JSON.parse(JSON.stringify(productos))}
    />
  );
}