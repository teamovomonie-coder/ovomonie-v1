import Image from 'next/image';
import { cn } from "@/lib/utils";

export const OvoLogo = ({ className }: { className?: string }) => (
  <div className={cn("relative h-12 w-12", className)}>
    <Image 
      src="https://firebasestudio.ai/storage/v1/object/public/users/current/image.png" 
      alt="OVOMONIE Logo" 
      fill
      style={{objectFit: "contain"}}
      data-ai-hint="company logo" 
      priority
    />
  </div>
);
