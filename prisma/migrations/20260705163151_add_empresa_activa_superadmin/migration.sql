-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "empresaActivaId" TEXT;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_empresaActivaId_fkey" FOREIGN KEY ("empresaActivaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
