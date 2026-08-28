import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ConfiguracionPanel from "./ConfiguracionPanel";

export const metadata = { title: "Configuración — Partia" };

export default async function ConfiguracionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const empresaId = (session.user as any).empresaId;

  const [usuario, tiposServicio, empresa, contador, series, plazosPago] = await Promise.all([
    prisma.usuario.findUnique({
      where:  { id: session.user.id },
      select: { id: true, nombre: true, email: true },
    }),
    prisma.tipoServicio.findMany({ orderBy: { orden: "asc" } }),
    prisma.empresa.findUnique({
      where:  { id: empresaId },
      select: {
        id: true, nombre: true, nombreFiscal: true, cifNif: true,
        direccionFiscal: true, codigoPostal: true, ciudad: true,
        provincia: true, telefono: true, emailFacturacion: true,
        iban: true, precioHora: true, precioPorKm: true,
        logoBase64: true, textoRgpd: true,
        facturacionInmutableActiva: true, regimenFiscalVerifactu: true,
        verifactuModalidad: true, verifactuFechaLimite: true,
        verifactuNotasGestoria: true,
      },
    }),
    prisma.contadorFactura.findUnique({
      where: {
        empresaId_anio: {
          empresaId,
          anio: new Date().getFullYear(),
        },
      },
    }),
    prisma.serieFacturacion.findMany({
      where:   { empresaId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.plazoPago.findMany({
      where:   { empresaId },
      orderBy: { dias: "asc" },
    }),
  ]);

  if (!usuario) redirect("/login");

  return (
    <ConfiguracionPanel
      usuario={JSON.parse(JSON.stringify(usuario))}
      tiposServicio={JSON.parse(JSON.stringify(tiposServicio))}
      empresa={JSON.parse(JSON.stringify(empresa ?? {}))}
      contadorActual={contador?.contador ?? 0}
      anioActual={new Date().getFullYear()}
      series={JSON.parse(JSON.stringify(series))}
      plazosPago={JSON.parse(JSON.stringify(plazosPago))}
    />
  );
}