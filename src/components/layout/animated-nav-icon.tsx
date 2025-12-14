/**
 * Animated Navigation Icons
 * Different animations for each menu item when active
 */

'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Home, Package, CreditCard, Briefcase, User, Grip } from 'lucide-react';
import { cn } from '@/lib/utils';
import styles from './animated-nav-icon.module.css';

interface AnimatedNavIconProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  className?: string;
}

export function AnimatedNavIcon({ icon: Icon, label, isActive, className }: AnimatedNavIconProps) {
  // Determine animation style based on label
  const getAnimationClass = () => {
    switch (label.toLowerCase()) {
      case 'home':
        return styles.iconFloat;
      case 'inventory':
        return styles.iconBounce;
      case 'card':
        return styles.iconWave;
      case 'agent':
        return styles.agentAnimation;
      case 'me':
        return styles.iconPulse;
      default:
        return '';
    }
  };

  return (
    <div
      className={cn(
        'relative transition-all duration-300',
        isActive ? 'scale-110' : 'scale-100',
        className
      )}
    >
      {isActive && (
        <div className={cn(styles.animationContainer, getAnimationClass())}>
          <Icon className="h-6 w-6" />
        </div>
      )}
      {!isActive && <Icon className="h-6 w-6" />}
    </div>
  );
}
