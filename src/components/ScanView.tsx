import { useState, useEffect, useRef } from 'react';
import { QrCode, FileText, Nfc, Camera, X, ExternalLink } from 'lucide-react';
import { qrDetectionService } from '../services/qrDetection';
import { DatabaseService } from '../lib/supabase'; 

type ScanMode = 'qr' | 'nfc' | 'text' | null;

function ScanView() {
  const [scanMode, setScanMode] = useState<ScanMode>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('Idle');
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [enrichResults, setEnrichResults] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<any>(null);

  // ---- Camera Setup ----
  useEffect(() => {
    if (isScanning && (scanMode === 'qr' || scanMode === 'text')) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isScanning, scanMode]);

  // Clear captured image when scan mode changes
  useEffect(() => {
    setCapturedImageUrl(null);
    setStatus('Idle');
  }, [scanMode]);

  const startCamera = async () => {
    setStatus('Requesting camera access...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus('Camera ready. Position your business card and click "Capture Image".');
      }
    } catch (error) {
      console.error('Camera Error:', error);
      setStatus('Error accessing camera.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    
    // Clean up captured image URL to prevent memory leaks
    if (capturedImageUrl) {
      URL.revokeObjectURL(capturedImageUrl);
    }
  };

  // Helper function to convert Blob to ImageData
  const blobToImageData = async (blob: Blob): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setStatus('Camera not ready');
      return;
    }

    setIsProcessing(true);
    setStatus('Capturing image...');

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0);
      
      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setStatus('Failed to capture image');
          setIsProcessing(false);
          return;
        }

        // Show captured image
        const url = URL.createObjectURL(blob);
        setCapturedImageUrl(url);
        
        // Process the image with both QR detection and AI OCR
        await processImageWithQRDetection(blob);
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      console.error('Capture error:', error);
      setStatus('Capture failed: ' + (error instanceof Error ? error.message : String(error)));
      setIsProcessing(false);
    }
  };

  

  // New function that combines QR detection with AI business card processing
  const processImageWithQRDetection = async (blob: Blob) => {
    setStatus('🔍 Step 1/2: Detecting QR codes with enhanced algorithms...');
    
    let qrCodes: any[] = [];
    let parsedQRCodes: any[] = [];
    
    try {
      // First, try to detect QR codes using the enhanced detection service
      const imageData = await blobToImageData(blob);
      qrCodes = await qrDetectionService.detectQRCodes(imageData);
      
      if (qrCodes.length > 0) {
        // Parse QR codes
        parsedQRCodes = qrCodes.map(qr => ({
          ...qr,
          parsed: qrDetectionService.parseQRContent(qr.data)
        }));
        
        console.log(`✅ QR codes detected: ${qrCodes.length}`, parsedQRCodes);
        setStatus(`✅ Found ${qrCodes.length} QR code(s)!\n\n🤖 Step 2/2: Analyzing with AI Vision...`);
      } else {
        console.log('❌ No QR codes detected with frontend detection');
        setStatus('📱 No QR codes detected by frontend.\n\n🤖 Step 2/2: Analyzing with AI Vision...');
      }
    } catch (qrError) {
      console.warn('QR detection error (continuing with AI analysis):', qrError);
      setStatus('⚠️ QR detection had issues.\n\n🤖 Step 2/2: Analyzing with AI Vision...');
    }
    
    // Now send to AI business card endpoint
    try {
      const formData = new FormData();
      formData.append('file', blob, 'business_card.jpeg');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch('http://localhost:8000/ai-business-card', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('🔍 Backend AI response:', result);
      
      if (result.success) {
        const structuredInfo = result.structured_data || result.structuredInfo || {};
        
        // Merge frontend QR detection with backend QR detection
        const allQRCodes = [...parsedQRCodes];
        
        // Add backend QR codes if they exist and aren't duplicates
        if (result.qr_codes && Array.isArray(result.qr_codes)) {
          result.qr_codes.forEach((backendQR: any) => {
            const qrData = typeof backendQR === 'object' ? (backendQR.data || backendQR.text) : backendQR;
            const isDuplicate = allQRCodes.some(qr => qr.data === qrData);
            
            if (!isDuplicate && qrData) {
              allQRCodes.push({
                data: qrData,
                method: 'backend_ai',
                parsed: qrDetectionService.parseQRContent(qrData)
              });
            }
          });
        }
        
        // Format the display
        let displayText = '✅ AI Analysis Complete!\n\n';
        displayText += '📝 Extracted Information:\n\n';
        
        if (structuredInfo.name) displayText += `👤 Name: ${structuredInfo.name}\n`;
        if (structuredInfo.title) displayText += `💼 Title: ${structuredInfo.title}\n`;
        if (structuredInfo.company) displayText += `🏢 Company: ${structuredInfo.company}\n`;
        if (structuredInfo.email) displayText += `📧 Email: ${structuredInfo.email}\n`;
        if (structuredInfo.phone) displayText += `📱 Phone: ${structuredInfo.phone}\n`;
        if (structuredInfo.website) displayText += `🌐 Website: ${structuredInfo.website}\n`;
        if (structuredInfo.address) displayText += `📍 Address: ${structuredInfo.address}\n`;
        
        // Enhanced QR code display
        if (allQRCodes.length > 0) {
          displayText += `\n📱 QR Codes Found: ${allQRCodes.length}\n`;
          allQRCodes.forEach((qr: any, idx: number) => {
            displayText += `\n  QR ${idx + 1}:\n`;
            displayText += `    Data: ${qr.data}\n`;
            displayText += `    Method: ${qr.method}\n`;
            
            if (qr.parsed && qr.parsed.title) {
              displayText += `    Type: ${qr.parsed.title}\n`;
              
              if (qr.parsed.details && Object.keys(qr.parsed.details).length > 0) {
                displayText += `    Details:\n`;
                Object.entries(qr.parsed.details).forEach(([key, value]) => {
                  displayText += `      ${key}: ${value}\n`;
                });
              }
            }
          });
        } else {
          displayText += `\n📱 No QR Codes Found\n`;
        }
        
        displayText += `\n🎯 Confidence: ${((result.confidence || 0) * 100).toFixed(1)}%`;
        
        setStatus(displayText);
        
        // Store enriched results for display
        setEnrichResults({
          structured_data: structuredInfo,
          qr_codes: allQRCodes, // Use merged QR codes
          qr_count: allQRCodes.length,
          confidence: result.confidence || 0,
          company_info: {
            name: structuredInfo.company,
            website: structuredInfo.website
          },
          linkedin_profiles: [],
          meta: {
            elapsed_seconds: 0,
            linkedin_profiles_found: 0
          }
        });
        
        setIsProcessing(false);
      } else {
        setStatus('❌ AI analysis failed: ' + (result.error || 'Unknown error'));
        setIsProcessing(false);
      }
      
    } catch (error) {
      console.error('AI Vision API error:', error);
      let errorMessage = 'AI Vision API failed';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Processing timed out. Please try with a smaller image.';
        } else {
          errorMessage = error.message;
        }
      }
      setStatus('❌ ' + errorMessage);
      setIsProcessing(false);
    }
  };

  // Keep original processImage for text mode
  const processImage = async (blob: Blob) => {
    setStatus('Sending to AI Vision API...');
    
    try {
      const formData = new FormData();
      formData.append('file', blob, 'business_card.jpeg');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch('http://localhost:8000/ai-business-card', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('🔍 Backend response:', result);
      
      if (result.success) {
        const structuredInfo = result.structured_data || result.structuredInfo || {};
        
        let displayText = '✅ AI Analysis Complete!\n\n';
        displayText += '📝 Extracted Information:\n\n';
        
        if (structuredInfo.name) displayText += `👤 Name: ${structuredInfo.name}\n`;
        if (structuredInfo.title) displayText += `💼 Title: ${structuredInfo.title}\n`;
        if (structuredInfo.company) displayText += `🏢 Company: ${structuredInfo.company}\n`;
        if (structuredInfo.email) displayText += `📧 Email: ${structuredInfo.email}\n`;
        if (structuredInfo.phone) displayText += `📱 Phone: ${structuredInfo.phone}\n`;
        if (structuredInfo.website) displayText += `🌐 Website: ${structuredInfo.website}\n`;
        if (structuredInfo.address) displayText += `📍 Address: ${structuredInfo.address}\n`;
        
        if (result.qr_codes && Array.isArray(result.qr_codes) && result.qr_codes.length > 0) {
          displayText += `\n📱 QR Codes Found: ${result.qr_count || result.qr_codes.length}\n`;
          result.qr_codes.forEach((qr: any, idx: number) => {
            const qrData = typeof qr === 'object' ? (qr.data || qr.text || 'No data') : qr;
            displayText += `  ${idx + 1}. ${qrData}\n`;
          });
        } else {
          displayText += `\n📱 No QR Codes Found\n`;
        }
        
        displayText += `\n🎯 Confidence: ${((result.confidence || 0) * 100).toFixed(1)}%`;
        
        setStatus(displayText);
        
        setEnrichResults({
          structured_data: structuredInfo,
          qr_codes: result.qr_codes || [],
          confidence: result.confidence || 0,
          company_info: {
            name: structuredInfo.company,
            website: structuredInfo.website
          },
          linkedin_profiles: [],
          meta: {
            elapsed_seconds: 0,
            linkedin_profiles_found: 0
          }
        });
        
        setIsProcessing(false);
      } else {
        setStatus('❌ AI analysis failed: ' + (result.error || 'Unknown error'));
        setIsProcessing(false);
      }
      
    } catch (error) {
      console.error('AI Vision API error:', error);
      let errorMessage = 'AI Vision API failed';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Processing timed out. Please try with a smaller image.';
        } else {
          errorMessage = error.message;
        }
      }
      setStatus('❌ ' + errorMessage);
      setIsProcessing(false);
    }
  };

  const sendToWebhook = async (imageBlob: Blob, text: string) => {
    const formData = new FormData();
    formData.append('ocr_image', imageBlob, 'ocr_capture.jpeg');
    formData.append('extracted_text', text);

    try {
      const res = await fetch(webhookUrl, { method: 'POST', body: formData });
      if (res.ok) {
        setStatus(`✅ Data sent successfully.`);
        setIsProcessing(false);
      } else {
        setStatus(`❌ Webhook error: ${res.status}`);
        setIsProcessing(false);
      }
    } catch (e) {
      setStatus('Network error while posting data.');
      setIsProcessing(false);
    }
  };

  const constructCompanyURL = (platform: string, company: string) => {
    const cleanCompany = company.toLowerCase().replace(/\s+/g, '');
    
    switch (platform) {
      case 'linkedin':
        return `https://www.linkedin.com/company/${cleanCompany}`;
      case 'website':
        return `https://${cleanCompany}.com`;
      case 'crunchbase':
        return `https://crunchbase.com/organization/${cleanCompany}`;
      default:
        return `https://www.google.com/search?q=${encodeURIComponent(company)}`;
    }
  };

  const startScan = (mode: ScanMode) => {
    setCapturedImageUrl(null);
    setStatus('Starting scanner...');
    setScanMode(mode);
    setIsScanning(true);
    setEnrichResults(null);
  };

  const stopScan = () => {
    stopCamera();
    setCapturedImageUrl(null);
    setStatus('Idle');
    setIsProcessing(false);
    setIsScanning(false);
    setScanMode(null);
    setEnrichResults(null);
  };

  // Update the Text Scanner button click to use regular processImage
  const handleTextCapture = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setStatus('Camera not ready');
      return;
    }

    setIsProcessing(true);
    setStatus('Capturing image...');

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setStatus('Failed to capture image');
          setIsProcessing(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        setCapturedImageUrl(url);
        
        // For text mode, use regular processImage (no QR detection)
        await processImage(blob);
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      console.error('Capture error:', error);
      setStatus('Capture failed: ' + (error instanceof Error ? error.message : String(error)));
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 relative overflow-hidden">
      {/* ...existing JSX for background and header... */}
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-3xl"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="relative z-10 bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4 shadow-lg">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Scan Code</h2>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          {!isScanning ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {/* ...existing scan mode buttons... */}
              <button
                onClick={() => startScan('qr')}
                className="group relative bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl border border-slate-700/50 p-10 lg:p-12 transition-all hover:-translate-y-2 hover:bg-slate-800/80 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl group-hover:scale-110 transition-all duration-300 shadow-lg backdrop-blur-sm border border-green-400/30">
                    <QrCode className="w-12 h-12 text-green-400 drop-shadow-sm" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-slate-200 mb-2 drop-shadow-sm">
                      QR Code
                    </h3>
                    <p className="text-slate-400 text-sm drop-shadow-sm">
                      Scan QR codes with enhanced detection
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => startScan('nfc')}
                className="group relative bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl border border-slate-700/50 p-10 lg:p-12 transition-all hover:-translate-y-2 hover:bg-slate-800/80 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl group-hover:scale-110 transition-all duration-300 shadow-lg backdrop-blur-sm border border-blue-400/30">
                    <Nfc className="w-12 h-12 text-blue-400 drop-shadow-sm" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-slate-200 mb-2 drop-shadow-sm">
                      NFC Card
                    </h3>
                    <p className="text-slate-400 text-sm drop-shadow-sm">
                      Read NFC tags and cards
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => startScan('text')}
                className="group relative bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl border border-slate-700/50 p-10 lg:p-12 transition-all hover:-translate-y-2 hover:bg-slate-800/80 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="p-6 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-3xl group-hover:scale-110 transition-all duration-300 shadow-lg backdrop-blur-sm border border-purple-400/30">
                    <FileText className="w-12 h-12 text-purple-400 drop-shadow-sm" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-slate-200 mb-2 drop-shadow-sm">
                      Text Scan
                    </h3>
                    <p className="text-slate-400 text-sm drop-shadow-sm">
                      Extract text from documents and cards
                    </p>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div className="bg-slate-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500/90 to-cyan-500/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between shadow-lg">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  {scanMode === 'qr' && 'QR Code Scanner'}
                  {scanMode === 'nfc' && 'NFC Reader'}
                  {scanMode === 'text' && 'Text Scanner'}
                </h3>
                <button
                  onClick={stopScan}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="p-8 flex flex-col items-center gap-4">
                {scanMode === 'qr' && (
                  <>
                    <div className="relative w-full aspect-video rounded-xl bg-black flex items-center justify-center overflow-hidden">
                      {capturedImageUrl ? (
                        <img
                          src={capturedImageUrl}
                          alt="Captured business card"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <video
                          ref={videoRef}
                          className="w-full h-full object-contain"
                          autoPlay
                          muted
                          playsInline
                        />
                      )}
                    </div>
                    
                    <canvas ref={canvasRef} className="hidden" />
                    
                    <div className="mb-4 p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg border border-green-400/30">
                      <div className="text-center">
                        <p className="text-sm text-slate-200 mb-2">
                          📱 Enhanced QR Detection + 🤖 AI Vision Analysis
                        </p>
                        <p className="text-xs text-slate-400">
                          Uses jsQR, goQR.me API, and OpenAI Vision for best results
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-4">
                      <button
                        onClick={captureImage}
                        disabled={isProcessing}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-2xl hover:from-purple-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50 backdrop-blur-sm border border-slate-600/50 font-semibold"
                      >
                        <Camera className="w-4 h-4" />
                        {isProcessing ? 'Processing...' : 'Capture & Analyze'}
                      </button>
                      
                      <button
                        onClick={() => {
                          setCapturedImageUrl(null);
                          setStatus('Restarting camera...');
                          stopCamera();
                          setTimeout(() => {
                            startCamera();
                          }, 100);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl hover:from-yellow-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-slate-600/50 font-semibold"
                      >
                        Reset
                      </button>
                      
                      <button
                        onClick={stopScan}
                        className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl hover:from-gray-600 hover:to-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-slate-600/50 font-semibold"
                      >
                        Stop Camera
                      </button>
                    </div>
                    
                    <div className="mt-4 p-4 bg-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50 w-full">
                      <p className="text-slate-200 whitespace-pre-line">{status}</p>
                    </div>

                    {/* Enhanced QR Results Display */}
                    {enrichResults && enrichResults.qr_codes && enrichResults.qr_codes.length > 0 && (
                      <div className="mt-6 w-full">
                        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl p-4 border border-green-400/30">
                          <h4 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
                            📱 QR Code Details ({enrichResults.qr_count})
                          </h4>
                          
                          <div className="space-y-3">
                            {enrichResults.qr_codes.map((qr: any, index: number) => (
                              <div key={index} className="bg-slate-800/60 rounded-xl p-4 border border-green-400/20">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-green-400 font-bold">QR {index + 1}</span>
                                  <span className="bg-green-400/20 text-green-300 px-2 py-1 rounded-full text-xs">
                                    {qr.method || 'Unknown method'}
                                  </span>
                                  {qr.parsed && qr.parsed.title && (
                                    <span className="bg-cyan-400/20 text-cyan-300 px-2 py-1 rounded-full text-xs">
                                      {qr.parsed.title}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="mb-2">
                                  <span className="text-sm font-medium text-slate-300">Data:</span>
                                  <p className="text-sm text-slate-200 bg-slate-900/50 p-2 rounded mt-1 break-all">
                                    {qr.data}
                                  </p>
                                </div>
                                
                                {qr.parsed && qr.parsed.details && Object.keys(qr.parsed.details).length > 0 && (
                                  <div className="mt-3">
                                    <span className="text-sm font-medium text-slate-300">Extracted Details:</span>
                                    <div className="mt-1 space-y-1">
                                      {Object.entries(qr.parsed.details).map(([key, value]: [string, any]) => (
                                        <div key={key} className="flex items-start gap-2 text-sm">
                                          <span className="font-medium text-green-400 capitalize min-w-20">
                                            {key.replace('_', ' ')}:
                                          </span>
                                          <span className="text-slate-200 break-all">
                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Action buttons based on QR type */}
                                <div className="mt-3 flex gap-2 flex-wrap">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(qr.data);
                                      alert('QR code data copied!');
                                    }}
                                    className="px-3 py-1 bg-green-500/30 text-green-300 text-xs rounded-lg hover:bg-green-500/40 border border-green-400/30"
                                  >
                                    Copy Data
                                  </button>
                                  {qr.parsed?.content_type === 'url' && (
                                    <button
                                      onClick={() => window.open(qr.data, '_blank')}
                                      className="px-3 py-1 bg-blue-500/30 text-blue-300 text-xs rounded-lg hover:bg-blue-500/40 border border-blue-400/30"
                                    >
                                      Open Link
                                    </button>
                                  )}
                                  {qr.parsed?.content_type === 'email' && (
                                    <button
                                      onClick={() => window.open(`mailto:${qr.data}`, '_blank')}
                                      className="px-3 py-1 bg-purple-500/30 text-purple-300 text-xs rounded-lg hover:bg-purple-500/40 border border-purple-400/30"
                                    >
                                      Send Email
                                    </button>
                                  )}
                                  {qr.parsed?.content_type === 'phone' && (
                                    <button
                                      onClick={() => window.open(`tel:${qr.data}`, '_blank')}
                                      className="px-3 py-1 bg-orange-500/30 text-orange-300 text-xs rounded-lg hover:bg-orange-500/40 border border-orange-400/30"
                                    >
                                      Call
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Analysis Results */}
                    {enrichResults && (
                      <div className="mt-6 w-full max-w-md">
                        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50">
                          <h4 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
                            🤖 AI Analysis Results
                          </h4>
                          
                          {/* Company Info */}
                          {enrichResults.company_info && enrichResults.company_info.name && (
                            <div className="mb-4">
                              <p className="text-slate-300 text-sm mb-2">Company Information:</p>
                              <div className="p-3 bg-slate-700/50 rounded-lg">
                                <p className="text-emerald-400 text-sm font-medium">
                                  {enrichResults.company_info.name}
                                </p>
                                {enrichResults.company_info.website && (
                                  <button
                                    onClick={() => window.open(enrichResults.company_info.website, "_blank")}
                                    className="text-cyan-400 text-xs hover:text-cyan-300 underline mt-1 flex items-center gap-1"
                                  >
                                    Visit Website <ExternalLink className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  onClick={() => window.open(constructCompanyURL('linkedin', enrichResults.company_info.name), "_blank")}
                                  className="text-cyan-400 text-xs hover:text-cyan-300 underline mt-1 flex items-center gap-1"
                                >
                                  LinkedIn Company <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {scanMode === 'text' && (
                  <>
                    <div className="relative w-full aspect-video rounded-xl bg-black flex items-center justify-center overflow-hidden">
                      {capturedImageUrl ? (
                        <img
                          src={capturedImageUrl}
                          alt="Captured document"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <video
                          ref={videoRef}
                          className="w-full h-full object-contain"
                          autoPlay
                          muted
                          playsInline
                        />
                      )}
                    </div>
                    
                    <canvas ref={canvasRef} className="hidden" />
                    
                    <div className="mb-4 p-4 bg-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50">
                      <div className="text-center">
                        <p className="text-sm text-slate-300 mb-2">
                          🤖 AI Vision text extraction
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-4">
                      <button
                        onClick={handleTextCapture}
                        disabled={isProcessing}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-2xl hover:from-purple-600 hover:to-violet-600 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50 backdrop-blur-sm border border-slate-600/50 font-semibold"
                      >
                        <Camera className="w-4 h-4" />
                        {isProcessing ? 'Processing...' : 'Capture Text'}
                      </button>
                      
                      <button
                        onClick={() => {
                          setCapturedImageUrl(null);
                          setStatus('Restarting camera...');
                          stopCamera();
                          setTimeout(() => {
                            startCamera();
                          }, 100);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl hover:from-yellow-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-slate-600/50 font-semibold"
                      >
                        Reset
                      </button>
                      
                      <button
                        onClick={stopScan}
                        className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl hover:from-gray-600 hover:to-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-slate-600/50 font-semibold"
                      >
                        Stop Camera
                      </button>
                    </div>
                    
                    <div className="mt-4 p-4 bg-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50">
                      <p className="text-slate-200 whitespace-pre-line">{status}</p>
                    </div>
                  </>
                )}
                {scanMode !== 'qr' && scanMode !== 'text' && (
                  <p className="text-slate-400 text-center">Feature coming soon...</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScanView;