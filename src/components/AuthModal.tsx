import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, Mail, ShieldCheck } from 'lucide-react';
import { signInWithGoogle } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            dir="rtl"
          >
            <div className="bg-brand-blue p-8 text-white text-center relative">
              <button 
                onClick={onClose}
                className="absolute top-4 left-4 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                <LogIn size={40} />
              </div>
              <h2 className="text-3xl font-bold mb-2">مرحباً بك في واصل ستور</h2>
              <p className="text-white/70">سجل دخولك لتتمتع بتجربة تسوق فريدة</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <button 
                  onClick={async () => {
                    await signInWithGoogle();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-4 bg-white border-2 border-gray-100 py-4 rounded-2xl hover:bg-gray-50 transition-all group shadow-sm hover:shadow-md"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
                  <span className="font-bold text-gray-700">المتابعة باستخدام جوجل</span>
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-4 text-gray-400">أو</span>
                  </div>
                </div>

                <div className="space-y-4 opacity-50 cursor-not-allowed">
                  <div className="relative">
                    <Mail className="absolute right-4 top-4 text-gray-400" size={20} />
                    <input 
                      disabled
                      type="email" 
                      placeholder="البريد الإلكتروني" 
                      className="w-full bg-gray-50 border border-gray-100 py-4 px-12 rounded-2xl outline-none"
                    />
                  </div>
                  <button 
                    disabled
                    className="w-full bg-gray-200 text-gray-500 py-4 rounded-2xl font-bold"
                  >
                    تسجيل الدخول بالبريد
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-400 justify-center">
                <ShieldCheck size={16} />
                <p>بياناتك محمية ومشفرة بالكامل</p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
              <p className="text-sm text-gray-500">
                بتسجيل الدخول، أنت توافق على <span className="text-brand-blue font-bold cursor-pointer hover:underline">شروط الخدمة</span> و <span className="text-brand-blue font-bold cursor-pointer hover:underline">سياسة الخصوصية</span>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
