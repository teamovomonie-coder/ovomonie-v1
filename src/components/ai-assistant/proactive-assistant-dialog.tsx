
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';

interface ProactiveAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendation: string;
  onAction: () => void;
}

export function ProactiveAssistantDialog({ open, onOpenChange, recommendation, onAction }: ProactiveAssistantDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="items-center text-center">
          <div className="p-3 bg-primary-light-bg rounded-full text-primary mb-4">
            <Mic className="h-8 w-8" />
          </div>
          <DialogTitle>A Quick Thought...</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-center text-lg">
            <p>{recommendation}</p>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Not now</Button>
          <Button onClick={onAction}>Tell me more</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
