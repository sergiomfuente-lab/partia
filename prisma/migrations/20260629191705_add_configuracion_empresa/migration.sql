-- CreateTable
CREATE TABLE "ConfiguracionEmpresa" (
    "id" TEXT NOT NULL,
    "textoRgpd" TEXT,
    "logoBase64" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionEmpresa_pkey" PRIMARY KEY ("id")
);
