import { useState } from 'react';
import {
  MessageSquare,
  Upload,
  Camera,
  Users,
  BarChart3,
  Database,
} from 'lucide-react';
import ChatView from './components/ChatView';

function App() {
  const [activeView, setActiveView] = useState<'chat' | 'upload' | 'scan' | 'analysis'>('chat');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'qr' | 'barcode' | 'nfc' | 'text' | null>(null);

  // analysis subsection state
  const [analysisSubsection, setAnalysisSubsection] =
    useState<'overview' | 'stats' | 'database' | null>('overview');

  const handleNavClick = (view: 'chat' | 'upload' | 'scan' | 'analysis') => {
    setActiveView(view);
    // stop scanning when leaving scanner view
    if (view !== 'scan') {
      setIsScanning(false);
      setScanMode(null);
    }

    // if opening analysis, default to overview
    if (view === 'analysis') {
      setAnalysisSubsection('overview');
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    setScanMode(null);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="flex h-screen overflow-hidden">
        {/* Left Sidebar - Navigation & Features */}
        <aside className="w-80 bg-slate-800 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-700">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Tekisho
            </h1>
          </div>

          {/* Main Navigation */}
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Navigation</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleNavClick('chat')}
                aria-label="Open Chatterbox"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeView === 'chat'
                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">Chatterbox</span>
              </button>

              {/* Scanner Section */}
              <button
                onClick={() => handleNavClick('scan')}
                aria-label="Open Scanner"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeView === 'scan'
                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Camera className="w-5 h-5" />
                <span className="font-medium">Scanner</span>
              </button>

              <button
                onClick={() => handleNavClick('upload')}
                aria-label="Open Upload"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeView === 'upload'
                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Upload className="w-5 h-5" />
                <span className="font-medium">Upload Files</span>
              </button>

              {/* Analysis nav (opens analysis overview) */}
              <button
                onClick={() => handleNavClick('analysis')}
                aria-label="Open Analysis"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeView === 'analysis'
                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Analysis</span>
              </button>

              {/* WHEN Analysis is active show subsection shortcuts */}
              {activeView === 'analysis' && (
                <div className="ml-4 mt-2 space-y-1">
                  <button
                    onClick={() => setAnalysisSubsection('stats')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors text-slate-300"
                  >
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">Quick Stats</span>
                  </button>
                  <button
                    onClick={() => setAnalysisSubsection('database')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors text-slate-300"
                  >
                    <Database className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">Database</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Scanner Status */}
          {isScanning && (
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Scanner Status</h3>
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300">
                    {scanMode === 'qr' && 'QR Code Scanner'}
                    {scanMode === 'barcode' && 'Barcode Scanner'}
                    {scanMode === 'nfc' && 'NFC Reader'}
                    {scanMode === 'text' && 'Text Reader'}
                  </span>
                  <button onClick={stopScanning} className="text-red-400 hover:text-red-300 text-sm">
                    Stop
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-slate-400 text-sm">Ready to scan</span>
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="p-6 mt-auto">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Status</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-slate-300">System Online</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
        <ChatView
            activeView={activeView}
            analysisSubsection={analysisSubsection}
            setAnalysisSubsection={setAnalysisSubsection}
            setActiveView={setActiveView}
          />
        </main>
      </div>
    </div>
  );
}

export default App;