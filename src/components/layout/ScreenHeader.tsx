import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  className?: string;
}

export function ScreenHeader({ title, subtitle, back, right, className }: Props) {
  const nav = useNavigate();
  return (
    <header className={cn("sticky top-0 z-30 bg-background/85 backdrop-blur-xl", className)}>
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
        <div className="flex items-center gap-2">
          {back && (
            <button
              onClick={() => nav(-1)}
              className="-ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
    </header>
  );
}
