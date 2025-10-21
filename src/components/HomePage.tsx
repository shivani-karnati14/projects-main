import { motion } from "framer-motion";
import { Mic, Search } from "lucide-react";
import { useState } from "react";

interface HomePageProps {
  onOpenVoiceAssistant: () => void;
}

export const HomePage = ({ onOpenVoiceAssistant }: HomePageProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col h-full relative">
      {/* Dark glassmorphism background elements */}
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-3xl"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Welcome to Tekisho
          </h1>
          <p className="text-slate-400 max-w-2xl">
            Your intelligent contact management assistant
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts, files, or ask anything..."
              className="w-full pl-12 pr-4 py-4 bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20 outline-none text-slate-200 placeholder-slate-400"
            />
          </div>
        </motion.div>

        {/* Voice Assistant Button */}
        <motion.button
          onClick={onOpenVoiceAssistant}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 shadow-lg hover:shadow-purple-500/25 flex items-center justify-center transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Mic className="w-8 h-8 text-white" />
        </motion.button>

        <p className="text-slate-300 text-center">
          Click to activate voice assistant
        </p>
      </div>
    </div>
  );
};