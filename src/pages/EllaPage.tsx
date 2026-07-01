import { EllaChat } from "@/components/ella/EllaChat";

export default function EllaPage() {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="flex-1 max-w-3xl w-full mx-auto flex flex-col">
        <EllaChat />
      </div>
    </div>
  );
}
