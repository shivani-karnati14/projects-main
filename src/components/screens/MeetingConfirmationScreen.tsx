import { motion } from 'framer-motion';
import { PartyPopper, CheckCircle2, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface MeetingConfirmationScreenProps {
  transactionID: string;
  onDone: () => void;
}

export function MeetingConfirmationScreen({ transactionID, onDone }: MeetingConfirmationScreenProps) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card className="text-center space-y-6">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 mb-4"
          >
            <PartyPopper className="w-12 h-12 text-green-400" />
          </motion.div>

          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              <h2 className="text-3xl font-bold text-slate-200">Meeting Invitation Sent!</h2>
            </div>
            <p className="text-slate-400">
              Your meeting request has been successfully processed
            </p>
          </div>

          {/* Transaction ID */}
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-500 mb-2">Transaction ID</p>
            <p className="text-sm text-cyan-400 font-mono break-all">{transactionID}</p>
          </div>

          {/* Confetti Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, times: [0, 0.5, 1] }}
            className="absolute inset-0 pointer-events-none"
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: '50%',
                  y: '50%',
                  scale: 0
                }}
                animate={{
                  x: `${50 + (Math.random() - 0.5) * 100}%`,
                  y: `${50 + (Math.random() - 0.5) * 100}%`,
                  scale: [0, 1, 0],
                  rotate: Math.random() * 360
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.05
                }}
                className={`absolute w-2 h-2 rounded-full ${
                  ['bg-purple-500', 'bg-cyan-500', 'bg-green-500', 'bg-yellow-500'][i % 4]
                }`}
              />
            ))}
          </motion.div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={onDone} className="flex-1">
              <Calendar className="w-4 h-4" />
              Scan Another Card
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
