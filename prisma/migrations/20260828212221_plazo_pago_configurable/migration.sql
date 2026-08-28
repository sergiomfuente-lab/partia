-- CreateTable
CREATE TABLE "PlazoPago" (
    "id" TEXT NOT NULL,
    "dias" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlazoPago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlazoPago_empresaId_dias_key" ON "PlazoPago"("empresaId", "dias");

-- AddForeignKey
ALTER TABLE "PlazoPago" ADD CONSTRAINT "PlazoPago_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
