
"use client";

import * as React from "react";
import CustomLink from '@/components/layout/custom-link';
import Autoplay from "embla-carousel-autoplay";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Users, Receipt, CreditCard, Building2, Nfc, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PromoCardProps {
  href: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  backgroundClass: string;
  ctaText: string;
}

const promoCards: PromoCardProps[] = [
  {
    href: "/payroll",
    title: "Effortless Payroll",
    description: "Pay your team in minutes.",
    Icon: Users,
    backgroundClass: "bg-gradient-to-br from-gray-700 via-gray-900 to-black",
    ctaText: "Start",
  },
  {
    href: "/invoicing",
    title: "Professional Invoicing",
    description: "Create and send invoices.",
    Icon: Receipt,
    backgroundClass: "bg-gradient-to-br from-sky-100 to-white",
    ctaText: "Create",
  },
  {
    href: "/inventory",
    title: "Smart Inventory",
    description: "Manage your stock effortlessly.",
    Icon: Package,
    backgroundClass: "bg-gradient-to-br from-blue-500 to-indigo-600",
    ctaText: "Manage",
  },
  {
    href: "/custom-card",
    title: "Your Card, Your Style",
    description: "Design a card that reflects you.",
    Icon: CreditCard,
    backgroundClass: "bg-gradient-to-br from-slate-500 via-slate-700 to-slate-900",
    ctaText: "Design",
  },
  {
    href: "/cac-registration",
    title: "Register Your Business",
    description: "Get your CAC registration done.",
    Icon: Building2,
    backgroundClass: "bg-gradient-to-br from-green-800 to-teal-900",
    ctaText: "Register",
  },
  {
    href: "/contactless-banking",
    title: "Tap to Pay",
    description: "Fast, secure contactless payments.",
    Icon: Nfc,
    backgroundClass: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
    ctaText: "Try It",
  },
];

const PromoCard = ({ card }: { card: PromoCardProps }) => {
  const isDarkBg = card.backgroundClass.includes('black') || card.backgroundClass.includes('gray') || card.backgroundClass.includes('slate') || card.backgroundClass.includes('green') || card.backgroundClass.includes('indigo') || card.backgroundClass.includes('purple') || card.backgroundClass.includes('blue');
  const textColorClass = isDarkBg ? "text-white" : "text-gray-800";
  const descColorClass = isDarkBg ? "text-gray-300" : "text-gray-600";
  const iconColorClass = isDarkBg ? "text-white/80" : "text-primary";
  const buttonVariant = isDarkBg ? 'secondary' : 'default';

  return (
    <Card className={`w-full h-28 overflow-hidden shadow-lg rounded-2xl group relative ${card.backgroundClass}`}>
      <CardContent className={`relative z-10 flex flex-col justify-between h-full p-4 ${textColorClass}`}>
          <div className={`self-start p-2 bg-white/20 rounded-lg backdrop-blur-sm`}>
              <card.Icon className={`w-5 h-5 ${iconColorClass}`} />
          </div>
          <div>
              <h3 className="text-lg font-bold drop-shadow-sm">{card.title}</h3>
              <p className={`text-xs ${descColorClass} max-w-[70%]`}>{card.description}</p>
          </div>
      </CardContent>
       <CustomLink href={card.href} className="absolute bottom-3 right-3 z-20" aria-label={card.title}>
        <Button size="sm" variant={buttonVariant} className="rounded-full shadow-md">
          {card.ctaText}
        </Button>
      </CustomLink>
    </Card>
  );
};

export function PromotionalCarousel() {
  const plugin = React.useRef(
    Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: false })
  );

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full my-4"
      opts={{
        loop: true,
      }}
    >
      <CarouselContent>
        {promoCards.map((card, index) => (
          <CarouselItem key={index}>
            <PromoCard card={card} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
