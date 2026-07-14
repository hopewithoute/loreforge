import { Asset } from '../types';
import { LoadingRotator } from './LoadingRotator';
import { motion, AnimatePresence } from 'framer-motion';

interface GeneratorResultProps {
  asset?: Asset;
  isPending: boolean;
}

export function GeneratorResult({ asset, isPending }: GeneratorResultProps) {
  return (
    <div className="w-full h-full min-h-[400px] flex flex-col border border-ink-3/20 rounded-2xl bg-paper-2/40 backdrop-blur-sm overflow-hidden relative">
      <AnimatePresence mode="wait">
        
        {/* State 1: Loading */}
        {isPending && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 bg-paper-2/80 backdrop-blur-md"
          >
            <LoadingRotator />
          </motion.div>
        )}

        {/* State 2: Error */}
        {asset?.status === 'failed' && !isPending && (
          <motion.div 
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h3 className="text-lg font-serif text-ink mb-2">Generation Failed</h3>
            <p className="text-sm text-ink-3 font-mono">
              {asset.error_message || "An unknown anomaly occurred in the forge. Please try again."}
            </p>
          </motion.div>
        )}

        {/* State 3: Success Image */}
        {asset?.status === 'success' && asset.image_url && !isPending && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 p-4 flex items-center justify-center"
          >
            <img 
              src={asset.image_url} 
              alt={asset.prompt} 
              className="w-full h-full object-contain rounded-lg shadow-2xl"
            />
          </motion.div>
        )}

        {/* State 4: Idle */}
        {!asset && !isPending && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 opacity-50"
          >
            <div className="w-16 h-16 border border-ink-3/30 rounded-full flex items-center justify-center mb-4 border-dashed">
              <svg className="w-6 h-6 text-ink-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <p className="text-sm font-mono text-ink-3">Awaiting parameters...</p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
