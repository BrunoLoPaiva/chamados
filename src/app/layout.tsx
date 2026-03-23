import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Viarondon | Chamados",
  description: "Gerencie seus chamados",
};

import Providers from "./Providers";
import LayoutWrapper from "@/components/LayoutWrapper";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans`}
      >
        <Providers>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
