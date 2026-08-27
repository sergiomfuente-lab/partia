import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TecnicoDashboard from "./TecnicoDashboard";

export const metadata = { title: "Mis órdenes — Partia Técnico" };

export default async function TecnicoHomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return <TecnicoDashboard tecnicoId={session.user.id} />;
}
