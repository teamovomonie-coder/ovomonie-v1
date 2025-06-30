
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Users, Award, Gift } from 'lucide-react';

const WhatsAppIcon = () => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.204-1.634a11.86 11.86 0 005.785 1.65c6.554 0 11.88-5.335 11.883-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const SmsIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
    </svg>
);

const EmailIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current">
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
);

export function InvitationDashboard() {
  const [referralLink] = useState('https://ovomonie.ng/signup?ref=USR78A4B');
  const [stats] = useState({ invites: 23, signups: 15, earnings: 7500 });
  const { toast } = useToast();

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: 'Copied!', description: 'Your referral link has been copied to the clipboard.' });
  };

  const handleShare = (platform: string) => {
    toast({ title: 'Shared!', description: `Your referral link has been shared via ${platform}.` });
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

          <div className="grid grid-cols-3 gap-4 text-center">
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
              <div className="flex justify-center gap-4">
                  <Button variant="outline" size="lg" className="flex-1 sm:flex-initial sm:w-32" onClick={() => handleShare('WhatsApp')}><WhatsAppIcon /> <span className="ml-2">WhatsApp</span></Button>
                  <Button variant="outline" size="lg" className="flex-1 sm:flex-initial sm:w-32" onClick={() => handleShare('SMS')}><SmsIcon /> <span className="ml-2">SMS</span></Button>
                  <Button variant="outline" size="lg" className="flex-1 sm:flex-initial sm:w-32" onClick={() => handleShare('Email')}><EmailIcon /> <span className="ml-2">Email</span></Button>
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
