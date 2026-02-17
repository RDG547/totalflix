"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { addToFavorites, removeFromFavorites, getUserProfile } from "@/lib/userProfile";
import { updateAchievementProgress, initializeAchievements } from "@/lib/achievements";
import toast from "react-hot-toast";

interface FavoriteButtonProps {
    contentId: number;
    contentTitle: string;
    size?: "sm" | "md" | "lg";
    showText?: boolean;
}

export function FavoriteButton({
    contentId,
    contentTitle,
    size = "md",
    showText = true
}: FavoriteButtonProps) {
    const { user } = useAuth();
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const sizeClasses = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg",
    };

    const iconSizes = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6",
    };

    useEffect(() => {
        const checkStatus = async () => {
            if (!user) return;

            try {
                const profile = await getUserProfile(user.uid);
                if (profile) {
                    setIsFavorite(profile.favorites.includes(contentId));
                }
            } catch (error) {
                console.error("Erro ao verificar favorito:", error);
            }
        };

        checkStatus();
    }, [user, contentId]);

    const toggleFavorite = async () => {
        if (!user || isLoading) {
            if (!user) {
                toast.error("Faça login para adicionar aos favoritos");
            }
            return;
        }

        setIsLoading(true);
        try {
            if (isFavorite) {
                await removeFromFavorites(user.uid, contentId);
                setIsFavorite(false);
                toast.success("Removido dos favoritos");

                // Disparar evento customizado para atualizar outras páginas
                window.dispatchEvent(new CustomEvent('favoriteRemoved', {
                    detail: { movieId: contentId }
                }));
            } else {
                await addToFavorites(user.uid, contentId);
                setIsFavorite(true);
                toast.success("Adicionado aos favoritos");

                // Disparar evento customizado para atualizar outras páginas
                window.dispatchEvent(new CustomEvent('favoriteAdded', {
                    detail: { movieId: contentId }
                }));

                // Atualizar conquistas de favoritos (sem bloquear a UI)
                initializeAchievements(user.uid)
                    .then(() => updateAchievementProgress(user.uid, 'favorite'))
                    .catch((err) => console.error("Erro ao atualizar conquistas:", err));
            }
        } catch (error) {
            console.error("Erro ao atualizar favorito:", error);
            toast.error("Erro ao atualizar favorito");
            // Reverter estado em caso de erro
            setIsFavorite(!isFavorite);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <button
            onClick={toggleFavorite}
            disabled={isLoading}
            className={`${showText ? sizeClasses[size] : 'p-3'} ${isFavorite
                    ? "bg-red-600 hover:bg-red-700 border-red-500"
                    : "bg-purple-600 hover:bg-purple-700 border-purple-500"
                } border-2 text-white ${showText ? 'rounded-lg' : 'rounded-full'} transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 ${showText ? 'font-semibold' : ''} glow-effect flex items-center ${showText ? 'gap-2' : 'justify-center'}`}
            aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
            <Heart
                className={`${iconSizes[size]} transition-all ${isFavorite ? "fill-current" : ""
                    }`}
            />
            {showText && (
                <span>{isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}</span>
            )}
        </button>
    );
}
