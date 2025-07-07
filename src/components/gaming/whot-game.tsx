"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Gamepad2 } from 'lucide-react';

export function WhotGame() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Whot!</CardTitle>
        <CardDescription>The original Nigerian card game.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center h-64 text-center bg-muted rounded-lg">
        <Gamepad2 className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold">Coming Soon!</h3>
        <p className="text-muted-foreground">Get ready to shout "Check up!" and "Last card!".</p>
      </CardContent>
    </Card>
  );
}
