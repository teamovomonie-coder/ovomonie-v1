"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface FeedbackItem {
  id: string;
  type: string;
  message: string;
  status: string;
  created_at: string;
}

export default function FeedbackPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [feedbackType, setFeedbackType] = useState("suggestion");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousFeedback, setPreviousFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreviousFeedback();
  }, []);

  const loadPreviousFeedback = async () => {
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const response = await fetch('/api/feedback', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreviousFeedback(data.feedback || []);
      }
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter your feedback" });
      return;
    }

    if (feedback.trim().length < 10) {
      toast({ variant: "destructive", title: "Error", description: "Feedback must be at least 10 characters" });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type: feedbackType, message: feedback })
      });

      const result = await response.json();
      
      if (response.ok) {
        toast({ title: "Thank You!", description: "Your feedback has been submitted successfully." });
        setFeedback("");
        loadPreviousFeedback(); // Reload feedback list
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message || "Failed to submit feedback" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to submit feedback" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'suggestion': return <Icons.Lightbulb className="h-4 w-4" />;
      case 'bug': return <Icons.Bug className="h-4 w-4" />;
      case 'complaint': return <Icons.AlertCircle className="h-4 w-4" />;
      case 'praise': return <Icons.Heart className="h-4 w-4" />;
      default: return <Icons.MessageCircle className="h-4 w-4" />;
    }
  };

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Feedback & Suggestions</h1>
        </div>

        <div className="space-y-4 max-w-2xl">
          <Card className="rounded-3xl border-none bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Share Your Thoughts</CardTitle>
              <CardDescription className="text-sm">Help us improve Ovomonie with your feedback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Feedback Type</Label>
                <RadioGroup value={feedbackType} onValueChange={setFeedbackType}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="suggestion" id="suggestion" />
                    <Label htmlFor="suggestion" className="flex items-center gap-2 cursor-pointer">
                      <Icons.Lightbulb className="h-4 w-4 text-primary" />
                      Suggestion
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="bug" id="bug" />
                    <Label htmlFor="bug" className="flex items-center gap-2 cursor-pointer">
                      <Icons.Bug className="h-4 w-4 text-primary" />
                      Bug Report
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="complaint" id="complaint" />
                    <Label htmlFor="complaint" className="flex items-center gap-2 cursor-pointer">
                      <Icons.AlertCircle className="h-4 w-4 text-primary" />
                      Complaint
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="praise" id="praise" />
                    <Label htmlFor="praise" className="flex items-center gap-2 cursor-pointer">
                      <Icons.Heart className="h-4 w-4 text-primary" />
                      Praise
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Your Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Tell us what you think..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={6}
                />
              </div>

              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Icons.Send className="mr-2 h-4 w-4" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {previousFeedback.length > 0 && (
            <Card className="rounded-3xl border-none bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Your Previous Feedback</CardTitle>
                <CardDescription className="text-sm">Track the status of your submitted feedback</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Icons.Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  previousFeedback.map((item) => (
                    <div key={item.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <span className="text-sm font-medium capitalize">{item.type}</span>
                        </div>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          <Card className="rounded-3xl border-none bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Other Ways to Reach Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <Icons.Mail className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium">Email Support</p>
                  <p className="text-sm text-muted-foreground">support@ovomonie.com</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <Icons.Phone className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium">Call Us</p>
                  <p className="text-sm text-muted-foreground">+234 800 000 0000</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <Icons.MessageCircle className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium">Live Chat</p>
                  <p className="text-sm text-muted-foreground">Available 24/7</p>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
