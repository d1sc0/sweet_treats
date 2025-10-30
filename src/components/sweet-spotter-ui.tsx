"use client";

import { useState, useRef, useCallback, ChangeEvent, DragEvent, useEffect } from 'react';
import Image from 'next/image';
import { UploadCloud, Sparkles, Frown, Loader2, Camera, Circle, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { checkForSweetTreat } from '@/app/actions';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export function SweetSpotterUI() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ isSweetTreat: boolean } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isCameraOpen) {
      const getCameraPermission = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('Camera API not available in this browser.');
            setHasCameraPermission(false);
            toast({
              variant: 'destructive',
              title: 'Camera Not Supported',
              description: 'Your browser does not support camera access.',
            });
            return;
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
  
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use this feature.',
          });
        }
      };
  
      getCameraPermission();

      return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
      }
    }
  }, [isCameraOpen, toast]);

  const playSuccessSound = useCallback(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/success.m4a');
      audio.play().catch(error => console.error("Failed to play audio:", error));
    }
  }, []);

  const runAnalysis = async (dataUrl: string) => {
    setIsLoading(true);
    setResult(null);
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
  }

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setIsCameraOpen(false);
            runAnalysis(dataUrl);
        }
    }
  }

  const handleAnalysis = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid File',
        description: 'Please upload an image file.',
      });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      runAnalysis(dataUrl);
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
    setIsCameraOpen(false);
    setHasCameraPermission(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
  };
  
  const renderInitialState = () => (
    <div className="space-y-4">
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
        <div className="flex items-center space-x-2">
            <div className="flex-1 border-t border-input" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="flex-1 border-t border-input" />
        </div>
        <Button variant="outline" className="w-full" onClick={() => setIsCameraOpen(true)}>
            <Camera className="mr-2" />
            Use your camera
        </Button>
    </div>
  );

  const renderCameraState = () => (
    <div className="space-y-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
        </div>
        {hasCameraPermission === false && (
            <Alert variant="destructive">
                <AlertTitle>Camera Access Denied</AlertTitle>
                <AlertDescription>
                    Please allow camera access in your browser settings to use this feature. You may need to refresh the page after granting permission.
                </AlertDescription>
            </Alert>
        )}
        <Button onClick={handleCapture} disabled={!hasCameraPermission || isLoading} className="w-full">
            <Zap className="mr-2"/>
            Analyze Photo
        </Button>
        <Button onClick={resetState} variant="outline" className="w-full">
              Cancel
        </Button>
    </div>
  );

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
          {!imagePreview && !isCameraOpen && renderInitialState()}
          {!imagePreview && isCameraOpen && renderCameraState()}

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
