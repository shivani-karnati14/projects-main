import { useState, useEffect, useRef } from 'react';
import { QrCode, FileText, Nfc, Camera, X } from 'lucide-react';
import Tesseract from 'tesseract.js';

type ScanMode = 'qr' | 'text' | 'nfc' | null;

function ScanView() {
  const [scanMode, setScanMode] = useState<ScanMode>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState<string>('Idle');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<any>(null);

  const webhookUrl =
    'http://localhost:5678/webhook-test/3f02f382-0683-4066-afca-16ca80c53cd5';

  // ---- QR Camera + OCR Start ----
  useEffect(() => {
    if (isScanning && (scanMode === 'qr' || scanMode === 'text')) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isScanning, scanMode]);

  const startCamera = async () => {
    setStatus('Initializing OCR engine and requesting camera...');
    try {
      // ✅ Modern Tesseract.js (v5+) initialization
      workerRef.current = await Tesseract.createWorker('eng', 1, {
        logger: (m) => console.log('Tesseract:', m.status),
      });
      console.log('Tesseract.js Worker initialized.');

      // ✅ Start camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus('Camera active. Position text and click capture.');
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
  };

  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current || !workerRef.current) {
      setStatus('System not active.');
      return;
    }

    setStatus('Capturing frame...');
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const captureWidth = 800;
    const captureHeight = (video.videoHeight / video.videoWidth) * captureWidth;
    canvas.width = captureWidth;
    canvas.height = captureHeight;
    ctx.drawImage(video, 0, 0, captureWidth, captureHeight);

    canvas.toBlob(async (blob) => {
      if (!blob) return setStatus('Failed to capture image.');
      try {
        setStatus('Running OCR...');
        const { data: { text } } = await workerRef.current.recognize(blob);
        if (text && text.trim()) {
          setStatus(`OCR Complete. Sending data to webhook...`);
          await sendToWebhook(blob, text);
        } else {
          setStatus('No readable text found.');
        }
      } catch (err) {
        console.error(err);
        setStatus('OCR failed.');
      }
    }, 'image/jpeg', 0.8);
  };

  const sendToWebhook = async (imageBlob: Blob, text: string) => {
    const formData = new FormData();
    formData.append('ocr_image', imageBlob, 'ocr_capture.jpeg');
    formData.append('extracted_text', text);

    try {
      const res = await fetch(webhookUrl, { method: 'POST', body: formData });
      if (res.ok) {
        setStatus(`✅ Data sent successfully.`);
        stopCamera();
      } else {
        setStatus(`❌ Webhook error: ${res.status}`);
      }
    } catch (e) {
      setStatus('Network error while posting data.');
    }
  };

  const startScan = (mode: ScanMode) => {
    setScanMode(mode);
    setIsScanning(true);
  };

  const stopScan = () => {
    stopCamera();
    setIsScanning(false);
    setScanMode(null);
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
      <div className="relative z-10 flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {!isScanning ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* QR Code */}
              <button
                onClick={() => startScan('qr')}
                className="group relative bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl border border-slate-700/50 p-8 transition-all hover:-translate-y-2 hover:bg-slate-800/80 overflow-hidden"
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
                      Scan QR codes for quick access
                    </p>
                  </div>
                </div>
              </button>

              {/* Text Reader */}
              <button
                onClick={() => startScan('text')}
                className="group relative bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl border border-slate-700/50 p-8 transition-all hover:-translate-y-2 hover:bg-slate-800/80 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="p-6 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-3xl group-hover:scale-110 transition-all duration-300 shadow-lg backdrop-blur-sm border border-orange-400/30">
                    <FileText className="w-12 h-12 text-orange-400 drop-shadow-sm" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-slate-200 mb-2 drop-shadow-sm">
                      Text Reader
                    </h3>
                    <p className="text-slate-400 text-sm drop-shadow-sm">
                      Extract text from images
                    </p>
                  </div>
                </div>
              </button>

              {/* NFC */}
              <button
                onClick={() => startScan('nfc')}
                className="group relative bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl border border-slate-700/50 p-8 transition-all hover:-translate-y-2 hover:bg-slate-800/80 overflow-hidden"
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
            </div>
          ) : (
            <div className="bg-slate-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">
              {/* Scanner Header */}
              <div className="bg-gradient-to-r from-purple-500/90 to-cyan-500/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between shadow-lg">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 drop-shadow-sm">
                  <Camera className="w-5 h-5" />
                  {scanMode === 'qr' && 'QR Code Scanner'}
                  {scanMode === 'text' && 'Text Reader'}
                  {scanMode === 'nfc' && 'NFC Reader'}
                </h3>
                <button
                  onClick={stopScan}
                  className="p-2 hover:bg-slate-700/50 rounded-xl transition-all duration-200 backdrop-blur-sm border border-slate-600/50"
                >
                  <X className="w-5 h-5 text-slate-300 drop-shadow-sm" />
                </button>
              </div>

              {/* Scanner Area */}
              <div className="p-8 flex flex-col items-center gap-4">
                {(scanMode === 'qr' || scanMode === 'text') && (
                  <>
                    <div className="relative">
                      <video
                        ref={videoRef}
                        id="webcam-stream"
                        className="w-full aspect-video rounded-2xl bg-black shadow-2xl border border-slate-700/50"
                        autoPlay
                        muted
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                    </div>
                    <canvas
                      ref={canvasRef}
                      id="qr-canvas"
                      className="hidden"
                    />
                    <button
                      onClick={captureAndProcess}
                      className="mt-4 px-8 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-2xl hover:from-purple-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-slate-600/50 font-semibold"
                    >
                      📸 Capture & OCR
                    </button>
                    <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl px-6 py-3 shadow-lg border border-slate-700/50">
                      <p className="text-slate-300 font-medium text-center">{status}</p>
                    </div>
                  </>
                )}
                {scanMode === 'nfc' && (
                  <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-slate-700/50">
                    <p className="text-slate-400 text-center font-medium">Feature coming soon...</p>
                  </div>
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