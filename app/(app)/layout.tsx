import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where:  { id: session.user!.id },
    select: {
      debeCambiarPassword: true,
      rol:                 true,
      empresaId:           true,
      empresaActivaId:     true,
    },
  });

  if (usuario?.debeCambiarPassword) redirect("/cambiar-password");

  // Tecnicos entrando desde el movil van a la seccion movil de tecnico,
  // no al panel de oficina (que no esta pensado para pantallas pequenas).
  const hdrs     = await headers();
  const esMovil  = hdrs.get("x-is-mobile") === "1";
  if (esMovil && usuario?.rol === "tecnico") redirect("/tecnico");

  // Para superadmin usar empresaActivaId
  const empresaId = usuario?.rol === "superadmin"
    ? usuario.empresaActivaId
    : usuario?.empresaId;

  // Inyectar empresaId actualizado en la sesión del servidor
  ;(session.user as any).empresaId = empresaId;
  ;(session.user as any).rol       = usuario?.rol;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        userName={session.user?.name}
        rol={usuario?.rol}
        empresaActivaId={empresaId}
      />
      <main className="ml-60 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}