"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const securityQuestions = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What city were you born in?",
  "What was the name of your first school?",
  "What is your favorite food?",
  "What was your childhood nickname?",
  "What is the name of your favorite teacher?",
  "What was the make of your first car?",
  "What is your father's middle name?",
  "In what city did you meet your spouse?",
];

export default function SecurityQuestionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [question1, setQuestion1] = useState("");
  const [answer1, setAnswer1] = useState("");
  const [question2, setQuestion2] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [question3, setQuestion3] = useState("");
  const [answer3, setAnswer3] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!question1 || !answer1 || !question2 || !answer2 || !question3 || !answer3) {
      toast({ variant: "destructive", title: "Error", description: "Please answer all security questions" });
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast({ title: "Success", description: "Security questions have been saved successfully" });
      setIsLoading(false);
    }, 1000);
  };

  const handleReset = () => {
    setQuestion1("");
    setAnswer1("");
    setQuestion2("");
    setAnswer2("");
    setQuestion3("");
    setAnswer3("");
    toast({ title: "Reset", description: "Security questions have been cleared" });
  };

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Security Questions</h1>
        </div>

        <div className="space-y-4 max-w-2xl">
          <Card className="rounded-3xl border-none bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Set Security Questions</CardTitle>
              <CardDescription className="text-sm">
                These questions will help verify your identity if you forget your password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Question 1</Label>
                <Select value={question1} onValueChange={setQuestion1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a security question" />
                  </SelectTrigger>
                  <SelectContent>
                    {securityQuestions.map((q, i) => (
                      <SelectItem key={i} value={q}>{q}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {question1 && (
                  <Input
                    type="text"
                    placeholder="Your answer"
                    value={answer1}
                    onChange={(e) => setAnswer1(e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-3">
                <Label>Question 2</Label>
                <Select value={question2} onValueChange={setQuestion2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a security question" />
                  </SelectTrigger>
                  <SelectContent>
                    {securityQuestions.map((q, i) => (
                      <SelectItem key={i} value={q}>{q}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {question2 && (
                  <Input
                    type="text"
                    placeholder="Your answer"
                    value={answer2}
                    onChange={(e) => setAnswer2(e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-3">
                <Label>Question 3</Label>
                <Select value={question3} onValueChange={setQuestion3}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a security question" />
                  </SelectTrigger>
                  <SelectContent>
                    {securityQuestions.map((q, i) => (
                      <SelectItem key={i} value={q}>{q}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {question3 && (
                  <Input
                    type="text"
                    placeholder="Your answer"
                    value={answer3}
                    onChange={(e) => setAnswer3(e.target.value)}
                  />
                )}
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icons.Save className="mr-2 h-4 w-4" />
                      Save Questions
                    </>
                  )}
                </Button>
                <Button onClick={handleReset} variant="outline">
                  <Icons.RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
