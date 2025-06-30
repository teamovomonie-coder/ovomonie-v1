
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Users, Award, Gift, Share2, Contact } from 'lucide-react';

export function InvitationDashboard() {
  const [referralLink] = useState('https://ovomonie.ng/signup?ref=ABC123');
  const [stats] = useState({ invites: 23, signups: 15, earnings: 7500 });
  const { toast } = useToast();

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: 'Copied!', description: 'Your referral link has been copied to the clipboard.' });
  };

  const handleUniversalShare = async () => {
      const shareData = {
          title: 'Join Ovomonie',
          text: `Join Ovomonie and earn while you bank. Sign up with my link: ${referralLink}`,
          url: referralLink,
      };
      if (navigator.share) {
          try {
              await navigator.share(shareData);
              // On success, the promise resolves. We don't need a toast here as the share sheet itself provides feedback.
          } catch (err) {
              // Silently fail if user cancels the share dialog (AbortError).
              // For other errors (like permission denied), we fallback to copying the link.
              if (!(err instanceof Error && err.name === 'AbortError')) {
                 handleCopyToClipboard();
              }
          }
      } else {
          // Fallback for browsers that do not support navigator.share
          handleCopyToClipboard();
      }
  };
  
  const handleShareToContact = async () => {
    const message = `Hey! I use Ovomonie for secure digital banking. Sign up using my referral link and get rewarded: ${referralLink}`;

    if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
        try {
            const contacts = await (navigator as any).contacts.select(['tel'], { multiple: true });
            
            if (contacts.length === 0) {
                // User cancelled the picker, do nothing.
                return;
            }
            
            const phoneNumbers = contacts.map((contact: any) => contact.tel[0]).join(',');
            
            // This will open the default SMS app.
            const smsLink = `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`;
            window.location.href = smsLink;

        } catch (error) {
            // Handle potential errors, e.g., user denies permission, but ignore AbortError from cancellation.
            if (!(error instanceof Error && error.name === 'AbortError')) {
                toast({ variant: 'destructive', title: 'Could not share', description: 'There was an error accessing your contacts.' });
            }
        }
    } else {
        toast({
            variant: 'destructive',
            title: "Feature Not Supported",
            description: "Your browser does not support sharing to contacts directly.",
        });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader className="text-center bg-slate-900 text-white p-6 rounded-t-lg">
        <Gift className="mx-auto h-12 w-12 text-accent" />
        <CardTitle className="text-2xl mt-2">Invite Friends, Earn Rewards!</CardTitle>
        <CardDescription className="text-slate-300">
          Earn <span className="font-bold text-accent">₦500</span> for every friend who signs up and completes their first transaction.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Your Unique Referral Link</p>
            <div className="flex w-full">
              <Input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 rounded-r-none focus-visible:ring-offset-0 focus-visible:ring-0"
              />
              <Button onClick={handleCopyToClipboard} className="rounded-l-none" aria-label="Copy referral link">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-muted p-4 rounded-lg">
              <Users className="mx-auto h-8 w-8 text-primary mb-2" />
              <p className="text-2xl font-bold">{stats.invites}</p>
              <p className="text-sm text-muted-foreground">Invites Sent</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <Award className="mx-auto h-8 w-8 text-primary mb-2" />
              <p className="text-2xl font-bold">{stats.signups}</p>
              <p className="text-sm text-muted-foreground">Successful Signups</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="mx-auto h-8 w-8 flex items-center justify-center text-primary mb-2 font-bold text-xl">₦</div>
              <p className="text-2xl font-bold">{stats.earnings.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Rewards Earned</p>
            </div>
          </div>
          
          <div className="text-center space-y-2">
             <p className="text-sm font-medium text-muted-foreground">Share your link via</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button variant="outline" size="lg" className="flex-1" onClick={handleUniversalShare}>
                    <Share2 className="mr-2 h-5 w-5" /> Share Link
                  </Button>
                  <Button variant="outline" size="lg" className="flex-1" onClick={handleShareToContact}>
                    <Contact className="mr-2 h-5 w-5" /> Share to Contact
                  </Button>
              </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground text-center w-full">
          Rewards are credited to your wallet after your friend completes their first transaction of ₦1,000 or more. Terms & Conditions apply.
        </p>
      </CardFooter>
    </Card>
  );
}
