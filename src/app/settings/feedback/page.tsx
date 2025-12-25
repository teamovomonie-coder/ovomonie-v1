"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function FeedbackPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [feedbackType, setFeedbackType] = useState("suggestion");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter your feedback" });
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      toast({ title: "Thank You!", description: "Your feedback has been submitted successfully." });
      setFeedback("");
      setIsSubmitting(false);
    }, 1000);
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
