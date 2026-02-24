"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/context/AuthContext";
import { LoginPage } from "@/components/auth/LoginPage";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { usePathname } from "next/navigation";

/*
### Interfaz de Inicio de Sesión
He diseñado una pantalla de acceso con estética premium:
- **Diseño Glassmorphism**: Fondo oscuro con efectos de desenfoque y gradientes sutiles.
- **Seguridad**: Validación de campos y gestión de errores en tiempo real.
- **Sesión Persistente**: El sistema recuerda al usuario incluso al refrescar la página.

![Pantalla de Inicio de Sesión LexCRM](/Users/nuriaarauconca/.gemini/antigravity/brain/81fdccf3-0c94-4c45-9143-6b8720cee6c0/crm_login_page_1771881275193.png)

#### Verificación del Funcionamiento
He verificado que el sistema redirige automáticamente al login al detectar una sesión inexistente y que la interfaz es totalmente interactiva:

![Vídeo de verificación del sistema de seguridad](/Users/nuriaarauconca/.gemini/antigravity/brain/81fdccf3-0c94-4c45-9143-6b8720cee6c0/verify_auth_ui_fixed_1771881268733.webp)

### Protección de Datos
*/
export function AuthWrapper({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const { user, loading } = useAuth();
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    // Permitir acceso a la página de setup inicial sin estar autenticado
    if (pathname === '/setup-admin') {
        return <>{children}</>;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    return (
        <>
            <Topbar />
            <div className="flex-1 flex w-full relative overflow-hidden">
                <Sidebar />
                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </>
    );
}
