
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Users, Award, Gift, Share2, Contact, Loader2, Star, Trophy, Medal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { LoyaltyPoints, Referral } from '@/types/features';

interface ReferralStats {
  invites: number;
  signups: number;
  earnings: number;
}

interface CombinedData {
  referrals: Referral[];
  loyalty: LoyaltyPoints | null;
  stats: ReferralStats;
}

export function InvitationDashboard() {
  const [referralCode, setReferralCode] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyPoints | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const { toast } = useToast();
  const { updateBalance, user, fetchUserData } = useAuth();
  const { addNotification } = useNotifications();

    // Resolve token and userId robustly and persist userId to localStorage when found
    const resolveAuth = async (): Promise<{ token: string | null; userId: string | null }> => {
        const token = localStorage.getItem('ovo-auth-token');
        let userId = localStorage.getItem('ovo-user-id');

        if (!userId && user?.userId) {
            userId = user.userId;
            localStorage.setItem('ovo-user-id', userId);
        }

        if (!userId && token) {
            try {
                const meRes = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
                if (meRes.ok) {
                    const meData = await meRes.json();
                    userId = meData?.id || meData?.userId || null;
                    if (userId) localStorage.setItem('ovo-user-id', userId);
                    if (!user) await fetchUserData();
                }
            } catch (e) {
                // ignore — caller will handle missing credentials
            }
        }

        return { token: token || null, userId: userId || null };
    };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('ovo-auth-token');
        let userId = localStorage.getItem('ovo-user-id');

        if (!userId && user?.userId) {
          userId = user.userId;
          localStorage.setItem('ovo-user-id', userId);
        }

        if (!token || !userId) throw new Error('Authentication failed.');

        // Fetch referrals data
        const referralsRes = await fetch('/api/referrals', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (referralsRes.ok) {
          const referralsData = await referralsRes.json();
          setReferrals(referralsData.referrals || []);
        }

        // Fetch loyalty data
        const loyaltyRes = await fetch('/api/loyalty', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (loyaltyRes.ok) {
          const loyaltyData = await loyaltyRes.json();
          setLoyalty(loyaltyData.loyalty);
        }

        // Generate referral code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        setReferralCode(code);
        
        // Set stats
        setStats({
          invites: referrals.length,
          signups: referrals.filter(r => r.status === 'completed').length,
          earnings: referrals.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.reward_amount, 0)
        });

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load data.'
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast, user, referrals.length]);

  const handleClaimReward = async () => {
    setIsClaiming(true);
    try {
      const { token, userId } = await resolveAuth();
      if (!token || !userId) throw new Error('Authentication failed.');

      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ referee_id: 'demo_user' })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to claim reward.');

      // Award loyalty points
      await fetch('/api/loyalty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ points: (loyalty?.points || 0) + 50 })
      });

      updateBalance((user?.balance || 0) + 50000);
      addNotification({
        title: 'Referral Reward Earned!',
        description: `You've received ₦500 and 50 loyalty points.`,
        category: 'transaction',
      });
      
      toast({ title: 'Reward Credited!', description: '₦500 and 50 points added to your account.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Claim Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsClaiming(false);
    }
  };

    const referralLink = 'https://ovomonie-v1-pgrm.vercel.app/register';

    const referralUrl = referralCode ? `${referralLink}?ref=${referralCode}` : referralLink;

    const saveReferralCode = async (newCode: string) => {
        try {
            const { token, userId } = await resolveAuth();
            if (!token || !userId) throw new Error('Authentication failed.');
            const res = await fetch('/api/invitations/code', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'x-ovo-user-id': userId,
                },
                body: JSON.stringify({ referralCode: newCode }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to update referral code');
            }
            setReferralCode(newCode);
            toast({ title: 'Saved', description: 'Referral code updated.' });
        } catch (err) {
            toast({ variant: 'destructive', title: 'Save failed', description: err instanceof Error ? err.message : 'Failed to save' });
        }
    };

    const fetchReferralCodeNow = async () => {
        try {
            const { token, userId } = await resolveAuth();
            if (!token || !userId) return;
            const res = await fetch('/api/invitations/stats', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'x-ovo-user-id': userId,
                },
            });
            if (!res.ok) return;
            const data = await res.json().catch(() => ({}));
            if (data?.referralCode) setReferralCode(data.referralCode);
        } catch (e) {
            // silent
        }
    };

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
    const message = `Hey! I use Ovomonie for secure digital banking. Sign up using my referral link and get rewarded: https://ovomonie-v1-pgrm.vercel.app/register`;

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
                    description: 'Hey! I use Ovomonie for secure digital banking. Sign up using my referral link and get rewarded: https://ovomonie-v1-pgrm.vercel.app/register' 
                });
                handleCopyToClipboard(message);
            }
        }
    } else {
        toast({
            title: "Feature Not Supported",
            description: "Hey! I use Ovomonie for secure digital banking. Sign up using my referral link and get rewarded: https://ovomonie-v1-pgrm.vercel.app/register",
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
                            <div className="w-full space-y-2">
                                <div className="flex w-full">
                                    <Input
                                        type="text"
                                        value={referralUrl}
                                        readOnly
                                        className="flex-1 rounded-r-none"
                                    />
                                    <Button onClick={() => handleCopyToClipboard(referralUrl)} className="rounded-l-none" aria-label="Copy referral link">
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 items-center">
                                    <div className="flex-1 w-full">
                                        <Input
                                            type="text"
                                            value={referralCode}
                                            onChange={(e) => setReferralCode(e.target.value)}
                                            onFocus={() => fetchReferralCodeNow()}
                                            placeholder="Your referral code"
                                            className="w-full"
                                        />
                                    </div>
                                    <Button onClick={() => saveReferralCode(referralCode || '')} disabled={!referralCode}>
                                        Save Code
                                    </Button>
                                </div>
                            </div>
                        )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                {isLoading ? (
                    <>
                        <Card><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
                        <Card><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
                        <Card><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
                        <Card><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
                    </>
                ) : (
                    <>
                <div className="bg-muted p-4 rounded-lg">
                    <Users className="mx-auto h-8 w-8 text-primary mb-2" />
                    <p className="text-2xl font-bold">{stats?.invites ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Invites Sent</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                    <Award className="mx-auto h-8 w-8 text-primary mb-2" />
                    <p className="text-2xl font-bold">{stats?.signups ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Successful Signups</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                    <div className="mx-auto h-8 w-8 flex items-center justify-center text-primary mb-2 font-bold text-xl">₦</div>
                    <p className="text-2xl font-bold">{stats?.earnings ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Rewards Earned</p>
                </div>
                <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-4 rounded-lg border border-purple-200">
                    <Star className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                    <p className="text-2xl font-bold text-purple-700">{loyalty?.points ?? 0}</p>
                    <p className="text-sm text-purple-600 font-medium capitalize">{loyalty?.tier ?? 'Bronze'} Tier</p>
                </div>
                </>
            )}
          </div>
          
          <div className="text-center space-y-2">
             <p className="text-sm font-medium text-muted-foreground">Share your link via</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4" style={{ width: 'calc(70% - 60px)', margin: '0 auto' }}>
                  <Button size="lg" className="flex-1" onClick={handleUniversalShare} disabled={isLoading} style={{ height: '52px' }}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <Share2 className="mr-2" style={{ height: '16px', width: '16px' }} />} Share Link
                  </Button>
                  <Button variant="secondary" size="lg" className="flex-1" onClick={handleShareToContact} disabled={isLoading} style={{ height: '52px', backgroundColor: 'rgba(0, 0, 0, 0.08)' }}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <Contact className="mr-2" style={{ height: '16px', width: '16px' }} />} Share to Contact
                  </Button>
              </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
              Recent Referrals
            </h3>
            <div className="space-y-3">
              {referrals.slice(0, 3).map((referral) => (
                <div key={referral.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Code: {referral.code}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      referral.status === 'completed' 
                        ? 'text-green-700 bg-green-100' 
                        : 'text-yellow-700 bg-yellow-100'
                    }`}>
                      {referral.status}
                    </span>
                    <p className="text-sm text-muted-foreground mt-1">
                      ₦{referral.reward_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {referrals.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Medal className="mx-auto h-12 w-12 mb-2" />
                  <p>No referrals yet. Start inviting friends!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <p className="text-xs text-muted-foreground text-center w-full">
          Rewards are credited to your wallet after your friend completes their first transaction of ₦1,000 or more. Terms &amp; Conditions apply.
        </p>
        <Button variant="outline" size="sm" onClick={handleClaimReward} disabled={isLoading || isClaiming}>
            {isClaiming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Receive ₦500 + 50 Points
        </Button>
        <p className="text-xs text-muted-foreground text-center w-full mt-2">
          Powered by Ovomonie
        </p>
      </CardFooter>
    </Card>
  );
}
