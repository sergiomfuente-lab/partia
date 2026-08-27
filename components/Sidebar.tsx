"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Users, Wrench,
  ClipboardList, FileText, ShoppingCart,
  Settings, UserCog, ShieldCheck, FileCheck,
} from "lucide-react";

interface Props {
  userName?:        string | null;
  rol?:             string | null;
  empresaActivaId?: string | null;
}

const ROL_LABELS: Record<string, string> = {
  superadmin:     "Superadministrador",
  administrador:  "Administrador",
  tecnico:        "Técnico",
  administrativo: "Administrativo",
};

export default function Sidebar({ userName, rol, empresaActivaId }: Props) {
  const pathname = usePathname();
  const router   = useRouter();

  // Si un tecnico esta viendo el panel de oficina en una pantalla estrecha
  // (movil real cuyo user-agent no matcheo la deteccion del servidor, o
  // ventana del navegador estrechada durante pruebas en desarrollo), lo
  // mandamos a la seccion movil de todas formas.
  useEffect(() => {
    if (rol !== "tecnico") return;
    const comprobarAncho = () => {
      if (window.innerWidth < 768) router.replace("/tecnico");
    };
    comprobarAncho();
    window.addEventListener("resize", comprobarAncho);
    return () => window.removeEventListener("resize", comprobarAncho);
  }, [rol, router]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const menu = [
    {
      href:  "/superadmin",
      label: "Superadmin",
      icon:  <ShieldCheck className="w-4 h-4" />,
      roles: ["superadmin"],
    },
    {
      href:  "/dashboard",
      label: "Dashboard",
      icon:  <LayoutDashboard className="w-4 h-4" />,
      roles: ["superadmin", "administrador", "tecnico", "administrativo"],
    },
    {
      href:  "/clientes",
      label: "Clientes",
      icon:  <Users className="w-4 h-4" />,
      roles: ["superadmin", "administrador", "tecnico", "administrativo"],
    },
    {
      href:  "/maquinas",
      label: "Máquinas",
      icon:  <Wrench className="w-4 h-4" />,
      roles: ["superadmin", "administrador", "tecnico", "administrativo"],
    },
    {
      href:  "/presupuestos",
      label: "Presupuestos",
      icon:  <FileCheck className="w-4 h-4" />,
      roles: ["superadmin", "administrador", "tecnico", "administrativo"],
    },
    {
      href:  "/ordenes",
      label: "Órdenes",
      icon:  <ClipboardList className="w-4 h-4" />,
      roles: ["superadmin", "administrador", "tecnico", "administrativo"],
    },
    {
      href:  "/facturas",
      label: "Facturas",
      icon:  <FileText className="w-4 h-4" />,
      roles: ["superadmin", "administrador", "administrativo"],
    },
    {
      href:  "/compras",
      label: "Compras",
      icon:  <ShoppingCart className="w-4 h-4" />,
      roles: ["superadmin", "administrador", "administrativo"],
    },
    {
      href:  "/usuarios",
      label: "Usuarios",
      icon:  <UserCog className="w-4 h-4" />,
      roles: ["superadmin", "administrador"],
    },
    {
      href:  "/configuracion",
      label: "Configuración",
      icon:  <Settings className="w-4 h-4" />,
      roles: ["superadmin", "administrador"],
    },
  ];

  const menuFiltrado = menu.filter((item) => {
    if (!rol) return false;
    if (!item.roles.includes(rol)) return false;
    if (rol === "superadmin" && !empresaActivaId && item.href !== "/superadmin") return false;
    return true;
  });

  return (
    <aside className="w-60 bg-[#0B1120] flex flex-col h-full fixed top-0 left-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-[#1e2d42]">
        <svg width="28" height="28" viewBox="0 0 56 56">
          <polygon points="28,4 50,16 50,40 28,52 6,40 6,16" fill="none" stroke="#00C2FF" strokeWidth="2.5"/>
          <polygon points="28,14 42,22 42,34 28,42 14,34 14,22" fill="#00C2FF" opacity="0.12"/>
          <circle cx="28" cy="28" r="7" fill="#00C2FF"/>
          <circle cx="28" cy="28" r="3.5" fill="#0B1120"/>
        </svg>
        <div>
          <div className="text-white font-bold text-base tracking-wide">Partia</div>
          <div className="text-[#00C2FF] text-[9px] tracking-[3px]">GESTIÓN · TECNOLOGÍA</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuFiltrado.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              isActive(item.href)
                ? "bg-[#162030] text-white font-medium border-l-2 border-[#00C2FF]"
                : "text-[#6a8aaa] hover:text-white hover:bg-[#111827]"
            }`}
          >
            <span className={isActive(item.href) ? "text-[#00C2FF]" : "text-[#6a8aaa]"}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Usuario */}
      <div className="px-4 py-4 border-t border-[#1e2d42]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#111827] cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[#00C2FF] flex items-center justify-center text-[#0B1120] text-sm font-bold flex-shrink-0">
            {userName?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">{userName}</div>
            <div className="text-[#6a8aaa] text-[10px]">
              {ROL_LABELS[rol ?? ""] ?? "Usuario"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}