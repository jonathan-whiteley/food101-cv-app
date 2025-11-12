import React, { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  previewUrl?: string;
}

export function ImageUpload({ onImageSelect, previewUrl }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
    }
  }, [onImageSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  }, [onImageSelect]);

  return (
    <Card
      className={`p-8 border-2 border-dashed transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {previewUrl ? (
        <div className="space-y-4">
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-96 mx-auto rounded-lg shadow-md"
          />
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => document.getElementById('file-input')?.click()}>
              Change Image
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
          <div>
            <p className="text-lg font-medium">Drop your food image here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
          </div>
          <Button onClick={() => document.getElementById('file-input')?.click()}>
            Select Image
          </Button>
        </div>
      )}
      <input
        id="file-input"
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileInput}
        className="hidden"
      />
    </Card>
  );
}
