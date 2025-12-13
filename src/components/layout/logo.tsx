import Image from 'next/image';
import { cn } from "@/lib/utils";

export const OvoLogo = ({ className, width = 78, height = 78 }: { className?: string, width?: number, height?: number }) => (
  <Image 
    src="https://i.postimg.cc/VshPGNTT/ovomonie-logo-D0smmw0D.png" 
    alt="OVOMONIE Logo" 
    width={width}
    height={height}
    className={cn(className)}
    style={{objectFit: "contain"}}
    data-ai-hint="company logo" 
    priority
  />
);
