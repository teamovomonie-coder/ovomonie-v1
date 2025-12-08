
"use client";

import CustomLink from '@/components/layout/custom-link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

const StarIcon = ({ className }: { className?: string }) => (
    <div className={className}>
        <svg viewBox="0 0 100 100" className="drop-shadow-glow-yellow animate-float" style={{ animationDelay: '-1s' }}>
            <defs>
                <linearGradient id="star-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            <path d="M50 0 L61.2 35.5 L98.5 35.5 L68.6 57.4 L79.8 92.5 L50 70.6 L20.2 92.5 L31.4 57.4 L1.5 35.5 L38.8 35.5 Z" fill="url(#star-gradient)" />
        </svg>
        {/* Sparkles */}
        <div className="sparkle one"></div>
        <div className="sparkle two"></div>
        <div className="sparkle three"></div>
    </div>
);

const TargetIcon = ({ className }: { className?: string }) => (
     <svg viewBox="0 0 100 100" className={className}>
        <g className="drop-shadow-glow-blue animate-float">
            <circle cx="50" cy="50" r="45" fill="hsl(var(--primary-foreground))" />
            <circle cx="50" cy="50" r="30" fill="#001F54" />
            <circle cx="50" cy="50" r="15" fill="hsl(var(--primary-foreground))" />
        </g>
    </svg>
);


export function AgentLifeCard() {
  return (
    <>
      <style jsx global>{`
        @keyframes slow-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 5px currentColor); }
          50% { filter: drop-shadow(0 0 15px currentColor); }
        }
        @keyframes sparkle {
          0%, 100% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1); opacity: 1; }
        }
         @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .animate-slow-spin { animation: slow-spin 20s linear infinite; }
        
        .drop-shadow-glow-yellow {
             animation: glow 3s ease-in-out infinite;
             color: #FFD700;
        }

        .drop-shadow-glow-blue {
            animation: glow 3s ease-in-out infinite;
            color: #a5b4fc;
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        
        .sparkle {
            position: absolute;
            background-color: white;
            border-radius: 50%;
            animation: sparkle 1.5s infinite;
        }
        .sparkle.one { width: 4px; height: 4px; top: 10%; left: 20%; animation-delay: 0s; }
        .sparkle.two { width: 6px; height: 6px; top: 80%; left: 30%; animation-delay: 0.5s; }
        .sparkle.three { width: 5px; height: 5px; top: 40%; left: 90%; animation-delay: 1s; }
      `}</style>
      <CustomLink href="/agent-life" className="block my-4">
        <Card className="relative w-full h-36 overflow-hidden bg-[#001F54] text-white shadow-lg rounded-2xl group">
            {/* Animated background icons */}
            <div className="absolute inset-0 opacity-65">
                <div className="absolute h-24 w-24 animate-slow-spin" style={{ top: '-2rem', right: '5rem', animationDuration: '25s' }}>
                    <TargetIcon className="h-24 w-24" />
                </div>
                <div className="absolute h-12 w-12" style={{ bottom: '-1rem', left: '1rem', animationDelay: '0s' }}>
                    <StarIcon className="h-12 w-12" />
                </div>
                <div className="absolute h-16 w-16" style={{ top: '-1rem', right: '1rem', animationDelay: '1.5s' }}>
                    <StarIcon className="h-16 w-16" />
                </div>
            </div>

          <CardContent className="relative z-10 flex items-center h-full p-4">
             <div className="absolute top-4 right-4 text-right text-sm text-white font-semibold space-y-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                <p>2% Agent Loans</p>
            </div>
             <div className="flex flex-col justify-between h-full flex-1">
                <div>
                    <p className="text-xl font-black tracking-tighter text-yellow-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                        AGENTLIFE
                    </p>
                </div>
                <h3 className="text-lg font-bold text-white whitespace-nowrap">
                    Merchant Services
                </h3>
            </div>
            <div className="flex items-center text-xs font-semibold transition-transform group-hover:translate-x-1 bg-black/30 p-2 rounded-lg backdrop-blur-sm">
              Access Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </CustomLink>
    </>
  );
}
