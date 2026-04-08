import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ContentCard } from "@/components/ContentCard";

interface Material {
  id: string;
  title: string;
  type: string;
  description?: string | null;
  categories?: { name: string } | null;
}

interface ContentRowProps {
  title: string;
  materials: Material[];
}

export function ContentRow({ title, materials }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!materials || materials.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="space-y-1 sm:space-y-2 group/row relative">
      <h2 className="text-sm sm:text-base lg:text-lg font-bold text-foreground px-[3.5%] sm:px-[3.5%]">
        {title}
      </h2>

      <div className="relative overflow-visible">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-30 w-[3.5%] bg-background/60 hover:bg-background/80 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-1 sm:gap-[4px] overflow-x-auto hide-scrollbar content-row px-[3.5%] py-6"
          style={{ overflowY: "visible", clipPath: "inset(-100px 0 -100px 0)" }}
        >
          {materials.map((mat) => (
            <ContentCard
              key={mat.id}
              id={mat.id}
              title={mat.title}
              type={mat.type}
              description={mat.description}
              categoryName={(mat.categories as any)?.name}
            />
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-30 w-[3.5%] bg-background/60 hover:bg-background/80 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
        </button>
      </div>
    </div>
  );
}
