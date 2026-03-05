import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Gestão de Projetos - Plataforma de Gestão",
  description: "Plataforma completa de gestão de Projetos. Gerencie planos de trabalho, prestação de contas, cursos e muito mais.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0B4F6C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <TranslationProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </TranslationProvider>
      </body>
    </html>
  );
}
