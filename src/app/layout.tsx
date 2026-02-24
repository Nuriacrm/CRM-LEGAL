import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AuthWrapper } from "@/components/auth/AuthWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LexCRM - Gestión Jurídica",
  description: "CRM Avanzado para Despachos de Abogados",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LexCRM",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark bg-slate-950" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className={`${inter.className} text-slate-200 flex flex-col min-h-screen antialiased selection:bg-emerald-500/30`}>
          <AuthProvider>
            <AuthWrapper>
              {children}
            </AuthWrapper>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
