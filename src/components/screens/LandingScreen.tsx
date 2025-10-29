import { motion } from 'framer-motion';
import { Camera, Zap, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';

interface LandingScreenProps {
  onStartScan: () => void;
}

export function LandingScreen({ onStartScan }: LandingScreenProps) {
  const features = [
    { icon: <Camera className="w-6 h-6" />, title: 'Instant Scanning', description: 'Capture business cards in seconds' },
    { icon: <Zap className="w-6 h-6" />, title: 'AI-Powered', description: 'Smart extraction using advanced AI' },
    { icon: <Calendar className="w-6 h-6" />, title: 'Easy Scheduling', description: 'Schedule meetings with one click' }
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full text-center space-y-12"
      >
        {/* Hero Section */}
        <div className="space-y-6">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-r from-purple-500 to-cyan-500 mb-6"
          >
            <Camera className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Scan Business Cards
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Transform business cards into digital contacts instantly with AI-powered scanning and automated meeting scheduling
          </p>

          <Button size="lg" onClick={onStartScan} className="mt-8">
            <Camera className="w-5 h-5" />
            Start Scanning
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-cyan-500/50 transition-colors"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
