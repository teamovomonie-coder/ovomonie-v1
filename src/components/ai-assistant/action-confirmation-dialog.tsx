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
import { type AiAssistantFlowOutput } from '@/types/ai-flows';

type Action = AiAssistantFlowOutput['action'];

interface ActionConfirmationDialogProps {
  action: Action;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ActionConfirmationDialog({ action, open, onOpenChange, onConfirm }: ActionConfirmationDialogProps) {
  if (!action) {
    return null;
  }

  let title = "Confirm Action";
  let description = "Please review the details before confirming.";
  let details: React.ReactNode = null;

  if (action.type === 'internal_transfer') {
    title = "Confirm Transfer";
    details = (
        <div className="space-y-2 rounded-md bg-muted p-4">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold">₦{action.details.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">To:</span>
                <span className="font-semibold">{action.details.recipientName}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Account:</span>
                <span className="font-mono text-sm">{action.details.recipientAccountNumber}</span>
            </div>
        </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">{details}</div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm}>Proceed</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
