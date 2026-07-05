import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Partia",
  description: "Gestión de maquinaria",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}