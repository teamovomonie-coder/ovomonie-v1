"use client";

import { useEffect, useState } from 'react';
import { getPersonalizedRecommendations } from '@/ai/flows/personalized-recommendations';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb } from 'lucide-react';

export function Recommendations() {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const result = await getPersonalizedRecommendations({
          userId: 'user-123',
          recentTransactions: 'Frequent small savings, utility bills, subscription services',
          financialGoals: 'Save for a new car, build emergency fund',
        });
        setRecommendations(result.recommendations);
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalized Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-3/5" />
            </div>
             <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start text-sm">
                <Lightbulb className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-accent" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
