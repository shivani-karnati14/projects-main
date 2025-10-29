import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Send, X } from 'lucide-react';
import { Button } from '../ui/Button';
import type { UserInfo } from '../../types/cardScanner';

interface MeetingSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userInfo: UserInfo;
  onConfirm: () => Promise<void>;
}

export function MeetingSchedulerModal({
  isOpen,
  onClose,
  userInfo,
  onConfirm,
}: MeetingSchedulerModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-slate-800 rounded-3xl shadow-2xl border border-slate-700/50 max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 to-cyan-500 p-6 relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Schedule Meeting</h3>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <p className="text-slate-300">
                  Meeting invitation will be sent to:
                </p>
                
                <div className="bg-slate-900/50 rounded-2xl p-4 space-y-3">
                  {userInfo.name && (
                    <div>
                      <p className="text-xs text-slate-500">Name</p>
                      <p className="text-slate-200 font-medium">{userInfo.name}</p>
                    </div>
                  )}
                  
                  {userInfo.email && (
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-cyan-400 font-medium">{userInfo.email}</p>
                    </div>
                  )}
                  
                  {userInfo.company && (
                    <div>
                      <p className="text-xs text-slate-500">Company</p>
                      <p className="text-slate-200">{userInfo.company}</p>
                    </div>
                  )}
                </div>

                <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-3">
                  <p className="text-blue-300 text-xs">
                    <strong>Transaction ID:</strong><br />
                    <span className="font-mono">{userInfo.transaction_id}</span>
                  </p>
                  <p className="text-blue-400 text-xs mt-2">
                    This will update your meeting request status
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    onClick={handleConfirm}
                    isLoading={isLoading}
                    disabled={!userInfo.email}
                    className="flex-1"
                  >
                    <Send className="w-4 h-4" />
                    Confirm
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
