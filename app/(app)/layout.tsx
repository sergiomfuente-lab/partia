import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  // Verificar si debe cambiar la contraseña
  const usuario = await prisma.usuario.findUnique({
    where:  { id: session.user!.id },
    select: { debeCambiarPassword: true },
  });

  if (usuario?.debeCambiarPassword) {
    redirect("/cambiar-password");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        userName={session.user?.name}
        rol={(session.user as any)?.rol}
      />
      <main className="ml-60 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}