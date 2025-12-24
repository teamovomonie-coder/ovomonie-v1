"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

export default function ShareModal({ open, onOpenChange, targetRef, title = 'Receipt' }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  targetRef: React.RefObject<HTMLElement | null>;
  title?: string;
}) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Runtime feature detection for sharing support
  const [supportsShareApi, setSupportsShareApi] = useState(false);
  const [supportsFileShare, setSupportsFileShare] = useState(false);

  useEffect(() => {
    const hasShare = typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function';
    const hasCanShare = typeof navigator !== 'undefined' && typeof (navigator as any).canShare === 'function';
    setSupportsShareApi(hasShare);
    setSupportsFileShare(hasCanShare);
  }, []);

  const captureCanvas = async (): Promise<HTMLCanvasElement> => {
    if (!targetRef?.current) throw new Error('Receipt element not found');
    const container = targetRef.current as HTMLElement;
    
    // Hide elements with no-capture class
    const noCaptureElements = container.querySelectorAll('.no-capture');
    const originalStyles: Array<{ element: Element; display: string }> = [];
    
    noCaptureElements.forEach((element) => {
      originalStyles.push({
        element,
        display: (element as HTMLElement).style.display,
      });
      (element as HTMLElement).style.display = 'none';
    });

    const scale = 2;
    try {
      // html2canvas will capture the node into a canvas
      const canvas = await html2canvas(container, { scale, useCORS: true });
      return canvas;
    } finally {
      // Restore the original styles
      originalStyles.forEach(({ element, display }) => {
        (element as HTMLElement).style.display = display;
      });
    }
  };

  const handleDownloadImage = async () => {
    setIsProcessing(true);
    try {
      const canvas = await captureCanvas();
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${title.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ title: 'Download started', description: 'Receipt image is downloading.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to capture receipt.' });
    } finally {
      setIsProcessing(false);
      onOpenChange(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsProcessing(true);
    try {
      const canvas = await captureCanvas();
      const imgData = canvas.toDataURL('image/png');
      // Load jspdf only on the client at runtime to avoid SSR/module resolution issues
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${title.replace(/\s+/g, '-')}.pdf`);
      toast({ title: 'Download started', description: 'Receipt PDF is downloading.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to generate PDF.' });
    } finally {
      setIsProcessing(false);
      onOpenChange(false);
    }
  };

  const blobFromCanvas = (canvas: HTMLCanvasElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert canvas to blob'));
      }, 'image/png');
    });
  };

  const handleNativeShare = async () => {
    if (!targetRef?.current) return;
    if (navigator.share) {
      setIsProcessing(true);
      try {
        const canvas = await captureCanvas();
        const blob = await blobFromCanvas(canvas);
        const file = new File([blob], `${title.replace(/\s+/g, '-')}.png`, { type: 'image/png' });
        // If the browser supports sharing files, include the file so social apps appear in the share sheet
        if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
          await (navigator as any).share({ files: [file], title, text: `${title} - Receipt from Ovomonie` });
          toast({ title: 'Shared', description: 'Receipt shared via native share dialog.' });
        } else {
          // Fallback: share text only
          await navigator.share({ title, text: `${title} - Receipt from Ovomonie` });
        }
      } catch (e) {
        toast({ title: 'Error', description: 'Failed to share via native dialog.' });
      } finally {
        setIsProcessing(false);
        onOpenChange(false);
      }
    } else {
      toast({ title: 'Not supported', description: 'Native share is not available on this device.' });
    }
  };

  const handleShareTo = async (platform: 'whatsapp' | 'twitter' | 'facebook') => {
    // Prefer sharing the PNG via native share (will surface installed apps)
    if (supportsShareApi) {
      try {
        const canvas = await captureCanvas();
        const blob = await blobFromCanvas(canvas);
        const file = new File([blob], `${title.replace(/\s+/g, '-')}.png`, { type: 'image/png' });
        if (supportsFileShare && (navigator as any).canShare({ files: [file] })) {
          await (navigator as any).share({ files: [file], title, text: `${title} - Receipt from Ovomonie` });
          onOpenChange(false);
          return;
        }
      } catch (e) {
        // fall through to url fallback
      }
    }

    // Fallback: open platform share URL with text (image sharing via URL unsupported as a data URL reliably)
    const text = encodeURIComponent(`${title} - Receipt from Ovomonie`);
    let url = '';
    if (platform === 'whatsapp') url = `https://wa.me/?text=${text}`;
    if (platform === 'twitter') url = `https://twitter.com/intent/tweet?text=${text}`;
    if (platform === 'facebook') url = `https://www.facebook.com/sharer/sharer.php?u=${text}`;
    window.open(url, '_blank');
    onOpenChange(false);
  };

    const nativeShareCaption = supportsShareApi ? (supportsFileShare ? 'Opens device share sheet (images & apps)' : 'Opens device share sheet (text only)') : 'Native share unavailable';

    const captionForPlatform = (platform: string) => {
      if (supportsShareApi && supportsFileShare) return 'Opens device share sheet';
      if (platform === 'whatsapp') return 'Opens WhatsApp web';
      if (platform === 'twitter') return 'Opens Twitter';
      if (platform === 'facebook') return 'Opens Facebook';
      return 'Opens share URL';
    };

    return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Receipt</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button onClick={handleDownloadPdf} disabled={isProcessing}>Download as PDF</Button>
            <Button onClick={handleDownloadImage} disabled={isProcessing}>Download as Image</Button>
          </div>

          <div className="pt-2">
            <div className="text-sm text-muted-foreground mb-2">Share via</div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Button onClick={() => handleShareTo('whatsapp')} variant="ghost">WhatsApp</Button>
                <div className="text-xs text-muted-foreground mt-1">{captionForPlatform('whatsapp')}</div>
              </div>
              <div>
                <Button onClick={() => handleShareTo('twitter')} variant="ghost">Twitter</Button>
                <div className="text-xs text-muted-foreground mt-1">{captionForPlatform('twitter')}</div>
              </div>
              <div>
                <Button onClick={() => handleShareTo('facebook')} variant="ghost">Facebook</Button>
                <div className="text-xs text-muted-foreground mt-1">{captionForPlatform('facebook')}</div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <div className="text-sm text-muted-foreground mb-2">Quick</div>
            <div className="flex flex-col gap-2">
              <Button onClick={handleNativeShare} variant="outline">Native Share</Button>
              <div className="text-xs text-muted-foreground">{nativeShareCaption}</div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
