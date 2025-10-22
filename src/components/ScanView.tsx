import { useState, useEffect, useRef } from 'react';
import { QrCode, FileText, Nfc, Camera, X, ExternalLink } from 'lucide-react';

type ScanMode = 'qr' | 'text' | 'nfc' | null;

function ScanView() {
  const [scanMode, setScanMode] = useState<ScanMode>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState<string>('Idle');
  const [enrichResults, setEnrichResults] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Use environment variable for production, fallback to localhost for development
  const enrichServiceUrl = import.meta.env.VITE_ENRICH_SERVICE_URL || 'http://localhost:8000/enrich';

  // ---- Camera Setup ----
  useEffect(() => {
    if (isScanning && (scanMode === 'qr' || scanMode === 'text')) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isScanning, scanMode]);

  const startCamera = async () => {
    setStatus('Initializing camera...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus('Camera active. Position content and click capture.');
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
  };

  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current) {
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
        setStatus('Processing with AI service...');

        // Create FormData for your enrich_service API
        const formData = new FormData();
        formData.append('raw_text', '');
        formData.append('name', '');
        formData.append('company', '');
        formData.append('image', new File([blob], 'ocr_capture.jpg', { type: 'image/jpeg' }));

        // Send to your enrich_service API
        const response = await fetch(enrichServiceUrl, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const enrichResult = await response.json();
        
        // NEW: If company info found, crawl for more details
        let crawledData = null;
        if (enrichResult.company_info && enrichResult.company_info.name) {
          setStatus('Fetching detailed company information...');
          crawledData = await fetchCompanyDetails(enrichResult.company_info.name);
        }
        
        setStatus(`✅ Processing complete!`);
        
        // Store results for display (include both enrich and crawl data)
        setEnrichResults({
          ...enrichResult,
          crawledData: crawledData
        });

        // Save to database
        if (crawledData && crawledData.success) {
          await saveToDatabase({
            type: 'company_crawl',
            company_name: crawledData.company_name,
            ai_response: crawledData.ai_response,
            url: crawledData.url,
            crawled_at: crawledData.crawled_at,
            enrich_data: enrichResult
          });
        }

        console.log('Enrichment result:', enrichResult);
        console.log('Crawled data:', crawledData);

        stopCamera();

      } catch (err) {
        console.error('Processing failed:', err);
        setStatus('❌ Processing failed. Please try again.');
      }
    }, 'image/jpeg', 0.8);
  };

  // NEW: Function to fetch company details from crawl endpoint
  const fetchCompanyDetails = async (companyName: string) => {
    try {
      const response = await fetch('http://localhost:8000/crawl-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          company_name: companyName,
          use_ai_extraction: 'true',
          platform: 'linkedin'
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching company details:', error);
      return null;
    }
  };

  // NEW: Function to save company data to database
  const saveToDatabase = async (data: any) => {
    try {
      const response = await fetch('/api/save-company-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save to database');
      }
      
      const result = await response.json();
      console.log('Saved to database:', result);
      return result;
    } catch (error) {
      console.error('Error saving to database:', error);
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
    setScanMode(mode);
    setIsScanning(true);
    setEnrichResults(null); // Clear previous results
  };

  const stopScan = () => {
    stopCamera();
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
                      📸 Capture & Process
                    </button>
                    <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl px-6 py-3 shadow-lg border border-slate-700/50">
                      <p className="text-slate-300 font-medium text-center">{status}</p>
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
                              Processed in {enrichResults.meta.elapsed_seconds?.toFixed(1)}s • 
                              {enrichResults.meta.linkedin_profiles_found || 0} profiles found
                              {enrichResults.crawledData && ' • Company crawled'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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