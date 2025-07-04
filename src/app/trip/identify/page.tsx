'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { identifyPlace, type IdentifyPlaceOutput } from '@/ai/flows/identify-place-flow';
import { Loader2, Camera, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';

export default function PictureIdentificationPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<IdentifyPlaceOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error('Error accessing camera:', err);
          setHasCameraPermission(false);
          setError('Camera access was denied. Please enable camera permissions in your browser settings.');
        }
      } else {
        setHasCameraPermission(false);
        setError('Camera access is not supported by this browser.');
      }
    };
    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUri = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageDataUri);

    try {
      const result = await identifyPlace({ photoDataUri: imageDataUri });
      setAnalysisResult(result);
    } catch (err: any) {
      console.error('AI analysis failed:', err);
      setError('Failed to analyze the image. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: err.message || 'An unexpected error occurred during analysis.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setError(null);
  };
  
  const renderContent = () => {
    if (hasCameraPermission === null) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-muted-foreground">
          <Loader2 className="h-12 w-12 animate-spin" />
          <p>Requesting camera access...</p>
        </div>
      );
    }
    
    if (!hasCameraPermission) {
      return (
        <Alert variant="destructive" dir="rtl">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>שגיאת מצלמה</AlertTitle>
          <AlertDescription>{error || 'Unable to access camera.'}</AlertDescription>
        </Alert>
      );
    }
    
    return (
      <div>
        {/* Camera View: Hidden if an image is captured or results are shown */}
        <div className={`space-y-4 ${capturedImage || analysisResult ? 'hidden' : 'block'}`}>
          <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay muted playsInline />
          <Button onClick={handleCapture} className="w-full">
            <Camera />
            Take a Picture
          </Button>
          <canvas ref={canvasRef} className="hidden" />
        </div>
        
        {/* Loading View: Shown while AI is processing */}
        {isLoading && capturedImage && (
            <div className="relative">
              <Image src={capturedImage} alt="Captured site for analysis" width={600} height={400} className="rounded-md w-full h-auto blur-sm" />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-md">
                <Loader2 className="h-12 w-12 animate-spin text-white" />
                <p className="text-white mt-4 text-lg">מנתח את התמונה...</p>
              </div>
            </div>
        )}
        
        {/* Result View: Shown when analysis is complete */}
        {analysisResult && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">תוצאות הזיהוי</CardTitle>
              </CardHeader>
              <CardContent>
                {capturedImage && <Image src={capturedImage} alt="Captured site" width={600} height={400} className="rounded-md mb-4 w-full h-auto" />}
                <ScrollArea className="h-60 w-full rounded-md border p-4">
                   <p className="text-right whitespace-pre-wrap">{analysisResult.description}</p>
                </ScrollArea>
              </CardContent>
            </Card>
            <Button onClick={handleRetake} className="w-full">
              <RefreshCw />
              Retake Picture
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-4">
        <Button asChild variant="ghost">
          <Link href="/trip" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Trip Plan
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-right">זיהוי מקום לפי תמונה</CardTitle>
          <CardDescription className="text-right">
            צלם תמונה של אתר היסטורי או בניין כדי לקבל עליו מידע.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </main>
  );
}
