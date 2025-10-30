"use client";

import { useState, useRef, useCallback, ChangeEvent, DragEvent } from 'react';
import Image from 'next/image';
import { UploadCloud, Sparkles, Frown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { checkForSweetTreat } from '@/app/actions';
import { cn } from '@/lib/utils';

export function SweetSpotterUI() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ isSweetTreat: boolean } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const playSuccessSound = useCallback(() => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);

      const now = audioContext.currentTime;
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
      oscillator.frequency.setValueAtTime(523.25, now); // C5
      
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.15);
      oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5

      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.25);
      oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
      
      gainNode.gain.linearRampToValueAtTime(0, now + 0.4);

      oscillator.start();
      oscillator.stop(now + 0.5);
    }
  }, []);

  const handleAnalysis = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid File',
        description: 'Please upload an image file.',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      
      const response = await checkForSweetTreat(dataUrl);
      
      if ('error' in response) {
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: response.error,
        });
        setResult(null);
      } else {
        setResult(response);
        if (response.isSweetTreat) {
          playSuccessSound();
        }
      }
      setIsLoading(false);
    };
    reader.onerror = () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to read the file.',
      });
      setIsLoading(false);
    };
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAnalysis(file);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleAnalysis(file);
    }
  };

  const handleDragEvents = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragOver(true);
    } else if (e.type === 'dragleave') {
      setIsDragOver(false);
    }
  };

  const resetState = () => {
    setImagePreview(null);
    setResult(null);
    setIsLoading(false);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl shadow-primary/10">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary-foreground tracking-tight">
            Is this a sweet treat?
          </CardTitle>
          <CardDescription className="text-muted-foreground pt-2">
            Upload a photo to find out!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!imagePreview && (
            <div
              className={cn(
                "relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200",
                isDragOver ? "border-primary bg-accent/20" : "border-input hover:border-primary/50"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragEnter={handleDragEvents}
              onDragLeave={handleDragEvents}
              onDragOver={handleDragEvents}
            >
              <UploadCloud className="w-12 h-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                <span className="font-semibold text-primary-foreground">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, etc.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
                disabled={isLoading}
              />
            </div>
          )}

          {imagePreview && (
            <div className="space-y-4">
                <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
                    <Image
                        src={imagePreview}
                        alt="Uploaded treat"
                        fill
                        className="object-contain"
                    />
                </div>
            </div>
          )}
          
          <div className="h-24 flex items-center justify-center">
            {isLoading && (
              <div className="flex flex-col items-center gap-2 text-muted-foreground animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p>Analyzing your image...</p>
              </div>
            )}
            {!isLoading && result && (
              <div className="animate-sweet-appear text-center space-y-3">
                {result.isSweetTreat ? (
                  <>
                    <Sparkles className="w-12 h-12 text-chart-4 mx-auto" />
                    <p className="text-xl font-semibold text-primary-foreground">Sweet treat detected!</p>
                  </>
                ) : (
                  <>
                    <Frown className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="text-xl font-semibold text-muted-foreground">No sweet treat found.</p>
                  </>
                )}
              </div>
            )}
          </div>
          
          {imagePreview && !isLoading && (
            <Button onClick={resetState} variant="outline" className="w-full">
              Check another image
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
