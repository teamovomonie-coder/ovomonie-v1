
import Image from 'next/image';
import { cn } from "@/lib/utils";

export const OvoLogo = ({ className }: { className?: string }) => (
  <div className={cn("relative h-11 w-44", className)}>
    <Image 
      src="https://firebasestudio.ai/storage/v1/object/public/github-assets/ovomonie-logo.png" 
      alt="OVOMONIE Logo" 
      fill
      style={{objectFit: "contain"}}
      data-ai-hint="company logo" 
      priority
    />
  </div>
);
