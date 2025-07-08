import Image from 'next/image';
import { cn } from "@/lib/utils";

export const OvoLogo = ({ className, width = 48, height = 48 }: { className?: string, width?: number, height?: number }) => (
  <Image 
    src="https://storage.googleapis.com/firebasestudio-hosting-prd.appspot.com/users/current/logo.jpg" 
    alt="OVOMONIE Logo" 
    width={width}
    height={height}
    className={cn(className)}
    style={{objectFit: "contain"}}
    data-ai-hint="company logo" 
    priority
  />
);
