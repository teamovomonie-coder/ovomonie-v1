
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export const OvoLogo = ({ className, iconClassName, textClassName }: { className?: string; iconClassName?: string; textClassName?: string }) => (
  <div className={cn("flex items-center gap-2", className)}>
    <Wallet className={cn("w-8 h-8 text-primary", iconClassName)} />
    <h1 className={cn("text-2xl font-bold text-primary", textClassName)}>
      OVO Thrive
    </h1>
  </div>
);
