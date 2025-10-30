
"use client";

import { useState, useRef, useCallback, ChangeEvent, DragEvent, useEffect } from 'react';
import Image from 'next/image';
import { UploadCloud, Sparkles, Frown, Loader2, Camera, Zap, Cookie } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { checkForSweetTreat } from '@/app/actions';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const subtitlesData = [
  { text: "Oh, what do we have here?", duration: 2000 },
  { text: "My sensors are tingling...", duration: 2000 },
  { text: "It's... it's beautiful!", duration: 3000 },
  { text: "A masterpiece of confectionery art!", duration: 3000 },
  { text: "The sugar levels are off the charts!", duration: 3000 },
  { text: "This is definitely a sweet treat!", duration: 4000 },
];

export function SweetSpotterUI() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ isSweetTreat: boolean } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isAwaitingResult, setIsAwaitingResult] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isAwaitingResult) {
      let currentTimeout: NodeJS.Timeout;
      let delay = 0;
      
      subtitlesData.forEach((subtitle, index) => {
        delay += subtitle.duration;
        currentTimeout = setTimeout(() => {
          setCurrentSubtitle(subtitle.text);
        }, delay - subtitle.duration);
      });

      return () => clearTimeout(currentTimeout);
    } else {
        setCurrentSubtitle('');
    }
  }, [isAwaitingResult]);

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

  const playFailSound = useCallback(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/fail.mp3');
      audio.play().catch(error => console.error("Failed to play audio:", error));
    }
  }, []);

  const runAnalysis = async (dataUrl: string) => {
    setIsLoading(true);
    setResult(null);
    setImagePreview(dataUrl);

    const response = await checkForSweetTreat(dataUrl);
    setIsLoading(false);

    if ('error' in response) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: response.error,
      });
      setResult(null);
    } else {
      if (response.isSweetTreat) {
        playSuccessSound();
        setIsAwaitingResult(true);
        setTimeout(() => {
          setResult(response);
          setIsAwaitingResult(false);
        }, 17000);
      } else {
        setResult(response);
        playFailSound();
      }
    }
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
    setIsAwaitingResult(false);
    setCurrentSubtitle('');
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
  };
  
  const renderInitialState = () => (
    <div className="space-y-4">
        <Button variant="default" className="w-full h-20 text-lg font-bold" onClick={() => setIsCameraOpen(true)}>
            <Camera className="mr-2" />
            Use your camera
        </Button>
        <div className="flex items-center space-x-2">
            <div className="flex-1 border-t border-input" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="flex-1 border-t border-input" />
        </div>
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

  const renderAnalysisState = () => (
    <div className="space-y-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
        {imagePreview && (
          <Image
            src={imagePreview}
            alt="Uploaded treat"
            fill
            className="object-contain"
          />
        )}
        
        <div className="absolute inset-0 flex items-center justify-center">
            {isLoading && (
              <div className="flex flex-col items-center gap-2 text-white bg-black/50 p-4 rounded-lg animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p>Analyzing...</p>
              </div>
            )}
            {isAwaitingResult && (
              <div className="flex flex-col items-center justify-between p-4 h-full">
                <div className="flex-grow flex items-center justify-center">
                    <Cookie className="w-12 h-12 animate-spin text-primary" />
                </div>
                {currentSubtitle && (
                    <p className="text-lg text-white font-semibold bg-black/50 p-2 rounded-md text-center">
                        {currentSubtitle}
                    </p>
                )}
              </div>
            )}
            {!isLoading && !isAwaitingResult && result && (
              <div className="animate-sweet-appear text-center space-y-3 bg-black/60 backdrop-blur-sm p-6 rounded-lg">
                {result.isSweetTreat ? (
                  <>
                    <Sparkles className="w-12 h-12 text-chart-4 mx-auto" />
                    <p className="text-xl font-semibold text-white">it is, I knew it, it is a sweet treat! A GREAT SWEET TREAT</p>
                  </>
                ) : (
                  <>
                    <Frown className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-xl font-semibold text-slate-200">oh no sorry this is not a sweet treat!</p>
                  </>
                )}
              </div>
            )}
        </div>
      </div>
      
      {!isLoading && !isAwaitingResult && result && (
        <Button onClick={resetState} variant="outline" className="w-full h-auto py-3">
          <span className="text-center">
            {result.isSweetTreat ? (
                "nom nom nom let's find another!"
            ) : (
                <>
                click me to keep hunting for a<br />
                <strong className="font-bold">delicious sweet treat</strong>
                </>
            )}
          </span>
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-transparent p-8">
      <Card className="w-full max-w-md mx-auto shadow-2xl shadow-primary/10 relative overflow-hidden">
        <CardHeader className="text-center pt-8">
          <div className="flex justify-center items-center gap-2">
            <Cookie className="w-8 h-8 text-primary-foreground/70" />
            <CardTitle className="text-3xl font-bold text-primary-foreground tracking-tight">
              Is this a sweet treat?
            </CardTitle>
          </div>
          <CardDescription className="text-muted-foreground pt-2">
            Upload a photo to find out!
            <br />
            we recommend you have your phone volume turned up
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!imagePreview && !isCameraOpen && renderInitialState()}
          {!imagePreview && isCameraOpen && renderCameraState()}
          {imagePreview && renderAnalysisState()}
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground justify-center">
            <p>This crazy sweet AI prototype was imagined and prompted by disco-stu</p>
        </CardFooter>
      </Card>
    </div>
  );
}

    