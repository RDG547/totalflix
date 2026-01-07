"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    onConfirm,
    onCancel,
    variant = "warning",
}: ConfirmDialogProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !isOpen) return null;

    const variantStyles = {
        danger: {
            button: "bg-red-600 hover:bg-red-700 text-white",
            icon: "text-red-500",
            border: "border-red-500/30",
        },
        warning: {
            button: "bg-yellow-600 hover:bg-yellow-700 text-white",
            icon: "text-yellow-500",
            border: "border-yellow-500/30",
        },
        info: {
            button: "bg-purple-600 hover:bg-purple-700 text-white",
            icon: "text-purple-500",
            border: "border-purple-500/30",
        },
    };

    const styles = variantStyles[variant];

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className={`relative w-full max-w-md glass-effect border ${styles.border} rounded-2xl p-6 animate-in zoom-in-95 duration-200`}>
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    aria-label="Fechar"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white pr-8">{title}</h2>
                    <p className="text-gray-300">{message}</p>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 px-4 py-2 ${styles.button} rounded-lg transition-colors font-medium glow-effect`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
