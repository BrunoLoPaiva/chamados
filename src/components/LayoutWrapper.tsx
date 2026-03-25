"use client";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";
import Image from "next/image";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Esconder a barra lateral e espaçamento nas páginas de autenticação e root
  if (pathname === "/login" || pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 md:pl-64 pb-16 md:pb-0 transition-all flex-col md:flex-row">
      <div className="md:hidden flex items-center justify-between bg-brand-navy p-4 text-white sticky top-0 z-30 shadow-md">
        <span className="font-bold text-lg tracking-tight"><div className="bg-white/95 rounded-xl shadow-lg w-full flex items-center justify-center shadow-brand-yellow/20 transition-transform hover:scale-105">
                      <Image
                        src="/logo.png"
                        width={90}
                        height={40}
                        sizes="35vw"
                        className="w-full h-auto max-w-[210x]"
                        alt="Logo HelpMe"
                        priority
                      />
                    </div></span>
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="p-1 hover:bg-white/10 rounded-md transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 w-full max-w-[100vw] md:max-w-none overflow-x-hidden min-h-screen">
        {children}
      </main>
    </div>
  );
}
