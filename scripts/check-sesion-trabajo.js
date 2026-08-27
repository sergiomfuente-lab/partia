// Script puntual: comprueba que la tabla SesionTrabajo existe y está
// operativa, y muestra cuántos tramos de trabajo se han registrado hasta
// ahora (y las últimas órdenes con horas acumuladas, si las hay).
//
// Uso: node scripts/check-sesion-trabajo.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const totalSesiones = await prisma.sesionTrabajo.count();
  console.log(`Tabla SesionTrabajo: OK (existe y responde).`);
  console.log(`Tramos de trabajo registrados hasta ahora: ${totalSesiones}`);

  if (totalSesiones > 0) {
    const ultimas = await prisma.sesionTrabajo.findMany({
      orderBy: { inicio: "desc" },
      take: 5,
      include: { orden: { select: { numero: true, estado: true, horasTrabajo: true } } },
    });
    console.log("\nÚltimos tramos registrados:");
    for (const s of ultimas) {
      const duracion = s.fin
        ? `${(((s.fin - s.inicio) / 3600000)).toFixed(2)}h (cerrado)`
        : "en curso (sin cerrar todavía)";
      console.log(
        `- Orden ${s.orden.numero} [${s.orden.estado}]: inicio ${s.inicio.toISOString()}, ` +
        `${duracion}, horasTrabajo acumuladas en la orden: ${s.orden.horasTrabajo}`
      );
    }
  } else {
    console.log(
      "\nNo hay ningún tramo todavía: la tabla está creada y lista, pero " +
      "nadie ha pulsado 'Empezar a trabajar' / 'Pausar' en una orden desde " +
      "que se hizo el despliegue. En cuanto un técnico lo use aparecerán filas aquí."
    );
  }

  const ordenesConHoras = await prisma.orden.count({ where: { horasTrabajo: { gt: 0 } } });
  console.log(`\nÓrdenes con horasTrabajo > 0: ${ordenesConHoras}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("ERROR al consultar la tabla:", e);
  process.exit(1);
});
