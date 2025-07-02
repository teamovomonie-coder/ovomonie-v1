
import Image from 'next/image';
import { cn } from "@/lib/utils";

export const OvoLogo = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center justify-center", className)}>
    <Image 
      src="https://firebasestudio.ai/storage/v1/object/public/github-assets/ovomonie-logo.png" 
      alt="OVOMONIE Logo" 
      width={180} 
      height={45} 
      data-ai-hint="company logo" 
      priority
    />
  </div>
);
