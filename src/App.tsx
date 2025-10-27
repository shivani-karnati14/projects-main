import { useState } from 'react';
import {
  Home,
  MessageSquare,
  Upload,
  Camera,
  Users,
  BarChart3,
  Database,
} from 'lucide-react';
import Navbar from './components/Navbar';
import ChatView from './components/ChatView';
import UploadView from './components/UploadView';
import ScanView from './components/ScanView';
import DatabaseView from './components/DatabaseView';
import { HomePage } from './components/HomePage';
import { VoiceAssistant } from './components/VoiceAssistant';

function App() {
  const [activeView, setActiveView] = useState<'home' | 'chat' | 'upload' | 'scan' | 'analysis'>('home');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'qr' | 'barcode' | 'nfc' | 'text' | null>(null);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);

  // analysis subsection state
  const [analysisSubsection, setAnalysisSubsection] =
    useState<'overview' | 'stats' | 'database' | null>('overview');

  const [isCollapsed, setIsCollapsed] = useState(false); // Navbar collapse state
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false); // Side panel state


  const handleNavClick = (view: 'home' | 'chat' | 'upload' | 'scan' | 'analysis') => {
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
    setIsCollapsed(false);
    setIsSidePanelOpen(false);
  };

  const toggleNavbar = () => {
    // Prevent navbar from expanding if the side panel is open
    if (!isSidePanelOpen) {
      setIsCollapsed((prev) => !prev);
    }
  }

  const stopScanning = () => {
    setIsScanning(false);
    setScanMode(null);
  };

  const openVoiceAssistant = () => {
    setIsVoiceAssistantOpen(true);
  };

  const closeVoiceAssistant = () => {
    setIsVoiceAssistantOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 relative overflow-hidden">
      {/* Dark glassmorphism background elements */}
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-3xl"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="flex h-screen overflow-hidden relative z-10">
        {/* Left Sidebar - Navigation & Features */}

        <Navbar   activeView={activeView}
          onNavClick={handleNavClick}
          isCollapsed={isCollapsed}
          toggleCollapse={toggleNavbar}/>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative">
          {activeView === 'home' && <HomePage onOpenVoiceAssistant={openVoiceAssistant} />}
          {activeView === 'chat' && (
            <ChatView
              activeView={activeView}
              analysisSubsection={analysisSubsection}
              setAnalysisSubsection={setAnalysisSubsection}
              setActiveView={setActiveView}
            />
          )}
          {activeView === 'upload' && <UploadView />}
          {activeView === 'scan' && <ScanView />}
          {activeView === 'analysis' && (
            <DatabaseView
              toggleNavbar={toggleNavbar}
              setIsSidePanelOpen={setIsSidePanelOpen}
            />
          )}
        </main>
      </div>

      {/* Voice Assistant Modal */}
      <VoiceAssistant
        isOpen={isVoiceAssistantOpen}
        onClose={closeVoiceAssistant}
      />
    </div>
  );
}

export default App;