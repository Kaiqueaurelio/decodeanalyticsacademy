import { useState } from "react";
import { cn } from "@/lib/utils";
import { getEllaAvatarUrl, DEFAULT_ELLA_AVATAR } from "@/lib/ellaAvatar";

interface EllaAvatarProps {
  size?: number; // px
  className?: string;
  rounded?: "full" | "2xl" | "xl" | "lg";
  ring?: boolean;
  alt?: string;
}

/**
 * Avatar padrão da Ella. Sempre quadrado, com object-cover,
 * bordas arredondadas consistentes e fallback textual "ER"
 * caso a imagem falhe (nunca mostra ícone quebrado).
 */
export function EllaAvatar({
  size = 40,
  className,
  rounded = "full",
  ring = false,
  alt = "Ella Ribeiro",
}: EllaAvatarProps) {
  const [src, setSrc] = useState<string>(() => getEllaAvatarUrl());
  const [failed, setFailed] = useState(false);

  const radius =
    rounded === "full" ? "rounded-full"
    : rounded === "2xl" ? "rounded-2xl"
    : rounded === "xl" ? "rounded-xl"
    : "rounded-lg";

  const style = { width: size, height: size, minWidth: size, minHeight: size } as const;

  if (failed) {
    return (
      <div
        aria-label={alt}
        role="img"
        style={style}
        className={cn(
          radius,
          "flex items-center justify-center bg-primary/15 text-primary font-semibold select-none overflow-hidden",
          ring && "ring-2 ring-primary/40",
          className,
        )}
      >
        <span style={{ fontSize: Math.max(10, Math.round(size * 0.38)) }}>ER</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="eager"
      decoding="async"
      draggable={false}
      style={style}
      className={cn(
        radius,
        "object-cover object-center block bg-muted overflow-hidden",
        ring && "ring-2 ring-primary/40",
        className,
      )}
      onError={() => {
        try { localStorage.removeItem("decode_ella_avatar_url_v5"); } catch {}
        if (src !== DEFAULT_ELLA_AVATAR) setSrc(DEFAULT_ELLA_AVATAR);
        else setFailed(true);
      }}
    />
  );
}
