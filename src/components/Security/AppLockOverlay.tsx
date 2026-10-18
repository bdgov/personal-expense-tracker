import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SecurityService } from '../../services/securityService';
import { Lock, Fingerprint, Delete, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export const AppLockOverlay: React.FC = () => {
  const { isAppLocked, unlockApp, settings } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isBiometricPrompting, setIsBiometricPrompting] = useState(false);

  // Attempt biometric on mount if configured
  useEffect(() => {
    if (isAppLocked && settings.appLockType === 'biometric') {
      tryBiometricAuth();
    }
  }, [isAppLocked, settings.appLockType]);

  const tryBiometricAuth = async () => {
    setIsBiometricPrompting(true);
    setError('');
    const success = await SecurityService.authenticateBiometric();
    setIsBiometricPrompting(false);
    if (success) {
      unlockApp();
    } else {
      setError('বায়োমেট্রিক শনাক্তকরণ ব্যর্থ হয়েছে। পিন (PIN) কোড ব্যবহার করুন।');
    }
  };

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');

      if (newPin.length === 4) {
        // Verify PIN
        if (settings.pinCode && SecurityService.verifyPin(newPin, settings.pinCode)) {
          unlockApp();
          setPin('');
        } else {
          setError('ভুল পিন কোড! পুনরায় চেষ্টা করুন।');
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  if (!isAppLocked) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-slate-950 text-white p-6 sm:p-8">
      {/* Top Header */}
      <div className="flex flex-col items-center pt-8 text-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/10">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-1">
          ব্যক্তিগত খরচ
        </h2>
        <p className="text-xs text-slate-400">
          আপনার আর্থিক তথ্যের সুরক্ষায় পিন দিন
        </p>

        {/* PIN Dot Indicators */}
        <div className="flex gap-4 my-8">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <motion.div
                key={idx}
                animate={{ scale: isFilled ? 1.2 : 1 }}
                className={`w-3.5 h-3.5 rounded-full transition-colors ${
                  isFilled ? 'bg-indigo-500 shadow-md shadow-indigo-500/50' : 'bg-slate-800'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-rose-400 font-semibold px-4 py-1.5 rounded-lg bg-rose-950/60 border border-rose-900/40 animate-shake">
            {error}
          </p>
        )}
      </div>

      {/* Keypad */}
      <div className="w-full max-w-xs space-y-3 pb-8">
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyPress(digit)}
              className="h-16 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:bg-indigo-600 text-xl font-bold text-white transition flex items-center justify-center border border-slate-800/80 active:scale-95"
            >
              {digit}
            </button>
          ))}

          {/* Biometric Trigger if available */}
          <button
            onClick={tryBiometricAuth}
            disabled={isBiometricPrompting}
            className="h-16 rounded-2xl bg-slate-900/40 hover:bg-slate-800/60 text-indigo-400 transition flex items-center justify-center border border-slate-800/80 active:scale-95 disabled:opacity-50"
            title="বায়োমেট্রিক আনলক"
          >
            <Fingerprint className="w-7 h-7" />
          </button>

          <button
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:bg-indigo-600 text-xl font-bold text-white transition flex items-center justify-center border border-slate-800/80 active:scale-95"
          >
            0
          </button>

          <button
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-slate-900/40 hover:bg-slate-800/60 text-slate-400 hover:text-white transition flex items-center justify-center border border-slate-800/80 active:scale-95"
            title="মুছুন"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center pt-2">
          <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>১০০% অফলাইন ও নিরাপদ ডিভাইস স্টোরেজ</span>
          </span>
        </div>
      </div>
    </div>
  );
};
