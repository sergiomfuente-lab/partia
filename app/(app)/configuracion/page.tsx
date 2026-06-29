import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ConfiguracionPanel from "./ConfiguracionPanel";

export const metadata = { title: "Configuración — Partia" };

export default async function ConfiguracionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [usuario, tiposServicio] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: session.user!.id },
      select: {
        id:               true,
        nombre:           true,
        email:            true,
        precioHora:       true,
        precioPorKm:      true,
        nombreFiscal:     true,
        cifNif:           true,
        direccionFiscal:  true,
        codigoPostal:     true,
        ciudad:           true,
        provincia:        true,
        telefono:         true,
        emailFacturacion: true,
        iban:             true,
      },
    }),
    prisma.tipoServicio.findMany({
      orderBy: { orden: "asc" },
    }),
  ]);

  if (!usuario) redirect("/login");

  return (
    <ConfiguracionPanel
      usuario={JSON.parse(JSON.stringify(usuario))}
      tiposServicio={JSON.parse(JSON.stringify(tiposServicio))}
    />
  );
}