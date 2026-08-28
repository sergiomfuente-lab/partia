import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TecnicoTopBar from "@/components/TecnicoTopBar";
import TecnicoBottomNav from "@/components/TecnicoBottomNav";

export const metadata = { title: "Partia Técnico" };

export default async function TecnicoLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where:  { id: session.user.id },
    select: { debeCambiarPassword: true, nombre: true },
  });

  if (usuario?.debeCambiarPassword) redirect("/cambiar-password");

  return (
    <div className="min-h-screen bg-gray-50">
      <TecnicoTopBar userName={usuario?.nombre ?? session.user.name ?? ""} />
      <main className="max-w-lg mx-auto px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-4">{children}</main>
      <TecnicoBottomNav />
    </div>
  );
}
