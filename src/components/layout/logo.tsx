import Image from 'next/image';
import { cn } from "@/lib/utils";
import { useState } from 'react';

export const OvoLogo = ({ className, width = 78, height = 78 }: { className?: string, width?: number, height?: number }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (imageError) {
    // Fallback to text logo if image fails
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 text-white font-bold rounded-lg shadow-lg",
          className
        )}
        style={{ width, height }}
        data-ai-hint="company logo fallback"
      >
        <span className="text-lg">OVO</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} style={{ width, height }}>
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 text-white font-bold rounded-lg shadow-lg animate-pulse"
          style={{ width, height }}
        >
          <span className="text-lg">OVO</span>
        </div>
      )}
      <Image 
        src="https://i.postimg.cc/VshPGNTT/ovomonie-logo-D0smmw0D.png" 
        alt="OVOMONIE Logo" 
        width={width}
        height={height}
        className={cn("transition-opacity duration-300", isLoading ? "opacity-0" : "opacity-100")}
        style={{objectFit: "contain"}}
        data-ai-hint="company logo" 
        priority
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImageError(true);
          setIsLoading(false);
        }}
        unoptimized={false}
      />
    </div>
  );
};
