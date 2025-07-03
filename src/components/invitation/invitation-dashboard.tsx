
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

  const handleCopyToClipboard = (message?: string) => {
    const textToCopy = message || referralLink;
    navigator.clipboard.writeText(textToCopy);
    toast({ 
        title: 'Copied to Clipboard!', 
        description: message ? 'Your message has been copied.' : 'Your referral link has been copied.'
    });
  };

  const handleUniversalShare = async () => {
      const shareData = {
          title: 'Join Ovomonie',
          text: `Join Ovomonie and earn while you bank. Sign up with my link.`,
          url: referralLink,
      };
      // navigator.share is only available on HTTPS and on mobile or supported desktop browsers.
      if (navigator.share) {
          try {
              await navigator.share(shareData);
              // The share sheet was successfully opened. No toast needed as the OS provides feedback.
          } catch (err) {
              // This block is entered if the user cancels the share dialog (AbortError) or if another error occurs.
              // We silently ignore AbortError, as the user intentionally cancelled the action.
              if (!(err instanceof Error && err.name === 'AbortError')) {
                  toast({
                      variant: 'destructive',
                      title: 'Sharing Failed',
                      description: 'Could not open share dialog. Link copied instead.',
                  });
                  handleCopyToClipboard();
              }
          }
      } else {
          // Fallback for browsers that do not support the Web Share API
           toast({
              title: 'Share Not Supported',
              description: 'Your browser does not support this feature. The link has been copied instead.',
            });
          handleCopyToClipboard();
      }
  };
  
  const handleShareToContact = async () => {
    const message = `Hey! I use Ovomonie for secure digital banking. Sign up using my referral link and get rewarded: ${referralLink}`;

    // The Contact Picker API is experimental and only works on HTTPS in supported browsers.
    if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
        try {
            const contacts = await (navigator as any).contacts.select(['tel'], { multiple: true });
            
            if (contacts.length === 0) {
                // User cancelled the picker, do nothing.
                return;
            }
            
            const phoneNumbers = contacts.map((contact: any) => contact.tel[0]).join(',');
            
            // This will attempt to open the default SMS app.
            const smsLink = `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`;
            window.location.href = smsLink;

        } catch (error) {
            // Ignore AbortError which happens when the user cancels the contact picker.
            if (!(error instanceof Error && error.name === 'AbortError')) {
                toast({ 
                    variant: 'destructive', 
                    title: 'Could Not Share to Contacts', 
                    description: 'There was an error accessing your contacts. The message has been copied instead.' 
                });
                handleCopyToClipboard(message);
            }
        }
    } else {
        toast({
            title: "Feature Not Supported",
            description: "Sharing to contacts directly is not supported on your browser. The message has been copied instead.",
        });
        handleCopyToClipboard(message);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader className="text-center bg-primary text-primary-foreground p-6 rounded-t-lg">
        <Gift className="mx-auto h-12 w-12 text-yellow-400" />
        <CardTitle className="text-2xl mt-2">Invite Friends, Earn Rewards!</CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Earn <span className="font-bold text-yellow-400">₦500</span> for every friend who signs up and completes their first transaction.
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
              <Button onClick={() => handleCopyToClipboard()} className="rounded-l-none" aria-label="Copy referral link">
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
                  <Button variant="outline" size="lg" className="flex-1">
                    <Share2 className="mr-2 h-5 w-5" /> Share Link
                  </Button>
                  <Button variant="outline" size="lg" className="flex-1">
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
