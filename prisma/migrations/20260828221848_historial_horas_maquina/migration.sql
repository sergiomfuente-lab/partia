-- AlterTable
ALTER TABLE "Orden" ADD COLUMN     "horasMaquinaRegistradas" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "HistorialHorasMaquina" (
    "id" TEXT NOT NULL,
    "maquinaId" TEXT NOT NULL,
    "horas" DOUBLE PRECISION NOT NULL,
    "horasAnteriores" DOUBLE PRECISION,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordenId" TEXT,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialHorasMaquina_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HistorialHorasMaquina" ADD CONSTRAINT "HistorialHorasMaquina_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "Maquina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialHorasMaquina" ADD CONSTRAINT "HistorialHorasMaquina_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "Orden"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialHorasMaquina" ADD CONSTRAINT "HistorialHorasMaquina_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
