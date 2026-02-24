"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, Users, Receipt, Calendar, Scale, FileSignature, BookOpen, Users2, Settings, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const navItems = [
    { label: "Agenda y Plazos", href: "/agenda", icon: Calendar, accent: "emerald" },
    { label: "Expedientes", href: "/expedientes", icon: FolderOpen, accent: "emerald" },
    { label: "Clientes", href: "/clientes", icon: Users, accent: "emerald" },
    { label: "Mensajería WhatsApp", href: "/whatsapp", icon: MessageSquare, accent: "emerald" },
    { label: "Plantillas Documentales", href: "/plantillas", icon: BookOpen, accent: "teal" },
    { label: "Contrarios y Juzgados", href: "/contrarios", icon: Users2, accent: "orange" },
    { label: "Firma Digital", href: "/firmas", icon: FileSignature, accent: "violet" },
    { label: "Honorarios ICALI", href: "/honorarios", icon: Scale, accent: "emerald" },
    { label: "Facturación", href: "/facturacion", icon: Receipt, accent: "emerald" },
  ];

  // Admin only items
  if (isAdmin) {
    navItems.push({ label: "Gestión Usuarios", href: "/ajustes/usuarios", icon: Settings, accent: "slate" });
  }

  const accentClasses: Record<string, string> = {
    emerald: "bg-emerald-800/20 text-emerald-400 border-emerald-800/50",
    violet: "bg-violet-800/20 text-violet-400 border-violet-800/50",
    teal: "bg-teal-800/20 text-teal-400 border-teal-800/50",
    orange: "bg-orange-800/20 text-orange-400 border-orange-800/50",
    slate: "bg-slate-800/20 text-slate-400 border-slate-700/50",
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full py-6 shrink-0 z-20 overflow-y-auto">
      <nav className="flex-1 w-full px-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 border ${isActive
                ? `font-medium border ${accentClasses[item.accent]}`
                : "text-slate-400 hover:bg-slate-800 hover:text-white border-transparent"
                }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
