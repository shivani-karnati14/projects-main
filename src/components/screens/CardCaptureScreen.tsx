import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Check, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface CardCaptureScreenProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export function CardCaptureScreen({ onCapture, onCancel }: CardCaptureScreenProps) {
  const [captureMode, setCaptureMode] = useState<'camera' | 'upload'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [showShutterEffect, setShowShutterEffect] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileCapture(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileCapture(file);
    }
  };

  const handleFileCapture = async (file: File) => {
    setValidationError(null);
    setIsValidating(true);

    try {
      // COMMENTED OUT: Business card validation
      // const detectionService = CardDetectionService.getInstance();
      // const isValid = await detectionService.validateBusinessCard(file);
      
      // if (!isValid) {
      //   setValidationError('This doesn\'t appear to be a business card. Please upload a clear photo of a business card.');
      //   setIsValidating(false);
      //   return;
      // }

      // For now, accept all images without validation
      setCapturedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsValidating(false);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationError('Failed to validate image. Please try again.');
      setIsValidating(false);
    }
  };

  const startCamera = async () => {
    setIsCameraLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      console.log('✅ Camera access granted');
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('❌ Camera access denied:', err);
      alert('Unable to access camera. Please use file upload instead.');
      setCaptureMode('upload');
    } finally {
      setIsCameraLoading(false);
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current) {
      setValidationError(null);
      setIsValidating(true);

      // Show shutter effect
      setShowShutterEffect(true);
      setTimeout(() => setShowShutterEffect(false), 300);

      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], 'business-card.jpg', { type: 'image/jpeg' });
            
            try {
              // COMMENTED OUT: Business card validation
              // const detectionService = CardDetectionService.getInstance();
              // const isValid = await detectionService.validateBusinessCard(file);
              
              // if (!isValid) {
              //   setValidationError('No business card detected! Please position a business card within the frame and try again.');
              //   setIsValidating(false);
              //   return;
              // }

              // For now, accept all photos without validation
              setCapturedFile(file);
              setPreviewUrl(URL.createObjectURL(file));
              stopCamera();
              setIsValidating(false);
            } catch (error) {
              console.error('Validation error:', error);
              setValidationError('Failed to validate card. Please try again.');
              setIsValidating(false);
            }
          }
        }, 'image/jpeg');
      }
    }
  };

  const stopCamera = () => {
    console.log('🛑 Stopping camera...');
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('Track stopped:', track.kind);
        track.stop();
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleRetake = () => {
    setPreviewUrl(null);
    setCapturedFile(null);
    setValidationError(null);
    if (captureMode === 'camera') {
      startCamera();
    }
  };

  const handleProcess = () => {
    if (capturedFile) {
      onCapture(capturedFile);
    }
  };

  const handleCancelCapture = () => {
    stopCamera();
    onCancel();
  };

  // Effect to connect stream to video element
  useEffect(() => {
    if (stream && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = stream;
      console.log('📹 Video stream connected');
    }
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <Card>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-200">Capture Business Card</h2>
              <button
                onClick={handleCancelCapture}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Cancel"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Capture Mode Toggle */}
            {!previewUrl && (
              <div className="flex gap-3">
                <Button
                  variant={captureMode === 'upload' ? 'primary' : 'secondary'}
                  onClick={() => {
                    setCaptureMode('upload');
                    stopCamera();
                  }}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </Button>
                <Button
                  variant={captureMode === 'camera' ? 'primary' : 'secondary'}
                  onClick={() => {
                    setCaptureMode('camera');
                    startCamera();
                  }}
                  className="flex-1"
                >
                  <Camera className="w-4 h-4" />
                  Use Camera
                </Button>
              </div>
            )}

            {/* Capture Area */}
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden min-h-[400px] flex items-center justify-center">
              {/* Upload Mode */}
              {!previewUrl && captureMode === 'upload' && !isValidating && (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-slate-600 hover:border-cyan-500 transition-colors cursor-pointer p-8"
                >
                  <Upload className="w-16 h-16 text-slate-500 mb-4" />
                  <p className="text-slate-400 text-center">
                    Click to upload or drag and drop<br />
                    <span className="text-sm text-slate-500">Any image up to 10MB</span>
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}

              {/* Camera Mode - Loading */}
              {!previewUrl && captureMode === 'camera' && isCameraLoading && (
                <div className="flex flex-col items-center justify-center gap-4">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Camera className="w-16 h-16 text-cyan-400" />
                  </motion.div>
                  <p className="text-slate-400">Starting camera...</p>
                </div>
              )}

              {/* Camera Mode - Active */}
              {!previewUrl && captureMode === 'camera' && !isCameraLoading && stream && (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Camera Overlay Guides */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Corner guides */}
                    <div className="absolute top-4 left-4 w-12 h-12 border-l-4 border-t-4 border-cyan-400"></div>
                    <div className="absolute top-4 right-4 w-12 h-12 border-r-4 border-t-4 border-cyan-400"></div>
                    <div className="absolute bottom-4 left-4 w-12 h-12 border-l-4 border-b-4 border-cyan-400"></div>
                    <div className="absolute bottom-4 right-4 w-12 h-12 border-r-4 border-b-4 border-cyan-400"></div>
                    
                    {/* Center frame */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-[80%] h-[60%] border-2 border-cyan-400/50 rounded-2xl"></div>
                    </div>
                    
                    {/* Instruction text */}
                    <div className="absolute bottom-8 left-0 right-0 text-center">
                      <p className="text-white text-sm bg-black/50 inline-block px-4 py-2 rounded-full">
                        Position card within the frame
                      </p>
                    </div>
                  </div>

                  {/* Shutter Effect */}
                  <AnimatePresence>
                    {showShutterEffect && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-white pointer-events-none"
                      />
                    )}
                  </AnimatePresence>
                </>
              )}

              {/* Preview Mode */}
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Captured business card"
                  className="w-full h-full object-contain"
                />
              )}

              {/* Validating Overlay */}
              {isValidating && (
                <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-3"
                    />
                    <p className="text-slate-300">Validating...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Validation Error */}
            {validationError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 font-semibold mb-1">Validation Failed</p>
                  <p className="text-red-300 text-sm">{validationError}</p>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {previewUrl ? (
                <>
                  <Button variant="secondary" onClick={handleRetake} className="flex-1">
                    <X className="w-4 h-4" />
                    Retake
                  </Button>
                  <Button onClick={handleProcess} className="flex-1" disabled={isValidating}>
                    <Check className="w-4 h-4" />
                    Process Card
                  </Button>
                </>
              ) : captureMode === 'camera' && stream && !isCameraLoading && (
                <Button onClick={capturePhoto} className="w-full" disabled={isValidating}>
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
