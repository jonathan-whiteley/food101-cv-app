import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ClassificationResultsProps {
  topPrediction: string;
  topScore: number;
  predictionSet: string[];
  predictionScores: number[];
}

export function ClassificationResults({
  topPrediction,
  topScore,
  predictionSet,
  predictionScores
}: ClassificationResultsProps) {

  const getConfidenceColor = (score: number) => {
    if (score > 0.7) return 'bg-green-500';
    if (score > 0.4) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getConfidenceTextColor = (score: number) => {
    if (score > 0.7) return 'text-green-600';
    if (score > 0.4) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="space-y-6">
      {/* Top Prediction */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Top Prediction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-3xl font-bold capitalize">{topPrediction}</p>
            <p className={`text-xl font-semibold ${getConfidenceTextColor(topScore)}`}>
              {(topScore * 100).toFixed(1)}% confidence
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Prediction Set */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            Prediction Set ({predictionSet.length} possibilities)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictionSet.map((label, idx) => {
              const score = predictionScores[idx];
              const percentage = (score * 100).toFixed(1);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium capitalize">{label}</span>
                    <span className={`font-semibold ${getConfidenceTextColor(score)}`}>
                      {percentage}%
                    </span>
                  </div>
                  <Progress
                    value={score * 100}
                    className="h-2"
                    indicatorClassName={getConfidenceColor(score)}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
