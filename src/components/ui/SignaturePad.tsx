"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import SignaturePadLib from "signature_pad";

export interface SignaturePadRef {
    isEmpty: () => boolean;
    toDataURL: (type?: string) => string;
    clear: () => void;
    undo: () => void;
}

interface SignaturePadProps {
    penColor?: string;
    backgroundColor?: string;
    className?: string;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
    ({ penColor = "#1e293b", backgroundColor = "#f8fafc", className = "" }, ref) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const padRef = useRef<SignaturePadLib | null>(null);

        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            // Escalar correctamente para pantallas retina / HiDPI
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            const ctx = canvas.getContext("2d");
            if (ctx) ctx.scale(ratio, ratio);

            padRef.current = new SignaturePadLib(canvas, {
                penColor,
                backgroundColor,
                minWidth: 1.2,
                maxWidth: 3.5,
                velocityFilterWeight: 0.7,
            });

            const handleResize = () => {
                const data = padRef.current?.toData();
                canvas.width = canvas.offsetWidth * ratio;
                canvas.height = canvas.offsetHeight * ratio;
                const c = canvas.getContext("2d");
                if (c) c.scale(ratio, ratio);
                padRef.current?.clear();
                if (data) padRef.current?.fromData(data);
            };

            window.addEventListener("resize", handleResize);
            return () => {
                window.removeEventListener("resize", handleResize);
                padRef.current?.off();
            };
        }, [penColor, backgroundColor]);

        useImperativeHandle(ref, () => ({
            isEmpty: () => padRef.current?.isEmpty() ?? true,
            toDataURL: (type?: string) => padRef.current?.toDataURL(type) ?? "",
            clear: () => padRef.current?.clear(),
            undo: () => {
                const data = padRef.current?.toData();
                if (data && data.length > 0) {
                    data.pop();
                    padRef.current?.fromData(data);
                }
            },
        }));

        return (
            <canvas
                ref={canvasRef}
                className={`w-full h-full touch-none cursor-crosshair ${className}`}
                style={{ touchAction: "none" }}
            />
        );
    }
);

SignaturePad.displayName = "SignaturePad";
export default SignaturePad;
