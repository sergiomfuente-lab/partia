import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TecnicoNuevaCompra from "./TecnicoNuevaCompra";

export const metadata = { title: "Nueva compra — Partia Técnico" };

export default async function TecnicoNuevaCompraPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) redirect("/tecnico");

  const [ordenes, proveedores, productos] = await Promise.all([
    prisma.orden.findMany({
      where:   { empresaId, tecnicoId: session.user.id, estado: { notIn: ["completado", "cancelado"] } },
      select:  { id: true, numero: true, cliente: { select: { nombre: true } } },
      orderBy: { fecha: "desc" },
    }),
    prisma.proveedor.findMany({
      where:   { empresaId, activo: true },
      select:  { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.producto.findMany({
      where:   { empresaId, activo: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <TecnicoNuevaCompra
      tecnicoId={session.user.id}
      ordenes={JSON.parse(JSON.stringify(ordenes))}
      proveedores={JSON.parse(JSON.stringify(proveedores))}
      productos={JSON.parse(JSON.stringify(productos))}
    />
  );
}
