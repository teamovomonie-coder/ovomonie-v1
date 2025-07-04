"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Users, Award, Gift, Share2, Contact, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';

interface ReferralStats {
  invites: number;
  signups: number;
  earnings: number;
}

export function InvitationDashboard() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { balance, updateBalance } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    const fetchReferralData = async () => {
        try {
            const response = await fetch('/api/invitations/stats');
            if (!response.ok) {
                throw new Error('Failed to fetch referral data');
            }
            const data = await response.json();
            setReferralCode(data.referralCode);
            setStats(data.stats);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not load your referral information.',
            });
        } finally {
            setIsLoading(false);
        }
    };
    fetchReferralData();
  }, [toast]);

  const handleReceiveReward = () => {
      if (balance === null || !stats) return;
      const rewardAmount = 500;
      const newBalance = balance + (rewardAmount * 100);
      updateBalance(newBalance);

      addNotification({
          title: "Referral Reward Earned!",
          description: `You've received ₦${rewardAmount} for a successful referral.`,
          category: 'transaction',
      });

      setStats(prevStats => ({
          ...(prevStats!),
          signups: prevStats!.signups + 1,
          earnings: prevStats!.earnings + rewardAmount,
      }));

      toast({
          title: "Reward Credited!",
          description: `₦${rewardAmount} has been added to your wallet.`,
      });
  };

  const referralLink = `https://ovomonie.ng/signup?ref=${referralCode || ''}`;

  const handleCopyToClipboard = (message?: string) => {
    if (!referralCode) return;
    const textToCopy = message || referralLink;
    navigator.clipboard.writeText(textToCopy);
    toast({ 
        title: 'Copied to Clipboard!', 
        description: message ? 'Your message has been copied.' : 'Your referral link has been copied.'
    });
  };

  const handleUniversalShare = async () => {
    if (!referralCode) return;
      const shareData = {
          title: 'Join Ovomonie',
          text: `Join Ovomonie and earn while you bank. Sign up with my link.`,
          url: referralLink,
      };
      if (navigator.share) {
          try {
              await navigator.share(shareData);
          } catch (err) {
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
           toast({
              title: 'Share Not Supported',
              description: 'Your browser does not support this feature. The link has been copied instead.',
            });
          handleCopyToClipboard();
      }
  };
  
  const handleShareToContact = async () => {
    if (!referralCode) return;
    const message = `Hey! I use Ovomonie for secure digital banking. Sign up using my referral link and get rewarded: ${referralLink}`;

    if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
        try {
            const contacts = await (navigator as any).contacts.select(['tel'], { multiple: true });
            
            if (contacts.length === 0) return;
            
            const phoneNumbers = contacts.map((contact: any) => contact.tel[0]).join(',');
            
            const smsLink = `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`;
            window.location.href = smsLink;

        } catch (error) {
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
            {isLoading ? (
                <Skeleton className="h-10 w-full" />
            ) : (
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
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            {isLoading ? (
                <>
                    <Card><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
                    <Card><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
                    <Card><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
                </>
            ) : (
                <>
                <div className="bg-muted p-4 rounded-lg">
                    <Users className="mx-auto h-8 w-8 text-primary mb-2" />
                    <p className="text-2xl font-bold">{stats?.invites || 0}</p>
                    <p className="text-sm text-muted-foreground">Invites Sent</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                    <Award className="mx-auto h-8 w-8 text-primary mb-2" />
                    <p className="text-2xl font-bold">{stats?.signups || 0}</p>
                    <p className="text-sm text-muted-foreground">Successful Signups</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                    <div className="mx-auto h-8 w-8 flex items-center justify-center text-primary mb-2 font-bold text-xl">₦</div>
                    <p className="text-2xl font-bold">{(stats?.earnings || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Rewards Earned</p>
                </div>
                </>
            )}
          </div>
          
          <div className="text-center space-y-2">
             <p className="text-sm font-medium text-muted-foreground">Share your link via</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button size="lg" className="flex-1" onClick={handleUniversalShare} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <Share2 className="mr-2 h-5 w-5" />} Share Link
                  </Button>
                  <Button variant="secondary" size="lg" className="flex-1" onClick={handleShareToContact} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <Contact className="mr-2 h-5 w-5" />} Share to Contact
                  </Button>
              </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <p className="text-xs text-muted-foreground text-center w-full">
          Rewards are credited to your wallet after your friend completes their first transaction of ₦1,000 or more. Terms & Conditions apply.
        </p>
        <Button variant="outline" size="sm" onClick={handleReceiveReward} disabled={isLoading}>Simulate Receiving a ₦500 Reward</Button>
      </CardFooter>
    </Card>
  );
}
