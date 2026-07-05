import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Crear empresa Reparaciones Correal
  const empresa = await prisma.empresa.create({
    data: {
      nombre:          "Reparaciones Correal",
      nombreFiscal:    "Repycormu S.L.",
      cifNif:          "B75857474",
      precioHora:      55,
      precioPorKm:     0.35,
      textoRgpd:       "De conformidad con lo dispuesto en el RGPD y LOPDGDD, le informamos que los datos personales serán tratados para cumplir con la obligación tributaria de emitir facturas.",
    },
  });

  // Crear superadmin
  const hash = await bcrypt.hash("Murci@1991", 10);
  await prisma.usuario.create({
    data: {
      nombre:    "Sergio Muñoz de la Fuente",
      email:     "sergiomfuente@gmail.com",
      password:  hash,
      rol:       "superadmin",
      activo:    true,
      empresaId: empresa.id,
    },
  });

  // Tipos de servicio
  await prisma.tipoServicio.createMany({
    data: [
      { nombre: "Mano de obra",   unidad: "h",  orden: 1 },
      { nombre: "Desplazamiento", unidad: "km", orden: 2 },
    ],
  });

  console.log("✅ Seed completado");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());