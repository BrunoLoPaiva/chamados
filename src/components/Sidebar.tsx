"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { 
  LucideIcon,
  LayoutDashboard, 
  PlusCircle, 
  BarChart3, 
  Tags, 
  Users, 
  Building2, 
  MapPin, 
  LogOut 
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const isGlobalAdmin = session?.user?.email === "ADMIN" || session?.user?.name?.toLowerCase().includes("admin");
  // @ts-expect-error next-auth session user does not have isDeptoAdmin by default
  const isDeptoAdmin = session?.user?.isDeptoAdmin === true; // 1. Gestão/Relatórios (Apenas ADMIN ou DEPTO_ADMIN)
  const showGestao = isGlobalAdmin || isDeptoAdmin;

  const workspaceLinks = [
    { name: "Painel Principal", href: "/dashboard", icon: LayoutDashboard },
    { name: "Novo Chamado", href: "/chamado/novo", icon: PlusCircle },
  ];

  // Gestão logic ( Admin or specific Depto roles)
  const gestaoLinks = showGestao ? [
    { name: "Relatórios", href: "/relatorios", icon: BarChart3 }
  ] : [];

  const adminLinks = isGlobalAdmin ? [
    { name: "Tipos e SLAs", href: "/admin/tipos", icon: Tags },
    { name: "Usuários", href: "/admin/usuarios", icon: Users },
    { name: "Departamentos", href: "/admin/departamentos", icon: Building2 },
    { name: "Locais", href: "/admin/locais", icon: MapPin },
  ] : isDeptoAdmin ? [
    { name: "Tipos e SLAs", href: "/admin/tipos", icon: Tags },
    { name: "Usuários", href: "/admin/usuarios", icon: Users },
    { name: "Locais", href: "/admin/locais", icon: MapPin },
  ] : [];

  const renderLinks = (links: { name: string, href: string, icon: LucideIcon }[]) => {
    return links.map((link) => {
      const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
      const Icon = link.icon;
      return (
        <Link
          key={link.href}
          href={link.href}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
            isActive
              ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-100"
          }`}
        >
          <Icon className={`w-5 h-5 ${isActive ? "opacity-100" : "opacity-75"}`} />
          {link.name}
        </Link>
      );
    });
  };

  return (
    <>
      <nav className="hidden md:flex flex-col w-64 h-screen border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 fixed left-0 top-0 z-40 shadow-sm transition-colors">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <span className="font-bold text-xl text-neutral-900 dark:text-neutral-50 tracking-tight transition-colors">
              <Image src="/logo.png" width={200} height={40} alt={"logo"} className="h-auto w-auto max-w-full" priority />
            </span>
          </div>
        </div>

        <div className="px-4 flex-1 mt-2 space-y-6 overflow-y-auto custom-scrollbar pb-6">
          <div>
            <p className="px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 transition-colors">Workspace</p>
            <div className="space-y-1">{renderLinks(workspaceLinks)}</div>
          </div>
          
          {gestaoLinks.length > 0 && (
            <div>
              <p className="px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 transition-colors">Gestão</p>
              <div className="space-y-1">{renderLinks(gestaoLinks)}</div>
            </div>
          )}

          {adminLinks.length > 0 && (
            <div>
              <p className="px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 transition-colors">Administração</p>
              <div className="space-y-1">{renderLinks(adminLinks)}</div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 transition-colors">
          <div className="flex items-center justify-between px-3 py-3 bg-white dark:bg-neutral-800/80 shadow-sm rounded-md border border-neutral-200/60 dark:border-neutral-700/60 transition-colors">
            <div className="flex items-center gap-3 truncate">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-xs ring-2 ring-white dark:ring-neutral-900 shrink-0 uppercase transition-colors">
                {session?.user?.name?.charAt(0) || "U"}
              </div>
              <div className="truncate">
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate transition-colors">
                  {session?.user?.name || "Usuário"}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate transition-colors">
                  {session?.user?.email || "Colaborador"}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors ml-2 shrink-0"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile nav header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20 transition-colors">
             <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-neutral-900 dark:text-neutral-50 tracking-tight transition-colors">
            Help Desk
          </span>
        </div>
        <button
          onClick={() => signOut()}
          className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1 hover:text-red-600 transition-colors"
        >
          Sair
        </button>
      </div>

      {/* Mobile nav bottom strip */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex justify-around p-2 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors">
        {[...workspaceLinks, ...(showGestao ? [{ name: "Admin", href: "/admin", icon: Users }] : [])].map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-md text-[10px] font-medium transition-colors ${
                isActive ? "text-blue-600 dark:text-blue-400" : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              <Icon className="w-6 h-6 mb-0.5" />
              <span className="truncate max-w-[64px] text-center">{link.name}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
