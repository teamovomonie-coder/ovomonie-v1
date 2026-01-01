"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Shield, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface RiskAssessmentProps {
  onComplete: (profile: RiskProfile) => void;
  onSkip: () => void;
}

interface RiskProfile {
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
  investment_experience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  investment_horizon: number;
  income_stability: 'stable' | 'variable' | 'irregular';
  age_group: string;
  financial_goals: string[];
  risk_score: number;
}

const questions = [
  {
    id: 'age',
    title: 'What is your age group?',
    type: 'radio',
    options: [
      { value: '18-25', label: '18-25 years', score: 5 },
      { value: '26-35', label: '26-35 years', score: 4 },
      { value: '36-45', label: '36-45 years', score: 3 },
      { value: '46-55', label: '46-55 years', score: 2 },
      { value: '56-65', label: '56-65 years', score: 1 },
      { value: '65+', label: '65+ years', score: 0 }
    ]
  },
  {
    id: 'experience',
    title: 'What is your investment experience?',
    type: 'radio',
    options: [
      { value: 'beginner', label: 'Beginner - I have little to no investment experience', score: 1 },
      { value: 'intermediate', label: 'Intermediate - I have some investment experience', score: 2 },
      { value: 'advanced', label: 'Advanced - I have significant investment experience', score: 3 },
      { value: 'expert', label: 'Expert - I am very experienced with investments', score: 4 }
    ]
  },
  {
    id: 'horizon',
    title: 'What is your investment time horizon?',
    type: 'radio',
    options: [
      { value: '1', label: 'Less than 1 year', score: 1 },
      { value: '3', label: '1-3 years', score: 2 },
      { value: '5', label: '3-5 years', score: 3 },
      { value: '10', label: '5-10 years', score: 4 },
      { value: '15', label: 'More than 10 years', score: 5 }
    ]
  },
  {
    id: 'income',
    title: 'How would you describe your income stability?',
    type: 'radio',
    options: [
      { value: 'stable', label: 'Very stable - Regular salary with job security', score: 3 },
      { value: 'variable', label: 'Variable - Commission-based or seasonal income', score: 2 },
      { value: 'irregular', label: 'Irregular - Freelance or unpredictable income', score: 1 }
    ]
  },
  {
    id: 'risk_comfort',
    title: 'How comfortable are you with investment risk?',
    type: 'radio',
    options: [
      { value: 'very_low', label: 'Very low - I prefer guaranteed returns', score: 1 },
      { value: 'low', label: 'Low - I can accept small fluctuations', score: 2 },
      { value: 'moderate', label: 'Moderate - I can accept moderate fluctuations', score: 3 },
      { value: 'high', label: 'High - I can accept significant fluctuations', score: 4 },
      { value: 'very_high', label: 'Very high - I seek maximum returns despite risk', score: 5 }
    ]
  },
  {
    id: 'loss_reaction',
    title: 'If your investment lost 20% in a month, what would you do?',
    type: 'radio',
    options: [
      { value: 'sell_all', label: 'Sell everything immediately', score: 1 },
      { value: 'sell_some', label: 'Sell some to reduce risk', score: 2 },
      { value: 'hold', label: 'Hold and wait for recovery', score: 3 },
      { value: 'buy_more', label: 'Buy more at the lower price', score: 4 }
    ]
  },
  {
    id: 'goals',
    title: 'What are your primary financial goals? (Select all that apply)',
    type: 'checkbox',
    options: [
      { value: 'retirement', label: 'Retirement planning' },
      { value: 'education', label: 'Education funding' },
      { value: 'house', label: 'Home purchase' },
      { value: 'emergency', label: 'Emergency fund' },
      { value: 'vacation', label: 'Vacation/Travel' },
      { value: 'business', label: 'Business investment' },
      { value: 'wealth', label: 'Wealth accumulation' },
      { value: 'other', label: 'Other goals' }
    ]
  }
];

export function RiskAssessment({ onComplete, onSkip }: RiskAssessmentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isCompleting, setIsCompleting] = useState(false);
  const { toast } = useToast();

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    const question = questions[currentQuestion];
    if (!answers[question.id] || (Array.isArray(answers[question.id]) && answers[question.id].length === 0)) {
      toast({
        variant: 'destructive',
        title: 'Please answer the question',
        description: 'You must provide an answer before proceeding.'
      });
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      completeAssessment();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateRiskProfile = (): RiskProfile => {
    let totalScore = 0;
    let maxScore = 0;

    // Calculate risk score from answers
    questions.forEach(question => {
      if (question.type === 'radio' && answers[question.id]) {
        const option = question.options.find(opt => opt.value === answers[question.id]);
        if (option && 'score' in option) {
          totalScore += option.score;
          maxScore += Math.max(...question.options.filter(opt => 'score' in opt).map(opt => opt.score));
        }
      }
    });

    const riskScore = Math.round((totalScore / maxScore) * 100);

    // Determine risk tolerance
    let risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
    if (riskScore <= 40) {
      risk_tolerance = 'conservative';
    } else if (riskScore <= 70) {
      risk_tolerance = 'moderate';
    } else {
      risk_tolerance = 'aggressive';
    }

    return {
      risk_tolerance,
      investment_experience: answers.experience || 'beginner',
      investment_horizon: parseInt(answers.horizon) || 1,
      income_stability: answers.income || 'stable',
      age_group: answers.age || '26-35',
      financial_goals: answers.goals || [],
      risk_score: riskScore
    };
  };

  const completeAssessment = async () => {
    setIsCompleting(true);
    try {
      const profile = calculateRiskProfile();
      
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch('/api/wealth/investments?action=create-risk-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        throw new Error('Failed to save risk profile');
      }

      toast({
        title: 'Risk Assessment Complete',
        description: `Your risk profile has been set to ${profile.risk_tolerance}.`
      });

      onComplete(profile);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to complete assessment',
        description: 'Please try again later.'
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Investment Risk Assessment</CardTitle>
          <CardDescription>
            Help us understand your investment preferences to provide personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{question.title}</h3>

            {question.type === 'radio' && (
              <RadioGroup
                value={answers[question.id] || ''}
                onValueChange={(value) => handleAnswer(question.id, value)}
                className="space-y-3"
              >
                {question.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {question.type === 'checkbox' && (
              <div className="space-y-3">
                {question.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={(answers[question.id] || []).includes(option.value)}
                      onCheckedChange={(checked) => {
                        const currentValues = answers[question.id] || [];
                        if (checked) {
                          handleAnswer(question.id, [...currentValues, option.value]);
                        } else {
                          handleAnswer(question.id, currentValues.filter((v: string) => v !== option.value));
                        }
                      }}
                    />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            
            <div className="flex space-x-2">
              <Button variant="ghost" onClick={onSkip}>
                Skip Assessment
              </Button>
              <Button
                onClick={handleNext}
                disabled={isCompleting}
              >
                {currentQuestion === questions.length - 1 ? 
                  (isCompleting ? 'Completing...' : 'Complete Assessment') : 
                  'Next'
                }
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Level Indicators */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center p-4">
          <Shield className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <h4 className="font-semibold text-green-600">Conservative</h4>
          <p className="text-xs text-muted-foreground">Low risk, stable returns</p>
        </Card>
        <Card className="text-center p-4">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
          <h4 className="font-semibold text-blue-600">Moderate</h4>
          <p className="text-xs text-muted-foreground">Balanced risk-return</p>
        </Card>
        <Card className="text-center p-4">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-orange-600" />
          <h4 className="font-semibold text-orange-600">Aggressive</h4>
          <p className="text-xs text-muted-foreground">High risk, high returns</p>
        </Card>
      </div>
    </div>
  );
}