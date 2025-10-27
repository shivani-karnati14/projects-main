import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileImage, Loader, CheckCircle } from 'lucide-react';
import { qrDetectionService } from '../services/qrDetection';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: any;
  error?: string;
}

interface UploadViewProps {
  onFilesProcessed?: (results: any[]) => void;
}

function UploadView({ onFilesProcessed }: UploadViewProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File validation
  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }
    
    if (!allowedTypes.includes(file.type)) {
      return 'Only image files (JPEG, PNG, GIF, WebP) are allowed';
    }
    
    return null;
  };

  // Generate file preview
  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection
  const handleFiles = useCallback(async (files: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateFile(file);
      
      if (validationError) {
        newFiles.push({
          id: `${Date.now()}-${i}`,
          file,
          preview: '',
          status: 'error',
          progress: 0,
          error: validationError
        });
        continue;
      }
      
      const preview = await createPreview(file);
      newFiles.push({
        id: `${Date.now()}-${i}`,
        file,
        preview,
        status: 'pending',
        progress: 0
      });
    }
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  // File input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  // Remove file
  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };


  // Detect QR codes in uploaded files
  const detectQRCodesInFiles = async (files: UploadedFile[]) => {
    const qrResults: any[] = [];
    
    for (const file of files) {
      try {
        // Convert file to ImageData for QR detection
        const imageData = await fileToImageData(file.file);
        
        // Detect QR codes with enhanced algorithms (jsQR + goQR.me API)
        console.log(`🔍 Processing ${file.file.name} with enhanced QR detection...`);
        const qrCodes = await qrDetectionService.detectQRCodes(imageData);
        
        if (qrCodes.length > 0) {
          // Parse QR codes
          const parsedQRCodes = qrCodes.map(qr => ({
            ...qr,
            parsed: qrDetectionService.parseQRContent(qr.data)
          }));
          
          qrResults.push({
            filename: file.file.name,
            qr_codes: parsedQRCodes,
            qr_count: qrCodes.length
          });
          
          console.log(`✅ QR codes detected in ${file.file.name}:`, qrCodes.length);
          console.log(`📊 Detection methods used:`, qrCodes.map(qr => qr.method));
        } else {
          console.log(`❌ No QR codes found in ${file.file.name} with enhanced detection`);
        }
      } catch (error) {
        console.warn(`QR detection failed for ${file.file.name}:`, error);
      }
    }
    
    return qrResults;
  };

  // Helper function to convert file to ImageData
  const fileToImageData = async (file: File): Promise<ImageData> => {
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
      img.src = URL.createObjectURL(file);
    });
  };

  // Upload all files using batch endpoint
const uploadAllFilesBatch = async () => {
  const pendingFiles = uploadedFiles.filter(file => file.status === 'pending');
  if (pendingFiles.length === 0) return;

  setIsUploading(true);
  setUploadStatus(`Processing ${pendingFiles.length} files...`);
  
  try {
    // First, detect QR codes in all files
    setUploadStatus('🔍 Detecting QR codes with enhanced algorithms (jsQR + goQR.me API)...');
    const qrResults = await detectQRCodesInFiles(pendingFiles);
    
    if (qrResults.length > 0) {
      console.log('📱 QR codes found in files:', qrResults);
      setUploadStatus(`📱 Found QR codes in ${qrResults.length} files. Processing with AI OCR...`);
    }

    // Process each file individually with AI business card endpoint
    const results = [];
    
    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];
      setUploadStatus(`🤖 Processing file ${i + 1}/${pendingFiles.length}: ${file.file.name}...`);
      
      try {
        const formData = new FormData();
        formData.append('file', file.file);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout per file
        
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
        
        // Merge QR data with AI OCR result
        const qrData = qrResults.find((q: any) => q.filename === file.file.name);
        const mergedResult = {
          ...result,
          filename: file.file.name,
          qr_codes: qrData?.qr_codes || [],
          qr_count: qrData?.qr_count || 0,
          has_qr_codes: (qrData?.qr_count || 0) > 0,
          // Map AI business card fields to expected format
          text: result.raw_analysis || result.formatted_output || '',
          engine: result.method || 'ai_vision',
          engine_used: result.method || 'ai_vision',
          // Keep structured_data for compatibility
          structured_data: result.structured_data || result.structuredInfo || {},
          structuredInfo: result.structured_data || result.structuredInfo || {},
        };
        
        results.push(mergedResult);
        
        // NOTE: Database saving is handled by the backend /ai-business-card endpoint
        // No need to save from frontend to avoid duplicates
        console.log('✅ File processed successfully:', file.file.name);
        if (result.saved_to_database) {
          console.log('✅ Backend saved to database:', file.file.name);
        }
        
        // Update individual file status
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === file.id
              ? {
                  ...f,
                  status: result.success ? 'completed' : 'error',
                  progress: result.success ? 100 : 0,
                  result: result.success ? mergedResult : null,
                  error: result.success ? null : result.error || 'Processing failed'
                }
              : f
          )
        );
        
      } catch (error) {
        console.error(`Failed to process ${file.file.name}:`, error);
        
        let errorMessage = 'Processing failed';
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage = 'Processing timed out. Please try with a smaller image.';
          } else {
            errorMessage = error.message;
          }
        }
        
        results.push({
          filename: file.file.name,
          success: false,
          error: errorMessage
        });
        
        // Update file status to error
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === file.id
              ? { ...f, status: 'error', error: errorMessage }
              : f
          )
        );
      }
    }
    
    // Final status update
    const successCount = results.filter(r => r.success !== false).length;
    setUploadStatus(`✅ Processed ${successCount}/${pendingFiles.length} files successfully`);
    
    onFilesProcessed?.(results);
    
  } catch (error) {
    console.error('Batch upload failed:', error);
    
    let errorMessage = 'Batch upload failed';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Mark all pending files as error
    setUploadedFiles(prev => 
      prev.map(file => 
        file.status === 'pending' 
          ? { ...file, status: 'error', error: errorMessage }
          : file
      )
    );
  } finally {
    setIsUploading(false);
    setTimeout(() => setUploadStatus(''), 5000); // Clear status after 5 seconds
  }
};

  // Upload all files (removed wrapper to prevent duplicate processing)

  // Clear all files
  const clearAllFiles = () => {
    setUploadedFiles([]);
    setShowResults(false);
    setSelectedFile(null);
  };

  // Show results for a specific file
  const showFileResults = (file: UploadedFile) => {
    setSelectedFile(file);
    setShowResults(true);
  };

  // Close results modal
  const closeResults = () => {
    setShowResults(false);
    setSelectedFile(null);
  };

  const pendingCount = uploadedFiles.filter(f => f.status === 'pending').length;
  const completedCount = uploadedFiles.filter(f => f.status === 'completed').length;
  const errorCount = uploadedFiles.filter(f => f.status === 'error').length;

  return (
    <div className="flex flex-col h-full bg-slate-900 relative overflow-hidden">
      {/* Dark glassmorphism background elements */}
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-3xl"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Header */}
      <div className="relative z-10 bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4 shadow-lg">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Upload Files</h2>
        <p className="text-slate-400 mt-1">Upload images for OCR processing</p>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Upload Area */}
          <div
            className={`backdrop-blur-2xl rounded-3xl p-12 text-center transition-all border border-slate-700/50 shadow-2xl ${
              isDragOver 
                ? 'bg-slate-800/70 ring-2 ring-cyan-400/50' 
                : 'bg-slate-800/60 hover:bg-slate-800/80'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {uploadedFiles.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center gap-4">
                <div className="p-6 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-3xl group-hover:scale-110 transition-all duration-300 shadow-lg backdrop-blur-sm border border-emerald-400/30">
                  <Upload className="w-12 h-12 text-emerald-400 drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-200 mb-2 drop-shadow-sm">
                    Drop your files here
                  </h3>
                  <p className="text-slate-400 mb-4">or click to browse</p>
                </div>
                <label className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-2xl hover:from-emerald-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-slate-600/50 font-semibold cursor-pointer">
                  Choose Files
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-slate-500 mt-2">Supports JPEG, PNG, GIF, WebP (max 10MB each)</p>
              </div>
            ) : (
              // Files in upload area
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-200">
                    Uploaded Files ({uploadedFiles.length})
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-semibold"
                    >
                      Add More
                    </button>
                    <button
                      onClick={clearAllFiles}
                      className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-semibold"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Files uploaded message */}
                <div className="text-center">
                  <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl backdrop-blur-sm border border-emerald-400/30 inline-block">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-slate-200 font-medium">
                      {uploadedFiles.length} files uploaded
                    </p>
                    <p className="text-slate-400 text-sm">
                      Files are listed below
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="bg-slate-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500/90 to-cyan-500/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-semibold text-white">
                    Uploaded Files ({uploadedFiles.length})
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors text-sm font-semibold backdrop-blur-sm"
                  >
                    Add More
                  </button>
                  <button
                    onClick={clearAllFiles}
                    className="px-4 py-2 bg-red-500/70 text-white rounded-xl hover:bg-red-500/90 transition-colors text-sm font-semibold"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="divide-y divide-slate-700/50">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-6 hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl backdrop-blur-sm border border-emerald-400/30">
                          <FileImage className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-slate-200 truncate">
                            {file.file.name}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                            <span>{(file.file.size / 1024 / 1024).toFixed(2)} MB</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              {file.status === 'pending' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-400/30">
                                  ⏳ Pending
                                </span>
                              )}
                              {file.status === 'uploading' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-400/30">
                                  📤 Uploading
                                </span>
                              )}
                              {file.status === 'processing' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400 border border-purple-400/30">
                                  ⚙️ Processing
                                </span>
                              )}
                              {file.status === 'completed' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-400/30">
                                  ✅ Completed
                                </span>
                              )}
                              {file.status === 'error' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-400/30">
                                  ❌ Error
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Error Message */}
                          {file.status === 'error' && file.error && (
                            <p className="text-red-400 text-xs mt-1 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                              {file.error}
                            </p>
                          )}
                          
                          {/* Result Preview for completed files */}
                          {file.status === 'completed' && file.result && (
                            <div className="mt-2 p-2 bg-emerald-500/10 rounded-lg border border-emerald-400/30">
                              <p className="text-emerald-400 font-medium text-xs mb-1">OCR Result:</p>
                              <p className="text-slate-300 text-xs truncate">
                                {file.result.text?.substring(0, 80)}...
                              </p>
                              {file.result.qr_codes && file.result.qr_codes.length > 0 && (
                                <p className="text-cyan-400 text-xs mt-1">
                                  📱 {file.result.qr_codes.length} QR codes found
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* View Results Button */}
                        {file.status === 'completed' && file.result && (
                          <button
                            onClick={() => showFileResults(file)}
                            className="px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 rounded-xl hover:from-cyan-500/30 hover:to-blue-500/30 transition-colors text-xs border border-cyan-400/30 font-semibold"
                          >
                            View Results
                          </button>
                        )}
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors backdrop-blur-sm border border-red-500/20"
                          title="Remove file"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Upload Button */}
              {pendingCount > 0 && (
                <div className="p-6 bg-slate-800/50 border-t border-slate-700/50">
                  <div className="flex justify-center">
                    <button
                      onClick={uploadAllFilesBatch}
                      disabled={isUploading}
                      className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-2xl hover:from-emerald-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-semibold text-lg"
                    >
                      {isUploading ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Process All Files ({pendingCount})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Status */}
          {uploadStatus && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">{uploadStatus}</p>
            </div>
          )}

          {/* Stats */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4 flex gap-4 text-sm">
              {pendingCount > 0 && (
                <span className="text-yellow-600">⏳ {pendingCount} pending</span>
              )}
              {completedCount > 0 && (
                <span className="text-green-600">✅ {completedCount} completed</span>
              )}
              {errorCount > 0 && (
                <span className="text-red-600">❌ {errorCount} errors</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Modal */}
      {showResults && selectedFile && selectedFile.result && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">OCR Results</h3>
              <button
                onClick={closeResults}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image Preview */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Original Image</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={selectedFile.preview}
                      alt={selectedFile.file.name}
                      className="w-full h-auto"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedFile.file.name} ({(selectedFile.file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>

                {/* OCR Results */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Extracted Information</h4>
                  
                  {/* Processing Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-800 font-medium">Processing Engine:</span>
                      <span className="text-blue-600">{selectedFile.result.engine || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-blue-800 font-medium">Confidence:</span>
                      <span className="text-blue-600">{Math.round((selectedFile.result.confidence || 0) * 100)}%</span>
                    </div>
                  </div>

                  {/* OCR Text */}
                  {selectedFile.result.text && (
                    <div className="mb-4">
                      <h5 className="font-semibold text-gray-700 mb-2">Extracted Text:</h5>
                      <div className="bg-gray-50 border rounded-lg p-3 max-h-40 overflow-y-auto">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {selectedFile.result.text}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* QR Codes - Enhanced Display */}
                  {selectedFile.result.qr_codes && selectedFile.result.qr_codes.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span className="text-green-600">📱</span>
                        QR Codes Found ({selectedFile.result.qr_codes.length})
                      </h5>
                      <div className="space-y-3">
                        {selectedFile.result.qr_codes.map((qr: any, index: number) => (
                          <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                            {/* QR Code Header */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-green-600 font-bold text-lg">QR {index + 1}</span>
                              {qr.parsed_info && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                  {qr.parsed_info.title}
                                </span>
                              )}
                            </div>
                            
                            {/* Raw Data */}
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-600">Raw Data:</span>
                              <p className="text-sm text-gray-800 bg-white p-2 rounded border break-all">
                                {qr.data}
                              </p>
                            </div>
                            
                            {/* Parsed Information */}
                            {qr.parsed_info && qr.parsed_info.details && (
                              <div className="mt-3">
                                <span className="text-sm font-medium text-gray-600">Extracted Details:</span>
                                <div className="mt-1 space-y-1">
                                  {Object.entries(qr.parsed_info.details).map(([key, value]: [string, any]) => (
                                    <div key={key} className="flex items-start gap-2 text-sm">
                                      <span className="font-medium text-green-700 capitalize min-w-20">
                                        {key.replace('_', ' ')}:
                                      </span>
                                      <span className="text-green-800 break-all">
                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(qr.data);
                                  alert('QR code data copied to clipboard!');
                                }}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              >
                                Copy Data
                              </button>
                              {qr.parsed_info?.content_type === 'url' && (
                                <button
                                  onClick={() => window.open(qr.data, '_blank')}
                                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                >
                                  Open Link
                                </button>
                              )}
                              {qr.parsed_info?.content_type === 'email' && (
                                <button
                                  onClick={() => window.open(`mailto:${qr.data}`)}
                                  className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                                >
                                  Send Email
                                </button>
                              )}
                              {qr.parsed_info?.content_type === 'phone' && (
                                <button
                                  onClick={() => window.open(`tel:${qr.data}`)}
                                  className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
                                >
                                  Call
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Structured Data */}
                  {selectedFile.result.structuredInfo && (
                    <div className="mb-4">
                      <h5 className="font-semibold text-gray-700 mb-2">Structured Information:</h5>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          {selectedFile.result.structuredInfo.name && (
                            <div className="flex">
                              <span className="font-medium text-purple-800 w-20">Name:</span>
                              <span className="text-purple-700">{selectedFile.result.structuredInfo.name}</span>
                            </div>
                          )}
                          {selectedFile.result.structuredInfo.title && (
                            <div className="flex">
                              <span className="font-medium text-purple-800 w-20">Title:</span>
                              <span className="text-purple-700">{selectedFile.result.structuredInfo.title}</span>
                            </div>
                          )}
                          {selectedFile.result.structuredInfo.company && (
                            <div className="flex">
                              <span className="font-medium text-purple-800 w-20">Company:</span>
                              <span className="text-purple-700">{selectedFile.result.structuredInfo.company}</span>
                            </div>
                          )}
                          {selectedFile.result.structuredInfo.email && (
                            <div className="flex">
                              <span className="font-medium text-purple-800 w-20">Email:</span>
                              <span className="text-purple-700">{selectedFile.result.structuredInfo.email}</span>
                            </div>
                          )}
                          {selectedFile.result.structuredInfo.phone && (
                            <div className="flex">
                              <span className="font-medium text-purple-800 w-20">Phone:</span>
                              <span className="text-purple-700">{selectedFile.result.structuredInfo.phone}</span>
                            </div>
                          )}
                          {selectedFile.result.structuredInfo.website && (
                            <div className="flex">
                              <span className="font-medium text-purple-800 w-20">Website:</span>
                              <span className="text-purple-700">{selectedFile.result.structuredInfo.website}</span>
                            </div>
                          )}
                          {selectedFile.result.structuredInfo.address && (
                            <div className="flex">
                              <span className="font-medium text-purple-800 w-20">Address:</span>
                              <span className="text-purple-700">{selectedFile.result.structuredInfo.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Results Message */}
                  {!selectedFile.result.text && (!selectedFile.result.qr_codes || selectedFile.result.qr_codes.length === 0) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm">
                        ⚠️ No text or QR codes were detected in this image. 
                        Our enhanced detection (jsQR + goQR.me API) couldn't find any content.
                        Try using a higher resolution image or better lighting.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeResults}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
              {selectedFile.result.text && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedFile.result.text);
                    alert('Text copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Copy Text
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadView;