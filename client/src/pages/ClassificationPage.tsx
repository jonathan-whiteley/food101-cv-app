import React, { useState } from 'react';
import { ImageUpload } from '@/components/ImageUpload';
import { ClassificationResults } from '@/components/ClassificationResults';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

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

  const handleImageSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError('');
  };

  const handleClassify = async () => {
    if (!selectedFile) return;

    setIsClassifying(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/classify', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Classification failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Food 101 Classifier</h1>
          <p className="text-muted-foreground">
            Upload a food image to classify it using conformal prediction
          </p>
        </div>

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

            {error && (
              <Alert variant="destructive">
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
