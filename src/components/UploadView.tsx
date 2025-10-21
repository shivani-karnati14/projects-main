import { useState } from 'react';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: Date;
}

function UploadView() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type || 'application/octet-stream',
      uploadedAt: new Date(),
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

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
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`backdrop-blur-2xl rounded-3xl p-12 text-center transition-all border border-slate-700/50 shadow-2xl ${
              isDragging
                ? 'bg-slate-800/70 ring-2 ring-cyan-400/50'
                : 'bg-slate-800/60 hover:bg-slate-800/80'
            }`}
          >
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
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".json,application/json"
                />
              </label>
              <p className="text-sm text-slate-500 mt-2">Supports: JSON files</p>
            </div>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="bg-slate-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500/90 to-cyan-500/90 backdrop-blur-xl px-6 py-4 flex items-center gap-2 shadow-lg">
                <CheckCircle className="w-5 h-5 text-white" />
                <h3 className="text-lg font-semibold text-white">
                  Uploaded Files ({uploadedFiles.length})
                </h3>
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
                          <FileText className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-slate-200 truncate">
                            {file.name}
                          </h4>
                          <p className="text-sm text-slate-400">
                            {file.size} • {new Date(file.uploadedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors backdrop-blur-sm border border-red-500/20"
                        title="Remove file"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadView;