"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Esconder a barra lateral e espaçamento nas páginas de autenticação e root
  if (pathname === "/login" || pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 50 md:pl-64 pb-16 md:pb-0 transition-all">
      <Sidebar />
      <main className="flex-1 w-full max-w-[100vw] md:max-w-none overflow-x-hidden min-h-screen">
        {children}
      </main>
    </div>
  );
}
