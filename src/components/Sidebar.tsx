"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import {
  LucideIcon,
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  Tags,
  Users,
  Building2,
  MapPin,
  LogOut,
  X,
  CalendarClock,
} from "lucide-react";

export default function Sidebar({
  isOpen = false,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isGlobalAdmin =
    session?.user?.email === "ADMIN" ||
    session?.user?.name?.toLowerCase().includes("admin");
  // @ts-expect-error next-auth session user does not have isDeptoAdmin by default
  const isDeptoAdmin = session?.user?.isDeptoAdmin === true;
  const showGestao = isGlobalAdmin || isDeptoAdmin;

  const workspaceLinks = [
    { name: "Painel Principal", href: "/dashboard", icon: LayoutDashboard },
    { name: "Novo Chamado", href: "/chamado/novo", icon: PlusCircle },
  ];

  const gestaoLinks = showGestao
    ? [{ name: "Relatórios", href: "/relatorios", icon: BarChart3 }]
    : [];

  const adminLinks = isGlobalAdmin
    ? [
        { name: "Tipos e SLAs", href: "/admin/tipos", icon: Tags },
        {
          name: "Preventivas",
          href: "/admin/preventivas",
          icon: CalendarClock,
        },
        { name: "Usuários", href: "/admin/usuarios", icon: Users },
        {
          name: "Departamentos",
          href: "/admin/departamentos",
          icon: Building2,
        },
        { name: "Locais", href: "/admin/locais", icon: MapPin },
      ]
    : isDeptoAdmin
      ? [
          { name: "Tipos e SLAs", href: "/admin/tipos", icon: Tags },
          {
            name: "Preventivas",
            href: "/admin/preventivas",
            icon: CalendarClock,
          },
          { name: "Usuários", href: "/admin/usuarios", icon: Users },
          { name: "Locais", href: "/admin/locais", icon: MapPin },
        ]
      : [];

  const renderLinks = (
    links: { name: string; href: string; icon: LucideIcon }[],
  ) => {
    return links.map((link) => {
      const isActive =
        pathname === link.href || pathname.startsWith(link.href + "/");
      const Icon = link.icon;
      return (
        <Link
          key={link.href}
          href={link.href}
          onClick={onClose} // <-- CORREÇÃO: Isso garante que o menu feche ao clicar no mobile
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
            isActive
              ? "bg-white/10 text-brand-yellow font-bold border-l-4 border-brand-yellow pl-2"
              : "text-brand-light/70 font-medium hover:bg-white/5 hover:text-white"
          }`}
        >
          <Icon
            className={`w-5 h-5 ${isActive ? "opacity-100" : "opacity-75"}`}
          />
          {link.name}
        </Link>
      );
    });
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}
      <nav
        className={`flex flex-col w-64 h-[100dvh] border-r border-brand-navy/20 bg-brand-navy fixed left-0 top-0 z-50 shadow-xl transition-transform duration-300 md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white md:hidden bg-white/5 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-center">
            <div className="bg-white/95 rounded-xl shadow-lg w-full flex items-center justify-center shadow-brand-yellow/20 transition-transform hover:scale-105">
              <Image
                src="/logo.png"
                width={180}
                height={80}
                sizes="100vw"
                className="w-full h-auto max-w-[210x]"
                alt="Logo HelpMe"
                priority
              />
            </div>
          </div>
        </div>

        <div className="px-4 flex-1 mt-2 space-y-6 overflow-y-auto custom-scrollbar pb-6">
          <div>
            <p className="px-3 text-[10px] font-bold text-brand-light/50 uppercase tracking-widest mb-2 transition-colors">
              Workspace
            </p>
            <div className="space-y-1">{renderLinks(workspaceLinks)}</div>
          </div>

          {gestaoLinks.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-bold text-brand-light/50 uppercase tracking-widest mb-2 transition-colors">
                Gestão
              </p>
              <div className="space-y-1">{renderLinks(gestaoLinks)}</div>
            </div>
          )}

          {adminLinks.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-bold text-brand-light/50 uppercase tracking-widest mb-2 transition-colors">
                Administração
              </p>
              <div className="space-y-1">{renderLinks(adminLinks)}</div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 bg-black/10 transition-colors">
          <div className="flex items-center justify-between px-3 py-3 bg-white/5 shadow-sm rounded-md border border-white/10 transition-colors hover:bg-white/10">
            <div className="flex items-center gap-3 truncate">
              <div className="w-8 h-8 rounded-full bg-brand-yellow flex items-center justify-center text-brand-navy font-black text-xs shrink-0 uppercase transition-colors">
                {session?.user?.name?.charAt(0) || "U"}
              </div>
              <div className="truncate">
                <p className="text-sm font-bold text-white truncate transition-colors">
                  {session?.user?.name || "Usuário"}
                </p>
                <p className="text-xs text-brand-light/60 truncate transition-colors">
                  {session?.user?.email || "Colaborador"}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="p-1.5 text-brand-light/50 hover:text-brand-yellow hover:bg-white/10 rounded-lg transition-colors ml-2 shrink-0"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
