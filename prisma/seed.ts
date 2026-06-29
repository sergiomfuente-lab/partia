import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.tipoServicio.createMany({
    skipDuplicates: true,
    data: [
      { nombre: "Mano de obra",    unidad: "h",  orden: 1 },
      { nombre: "Desplazamiento",  unidad: "km", orden: 2 },
    ],
  });
  console.log("✅ Tipos de servicio creados");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());