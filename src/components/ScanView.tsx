import { useState, useEffect, useRef } from 'react';
import { QrCode, FileText, Nfc, Camera, X, ExternalLink } from 'lucide-react';
import Tesseract from 'tesseract.js';

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

  const webhookUrl =
    'http://localhost:5678/webhook-test/3f02f382-0683-4066-afca-16ca80c53cd5';

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
    setStatus('Initializing OCR engine and requesting camera...');
    try {
      // Correct Tesseract.js v6 initialization
      const worker = await Tesseract.createWorker('eng');
      workerRef.current = worker;
      console.log('Tesseract.js worker initialized successfully.');

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
      console.error('Camera/OCR Init Error:', error);
      setStatus('Error initializing OCR or accessing camera.');
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
        
        // Process the image
        await processImage(blob);
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      console.error('Capture error:', error);
      setStatus('Capture failed: ' + (error instanceof Error ? error.message : String(error)));
      setIsProcessing(false);
    }
  };

  const processImage = async (blob: Blob) => {
    setStatus('Running OCR...');
    
    try {
      if (!workerRef.current) {
        throw new Error('OCR worker not initialized');
      }
      
      const { data: { text } } = await workerRef.current.recognize(blob);
      
      if (text && text.trim()) {
        // Display OCR results directly instead of sending to webhook
        setStatus(`✅ OCR Complete!\n\n📝 Extracted Text:\n${text}`);
        // Comment out webhook call for testing
        // await sendToWebhook(blob, text);
        setIsProcessing(false);
      } else {
        setStatus('No readable text found.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('OCR error:', error);
      setStatus('OCR failed: ' + (error instanceof Error ? error.message : String(error)));
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
    // Clear any previous captured image when starting a new scan
    setCapturedImageUrl(null);
    setStatus('Starting scanner...');
    setScanMode(mode);
    setIsScanning(true);
    setEnrichResults(null); // Clear previous results
  };

  const stopScan = () => {
    stopCamera();
    // Clear captured image and reset status when stopping scan
    setCapturedImageUrl(null);
    setStatus('Idle');
    setIsProcessing(false);
    setIsScanning(false);
    setScanMode(null);
    setEnrichResults(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 relative overflow-hidden">
      {/* Dark glassmorphism background elements */}
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-3xl"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Header */}
      <div className="relative z-10 bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4 shadow-lg">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Scan Code</h2>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          {!isScanning ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {/* QR Code */}
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
                      Scan QR codes and auto-fetch URL details
                    </p>
                  </div>
                </div>
              </button>

              {/* NFC */}
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

              {/* Text Scan */}
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
              {/* Scanner Header */}
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

              {/* Scanner Area */}
              <div className="p-8 flex flex-col items-center gap-4">
                {scanMode === 'qr' && (
                  <>
                    {/* Camera View */}
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
                    
                    {/* Hidden canvas for capture */}
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {/* Process Button */}
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">
                          Advanced processing with OCR + Vision analysis
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-4">
                      <button
                        onClick={captureImage}
                        disabled={isProcessing}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-2xl hover:from-purple-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50 backdrop-blur-sm border border-slate-600/50 font-semibold"
                      >
                        <Camera className="w-4 h-4" />
                        {isProcessing ? 'Processing...' : 'Capture Image'}
                      </button>
                      
                      <button
                        onClick={() => {
                          setCapturedImageUrl(null);
                          setStatus('Restarting camera...');
                          // Restart the camera
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
                    
                    {/* Status Display */}
                    <div className="mt-4 p-4 bg-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50">
                      <p className="text-slate-200 whitespace-pre-line">{status}</p>
                    </div>

                    {/* AI Analysis Results */}
                    {enrichResults && (
                      <div className="mt-6 w-full max-w-md">
                        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50">
                          <h4 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
                            🤖 AI Analysis Results
                          </h4>
                          
                          {/* LinkedIn Profiles */}
                          {enrichResults.linkedin_profiles && enrichResults.linkedin_profiles.length > 0 && (
                            <div className="mb-4">
                              <p className="text-slate-300 text-sm mb-2">LinkedIn Profiles Found:</p>
                              {enrichResults.linkedin_profiles.slice(0, 2).map((profile: any, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => window.open(profile.url, "_blank")}
                                  className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 transition-colors mb-2 group"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-cyan-400 text-sm font-medium truncate">
                                        {profile.name || 'LinkedIn Profile'}
                                      </p>
                                      <p className="text-slate-400 text-xs truncate">
                                        {profile.title || profile.company}
                                      </p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                          
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
                                {/* LinkedIn Company Link */}
                                <button
                                  onClick={() => window.open(constructCompanyURL('linkedin', enrichResults.company_info.name), "_blank")}
                                  className="text-cyan-400 text-xs hover:text-cyan-300 underline mt-1 flex items-center gap-1 ml-2"
                                >
                                  LinkedIn Company <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* NEW: Display Crawled Company Details */}
                          {enrichResults.crawledData && enrichResults.crawledData.success && (
                            <div className="mb-4">
                              <p className="text-slate-300 text-sm mb-2">🕷️ Crawled Company Details:</p>
                              <div className="p-3 bg-slate-700/50 rounded-lg">
                                <p className="text-purple-400 text-sm font-medium mb-2">
                                  AI-Extracted Information
                                </p>
                                {enrichResults.crawledData.ai_response && (
                                  <div className="text-slate-300 text-xs bg-slate-800/50 p-2 rounded border-l-2 border-purple-400/50">
                                    <pre className="whitespace-pre-wrap font-mono">
                                      {enrichResults.crawledData.ai_response}
                                    </pre>
                                  </div>
                                )}
                                <div className="text-xs text-slate-400 mt-2">
                                  Crawled from: {enrichResults.crawledData.url} ({enrichResults.crawledData.crawl_time?.toFixed(1)}s)
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Processing Stats */}
                          {enrichResults.meta && (
                            <div className="text-xs text-slate-400 border-t border-slate-700/50 pt-2">
                              Processed in {(enrichResults && enrichResults.meta && typeof enrichResults.meta.elapsed_seconds === 'number')
                                ? enrichResults.meta.elapsed_seconds.toFixed(1)
                                : '--'
                              }s •{' '}
                              {(enrichResults && enrichResults.meta && typeof enrichResults.meta.linkedin_profiles_found === 'number')
                                ? enrichResults.meta.linkedin_profiles_found
                                : 0
                              } profiles found
                              {(enrichResults?.crawledData) ? ' • Company crawled' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {scanMode === 'text' && (
                  <>
                    {/* Camera View */}
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
                    
                    {/* Hidden canvas for capture */}
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {/* Process Button */}
                    <div className="mb-4 p-4 bg-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50">
                      <div className="text-center">
                        <p className="text-sm text-slate-300 mb-2">
                          OCR text extraction with Tesseract.js
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-4">
                      <button
                        onClick={captureImage}
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
                          // Restart the camera
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
                    
                    {/* Status Display */}
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