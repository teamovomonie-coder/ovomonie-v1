"use client";

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, BarChart, Monitor, Store, UserCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const AnimatedIcon = ({ icon: Icon, className, style }: { icon: LucideIcon, className?: string, style?: React.CSSProperties }) => {
  return (
    <div className={`absolute ${className}`} style={style}>
      <Icon className="h-full w-full text-white/50" />
    </div>
  );
};

export function AgentLifeCard() {
  return (
    <>
      <style jsx global>{`
        @keyframes slow-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-slow-spin {
          animation: slow-spin 20s linear infinite;
        }
      `}</style>
      <Link href="/agent-life" className="block my-4">
        <Card className="relative w-full h-48 overflow-hidden bg-slate-800 text-white shadow-lg rounded-2xl group">
          {/* Animated background icons */}
          <div className="absolute inset-0 opacity-10">
            <AnimatedIcon icon={Monitor} className="h-24 w-24 animate-slow-spin" style={{ top: '-1rem', left: '-1rem', animationDelay: '0s' }} />
            <AnimatedIcon icon={Store} className="h-32 w-32 animate-slow-spin" style={{ bottom: '-2rem', right: '3rem', animationDirection: 'reverse', animationDuration: '25s' }} />
            <AnimatedIcon icon={UserCheck} className="h-28 w-28 animate-slow-spin" style={{ top: '50%', transform: 'translateY(-50%)', right: '-1.5rem', animationDelay: '5s' }} />
            <AnimatedIcon icon={BarChart} className="h-20 w-20 animate-slow-spin" style={{ bottom: '1rem', left: '2.5rem', animationDirection: 'reverse', animationDuration: '30s' }} />
          </div>

          <CardContent className="relative z-10 flex flex-col justify-between h-full p-6">
            <div>
              <p className="text-sm font-semibold text-yellow-400 tracking-wider">AGENTLIFE</p>
              <h3 className="text-2xl font-bold tracking-tight">
                Merchant Services
              </h3>
            </div>
            <div className="flex items-center text-sm font-semibold transition-transform group-hover:translate-x-1">
              Access Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </>
  );
}
