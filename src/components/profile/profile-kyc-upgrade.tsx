import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface KycUpgradeProps {
  tier: number;
  requirements: string[];
}


export default function ProfileKycUpgrade({ tier, requirements }: KycUpgradeProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<{ [key: string]: string | null }>({});
  const [loading, setLoading] = useState(false);

  // Selfie capture handler
  const handleCaptureSelfie = async (req: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      setForm((prev) => ({ ...prev, [req]: dataUrl }));
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      toast({ title: "Camera Error", description: "Unable to access camera.", variant: "destructive" });
    }
  };

  const handleChange = (req: string, value: string) => {
    setForm((prev) => ({ ...prev, [req]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const token = localStorage.getItem("ovo-auth-token");
    if (!token) {
      toast({ title: "Error", description: "Not authenticated", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Get BVN from form
    const bvn = form['BVN'] || form['bvn'];
    if (!bvn) {
      toast({ title: "Error", description: "BVN is required", variant: "destructive" });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/kyc/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tier, bvn })
      });

      const result = await response.json();
      
      if (result.ok) {
        toast({ title: "Success", description: result.message });
        // Refresh user data
        window.location.reload();
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to upgrade account", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Render dynamic fields based on requirements
  const renderField = (req: string) => {
    if (/selfie/i.test(req)) {
      return (
        <div key={req}>
          <label className="block text-sm font-medium mb-1">{req}</label>
          {form[req] ? (
            <img src={form[req] as string} alt="Selfie" className="w-32 h-32 rounded-full object-cover border" />
          ) : (
            <Button type="button" onClick={() => handleCaptureSelfie(req)} className="w-full mb-2">Capture Selfie</Button>
          )}
        </div>
      );
    }
    if (/otp|confirmation/i.test(req)) {
      return (
        <div key={req}>
          <label className="block text-sm font-medium mb-1">{req}</label>
          <Input
            value={form[req] || ""}
            onChange={(e) => handleChange(req, e.target.value)}
            placeholder="Enter OTP sent to your phone"
            required
            maxLength={6}
            minLength={4}
          />
        </div>
      );
    }
    if (/bvn/i.test(req)) {
      return (
        <div key={req}>
          <label className="block text-sm font-medium mb-1">{req}</label>
          <Input
            value={form[req] || ""}
            onChange={(e) => handleChange(req, e.target.value)}
            placeholder="Enter your BVN number"
            required
            maxLength={11}
            minLength={11}
            pattern="\d{11}"
          />
        </div>
      );
    }
    // Default: text input
    return (
      <div key={req}>
        <label className="block text-sm font-medium mb-1">{req}</label>
        <Input
          value={form[req] || ""}
          onChange={(e) => handleChange(req, e.target.value)}
          required
        />
      </div>
    );
  };

  return (
    <Card className="max-w-lg mx-auto mt-8">
      <CardHeader>
        <CardTitle>Upgrade to Tier {tier}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {requirements.map(renderField)}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Submit KYC Upgrade"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
