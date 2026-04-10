interface GlitchLoaderProps {
  text?: string;
  className?: string;
}

export function GlitchLoader({ text = "Carregando...", className = "" }: GlitchLoaderProps) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <span className="glitch text-lg" data-glitch={text}>
        {text}
      </span>
    </div>
  );
}
