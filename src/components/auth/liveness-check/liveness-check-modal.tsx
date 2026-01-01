"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LivenessCheckModalProps {
  open: boolean;
  onSuccess: () => void;
  onSkip?: () => void;
  deviceFingerprint: string;
}

export function LivenessCheckModal({ open, onSuccess, onSkip, deviceFingerprint }: LivenessCheckModalProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const { toast } = useToast();

  const captureSelfie = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); display: flex; align-items: center; 
        justify-content: center; z-index: 9999;
      `;
      
      const container = document.createElement('div');
      container.style.cssText = `
        background: white; padding: 20px; border-radius: 10px; 
        text-align: center; max-width: 90%; max-height: 90%;
      `;
      
      const title = document.createElement('h3');
      title.textContent = 'Position your face in the center';
      title.style.marginBottom = '10px';
      
      video.style.cssText = `
        width: 320px; height: 240px; border-radius: 10px; 
        border: 2px solid #007bff; margin: 10px 0;
      `;
      
      const captureBtn = document.createElement('button');
      captureBtn.textContent = 'Capture Photo';
      captureBtn.style.cssText = `
        background: #007bff; color: white; border: none; 
        padding: 10px 20px; border-radius: 5px; margin: 5px;
      `;
      
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.cssText = `
        background: #6c757d; color: white; border: none; 
        padding: 10px 20px; border-radius: 5px; margin: 5px;
      `;
      
      container.appendChild(title);
      container.appendChild(video);
      container.appendChild(captureBtn);
      container.appendChild(cancelBtn);
      modal.appendChild(container);
      document.body.appendChild(modal);
      
      await video.play();
      
      const cleanup = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
        setIsCapturing(false);
      };
      
      captureBtn.onclick = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setSelfieImage(imageData);
        cleanup();
      };
      
      cancelBtn.onclick = cleanup;
      
    } catch (error) {
      toast({ 
        title: 'Camera Error', 
        description: 'Unable to access camera. Please allow camera permissions.', 
        variant: 'destructive' 
      });
      setIsCapturing(false);
    }
  };

  const verifyLiveness = async () => {
    if (!selfieImage) return;
    
    setIsVerifying(true);
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const response = await fetch('/api/auth/device-check', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          deviceFingerprint,
          selfieImage
        }),
      });

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.message);
      }

      toast({ 
        title: 'Device Verified', 
        description: 'Your device has been successfully verified and trusted.' 
      });
      
      onSuccess();
      
    } catch (error) {
      toast({ 
        title: 'Verification Failed', 
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive' 
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            New Device Detected
          </DialogTitle>
          <DialogDescription>
            For your security, we need to verify that it's really you logging in from this new device.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!selfieImage ? (
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Camera className="h-12 w-12 text-blue-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                Take a quick selfie to verify your identity
              </p>
              <Button 
                onClick={captureSelfie} 
                disabled={isCapturing}
                className="w-full"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening Camera...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Take Selfie
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <img 
                src={selfieImage} 
                alt="Captured selfie" 
                className="w-32 h-32 rounded-lg object-cover mx-auto border-2 border-green-200" 
              />
              <div className="space-y-2">
                <Button 
                  onClick={verifyLiveness}
                  disabled={isVerifying}
                  className="w-full"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Continue'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={captureSelfie}
                  disabled={isVerifying}
                  className="w-full"
                >
                  Retake Photo
                </Button>
              </div>
            </div>
          )}
          
          {onSkip && (
            <div className="pt-4 border-t">
              <Button 
                variant="ghost" 
                onClick={onSkip}
                className="w-full text-sm"
                disabled={isCapturing || isVerifying}
              >
                Skip for now (less secure)
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}