import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ProcessingScreenProps {
  transactionID: string;
}

export function ProcessingScreen({ transactionID }: ProcessingScreenProps) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card className="text-center space-y-6">
          {/* Animated Card Icon */}
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 mb-4"
          >
            <CreditCard className="w-10 h-10 text-cyan-400" />
          </motion.div>

          <LoadingSpinner size="lg" />

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-200">Processing Your Business Card</h2>
            <p className="text-slate-400">Our AI is extracting information from your card...</p>
          </div>

          {/* Transaction ID */}
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-500 mb-1">Transaction ID</p>
            <p className="text-sm text-cyan-400 font-mono break-all">{transactionID}</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
            />
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
