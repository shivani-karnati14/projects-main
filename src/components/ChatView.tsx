import { useState } from 'react';
import { Mic, Send, Bot, Users, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import RobotAvatar from './RobotAvatar';
import UploadView from './UploadView';
import ScanView from './ScanView';
import DatabaseView from './DatabaseView';

interface ChatViewProps {
  activeView: 'chat' | 'upload' | 'scan' | 'analysis';
  analysisSubsection?: 'overview' | 'stats' | 'database' | null;
  setAnalysisSubsection?: (subsection: 'overview' | 'stats' | 'database' | null) => void;
  setActiveView?: (view: 'chat' | 'upload' | 'scan' | 'analysis') => void;
}

function ChatView({ activeView, analysisSubsection, setAnalysisSubsection, setActiveView }: ChatViewProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  // Render different views based on activeView
  if (activeView === 'upload') {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-slate-900 border-b border-slate-700 px-8 py-6 flex items-center gap-4">
          <button
            onClick={() => setActiveView?.('chat')}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-700/50"
          >
            ←
          </button>
          <h2 className="text-3xl font-bold text-white">Upload Files</h2>
        </div>
        <UploadView />
      </div>
    );
  }

  if (activeView === 'scan') {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-slate-900 border-b border-slate-700 px-8 py-6 flex items-center gap-4">
          <button
            onClick={() => setActiveView?.('chat')}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-700/50"
          >
            ←
          </button>
          <h2 className="text-3xl font-bold text-white">Scanner</h2>
        </div>
        <ScanView />
      </div>
    );
  }

  if (activeView === 'analysis') {
    // Handle analysis subsections
    if (analysisSubsection === 'database') {
      return (
        <div className="flex flex-col h-full bg-slate-900 relative overflow-hidden">
          {/* Dark glassmorphism background elements */}
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-3xl"></div>
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

          {/* Header */}
          <div className="relative z-10 bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4 shadow-lg flex items-center gap-4">
            <button
              onClick={() => setAnalysisSubsection?.('overview')}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-700/50"
            >
              ←
            </button>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Database</h2>
          </div>

          {/* Database Content */}
          <div className="relative z-10 flex-1">
            <DatabaseView />
          </div>
        </div>
      );
    }

    // Default analysis overview with stats
    return (
      <div className="flex flex-col h-full bg-slate-900 relative overflow-hidden">
        {/* Dark glassmorphism background elements */}
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-3xl"></div>
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-yellow-500/10 to-red-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-orange-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10 bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4 shadow-lg flex items-center gap-4">
          <button
            onClick={() => setActiveView?.('chat')}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-700/50"
          >
            ←
          </button>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Analysis Overview</h2>
        </div>
        <div className="relative z-10 flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Quick Stats Section */}
            <div className="bg-slate-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-700/50 p-6">
              <h3 className="text-xl font-semibold text-slate-200 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-2xl backdrop-blur-sm border border-slate-600/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl backdrop-blur-sm border border-amber-400/30">
                      <Users className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-slate-300 font-medium">Total Contacts:</span>
                  </div>
                  <span className="text-amber-400 font-bold text-xl">2</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-2xl backdrop-blur-sm border border-slate-600/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl backdrop-blur-sm border border-orange-400/30">
                      <BarChart3 className="w-5 h-5 text-orange-400" />
                    </div>
                    <span className="text-slate-300 font-medium">Active View:</span>
                  </div>
                  <span className="text-cyan-400 font-bold text-xl">analysis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default chat view
  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-700">
        <h2 className="text-3xl font-bold text-white">Chatterbox</h2>
        <p className="text-slate-400 mt-2">Chat with your AI assistant to manage contacts.</p>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto w-full">
          {/* Central Robot Avatar */}
          <div className="flex justify-center mb-8">
            <RobotAvatar />
          </div>


          {/* Chat Messages */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-slate-800 rounded-2xl p-4 max-w-2xl">
                <p className="text-slate-200">
                  Hello! I'm your Tekisho assistant. I can help you manage contacts, show recent entries, or answer questions. Try asking me something!
                </p>
                <p className="text-slate-400 text-sm mt-2">5:42:01 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-8 border-t border-slate-700">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full px-4 py-3 pr-16 rounded-2xl bg-slate-800 border border-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none resize-none transition-all text-slate-200 placeholder-slate-400"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
              <div className="absolute right-2 bottom-2 flex gap-2">
                <button
                  onClick={toggleRecording}
                  className={`p-2 rounded-lg transition-all ${
                    isRecording
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                  }`}
                  title="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="p-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg hover:from-purple-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatView;