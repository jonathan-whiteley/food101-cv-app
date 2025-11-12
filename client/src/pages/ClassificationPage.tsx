import React, { useState, useEffect } from 'react';
import { ImageUpload } from '@/components/ImageUpload';
import { ClassificationResults } from '@/components/ClassificationResults';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, ExternalLink, AlertCircle, Clock } from 'lucide-react';

interface ClassificationResult {
  top_prediction: string;
  top_score: number;
  prediction_set: string[];
  prediction_scores: number[];
  set_size: number;
}

export default function ClassificationPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string>('');
  const [showSlowWarning, setShowSlowWarning] = useState(false);

  // Show warning if classification takes more than 15 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isClassifying) {
      timer = setTimeout(() => {
        setShowSlowWarning(true);
      }, 15000);
    } else {
      setShowSlowWarning(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isClassifying]);

  const handleImageSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError('');
    setShowSlowWarning(false);
  };

  const handleClassify = async () => {
    if (!selectedFile) return;

    setIsClassifying(true);
    setError('');
    setShowSlowWarning(false);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/classify', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        // Check if response is JSON before trying to parse
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Classification failed');
        } else {
          // Server returned HTML error page (likely 500/502/504)
          if (response.status >= 500) {
            throw new Error('Model endpoint is starting up or unavailable');
          } else if (response.status === 404) {
            throw new Error('Classification endpoint not found');
          } else {
            throw new Error(`Server error (${response.status})`);
          }
        }
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      // Handle both API errors and JSON parsing errors
      let errorMessage = 'An error occurred';

      if (err instanceof Error) {
        if (err.message.includes('JSON')) {
          // JSON parsing error - likely HTML response from server
          errorMessage = 'Model endpoint is starting up or experiencing issues';
        } else {
          errorMessage = err.message;
        }
      }

      setError(`${errorMessage}. Please wait a few minutes and try again.`);
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:border-blue-800 dark:from-blue-950/30 dark:to-purple-950/30">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2">Food 101 Classifier</h1>
              <p className="text-muted-foreground">
                Upload a food image to classify it using conformal prediction
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Key Innovation Card */}
        <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:border-blue-800 dark:from-blue-950/30 dark:to-purple-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Adaptive Prediction Sets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Unlike traditional classifiers that output a single prediction, this model generates
              prediction sets that grow or shrink based on uncertainty. All predictions maintain a{' '}
              <span className="font-semibold text-blue-600">90% coverage guarantee</span>, while
              offering a model-agnostic, distribution-free way to communicate uncertainty to stakeholders.
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="text-xs mt-0.5">High-confidence</Badge>
                <span className="text-sm text-muted-foreground">
                  predictions yield 1-2 classes
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="text-xs mt-0.5">Lower-confidence</Badge>
                <span className="text-sm text-muted-foreground">
                  predictions return wider sets of 3-6 classes
                </span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <a
                href="https://github.com/jonathan-whiteley/food101-conformal-classifier"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                View the code on Github
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Upload Section */}
          <div className="space-y-4">
            <ImageUpload
              onImageSelect={handleImageSelect}
              previewUrl={previewUrl}
            />

            {selectedFile && !result && (
              <Button
                onClick={handleClassify}
                disabled={isClassifying}
                className="w-full"
                size="lg"
              >
                {isClassifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Classifying...
                  </>
                ) : (
                  'Classify Image'
                )}
              </Button>
            )}

            {showSlowWarning && isClassifying && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  The model endpoint can take a few minutes to spin up on first use.
                  Please wait while we process your image...
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Right: Results Section */}
          <div>
            {result ? (
              <ClassificationResults
                topPrediction={result.top_prediction}
                topScore={result.top_score}
                predictionSet={result.prediction_set}
                predictionScores={result.prediction_scores}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-center">
                  Upload an image and click classify to see results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
