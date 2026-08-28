import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TecnicoComprasLista from "./TecnicoComprasLista";

export const metadata = { title: "Compras — Partia Técnico" };

export default async function TecnicoComprasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return <TecnicoComprasLista tecnicoId={session.user.id} />;
}
