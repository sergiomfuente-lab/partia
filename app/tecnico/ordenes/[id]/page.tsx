import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TecnicoOrdenDetalle from "./TecnicoOrdenDetalle";

export const metadata = { title: "Orden — Partia Técnico" };

export default async function TecnicoOrdenPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id }    = await params;
  const empresaId = (session.user as any).empresaId;

  const [orden, tiposServicio, empresa] = await Promise.all([
    prisma.orden.findFirst({
      where: { id, empresaId },
      include: {
        cliente:         true,
        maquina:         true,
        tecnico:         { select: { id: true, nombre: true } },
        servicios:       { include: { tipoServicio: true }, orderBy: { fecha: "asc" } },
        serviciosLibres: true,
        repuestos:       true,
      },
    }),
    prisma.tipoServicio.findMany({
      where:   { activo: true },
      orderBy: { orden:  "asc" },
    }),
    prisma.empresa.findUnique({
      where:  { id: empresaId },
      select: { precioHora: true, precioPorKm: true },
    }),
  ]);

  if (!orden) redirect("/tecnico");

  return (
    <TecnicoOrdenDetalle
      orden={JSON.parse(JSON.stringify(orden))}
      tiposServicio={JSON.parse(JSON.stringify(tiposServicio))}
      precioHoraDefault={empresa?.precioHora   ?? 55}
      precioPorKmDefault={empresa?.precioPorKm ?? 0.35}
    />
  );
}
