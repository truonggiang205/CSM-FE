import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemStore } from '../../store/systemStore';

export function ConnectionBadge() {
  const isBackendConnected = useSystemStore((state) => state.isBackendConnected);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isBackendConnected) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isBackendConnected]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence mode="wait">
        {!isBackendConnected && (
          <motion.div
            key="mock"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-warning text-white px-4 py-2 rounded-md shadow-lg font-medium text-sm flex items-center gap-2"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            Đang dùng dữ liệu mẫu (Mock)
          </motion.div>
        )}
        
        {isBackendConnected && showSuccess && (
          <motion.div
            key="real"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-success text-white px-4 py-2 rounded-md shadow-lg font-medium text-sm flex items-center gap-2"
          >
            Đã kết nối server
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
