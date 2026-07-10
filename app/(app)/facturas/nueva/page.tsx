import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NuevaFacturaForm from "./NuevaFacturaForm";

export const metadata = { title: "Nueva factura — Partia" };

export default async function NuevaFacturaPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; serieId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) redirect("/dashboard");

  const { tipo, serieId } = await searchParams;

  const [clientes, tiposServicio, series, empresa] = await Promise.all([
    prisma.cliente.findMany({
      where:   { empresaId, activo: true },
      select:  {
        id: true, nombre: true,
        precioHoraEspecial:  true,
        precioPorKmEspecial: true,
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.tipoServicio.findMany({
      where:   { activo: true },
      orderBy: { orden: "asc" },
    }),
    prisma.serieFacturacion.findMany({
      where:   { empresaId, activa: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.empresa.findUnique({
      where:  { id: empresaId },
      select: { precioHora: true, precioPorKm: true },
    }),
  ]);

  // Si es factura desde orden, cargar órdenes sin factura
  const ordenesSinFactura = tipo !== "directa"
    ? await prisma.orden.findMany({
        where: {
          cliente:   { empresaId },
          facturaId: null,
          estado:    "completado",
        },
        include: {
          cliente:         { select: { id: true, nombre: true } },
          maquina:         { select: { id: true, marca: true, modelo: true } },
          servicios:       { include: { tipoServicio: true } },
          serviciosLibres: true,
          repuestos:       true,
        },
        orderBy: { fecha: "desc" },
      })
    : [];

  const seriePredeterminada = series.find((s) => s.predeterminada) ?? series[0];
  const serieSeleccionada   = series.find((s) => s.id === serieId) ?? seriePredeterminada;

  return (
    <NuevaFacturaForm
      clientes={clientes}
      tiposServicio={tiposServicio}
      series={series}
      serieInicial={serieSeleccionada ? JSON.parse(JSON.stringify(serieSeleccionada)) : null}
      ordenesSinFactura={JSON.parse(JSON.stringify(ordenesSinFactura))}
      esDirecta={tipo === "directa"}
      precioHoraDefault={empresa?.precioHora   ?? 55}
      precioPorKmDefault={empresa?.precioPorKm ?? 0.35}
    />
  );
}