import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X } from "lucide-react";
import avatarMascot from '../images/avatar-mascot.png';

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceAssistant = ({ isOpen, onClose }: VoiceAssistantProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      alert(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.4 }}
          className="fixed bottom-24 right-8 w-[450px] bg-slate-800/95 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden z-50"
        >
          <div className="bg-gradient-to-r from-purple-500/90 to-cyan-500/90 backdrop-blur-xl p-4 flex items-center justify-between">
            <h3 className="text-white font-semibold">Voice Assistant</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Voice Assistant Avatar */}
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src={avatarMascot} 
                  alt="Voice Assistant Mascot" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <motion.button
                onClick={toggleListening}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  isListening
                    ? "bg-red-500 hover:bg-red-600 shadow-red-500/25"
                    : "bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                transition={isListening ? { repeat: Infinity, duration: 1.5 } : {}}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8 text-white" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </motion.button>
            </div>

            <div className="min-h-[100px] max-h-[150px] overflow-y-auto bg-slate-700/50 rounded-lg p-4">
              {transcript ? (
                <p className="text-sm text-slate-200">{transcript}</p>
              ) : (
                <p className="text-sm text-slate-400 text-center">
                  {isListening ? "Listening..." : "Click the microphone to start"}
                </p>
              )}
            </div>

            <p className="text-xs text-slate-500 text-center">
              Speak naturally. Your voice will be transcribed in real-time.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};