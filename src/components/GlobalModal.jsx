import React from 'react';
import { X, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';

const GlobalModal = ({ isOpen, type, title, message, onClose, isConfirm, onConfirmAction }) => {
  if (!isOpen) return null;

  // Tentukan warna dan ikon berdasarkan tipe
  let colorClass = 'text-blue-500 bg-blue-50';
  let Icon = HelpCircle;

  if (type === 'success') {
    colorClass = 'text-green-600 bg-green-100';
    Icon = CheckCircle;
  } else if (type === 'error') {
    colorClass = 'text-red-600 bg-red-100';
    Icon = AlertCircle;
  } else if (type === 'confirm') {
    // Confirm modal menggunakan ikon HelpCircle/AlertCircle 
    colorClass = 'text-amber-600 bg-amber-100';
    Icon = HelpCircle;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 transition-transform">
        <div className="p-6 text-center">
          {/* Icon Area */}
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${colorClass}`}>
            <Icon size={32} />
          </div>
          
          {/* Content */}
          <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed whitespace-pre-wrap">{message}</p>
          
          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            {isConfirm ? (
              <>
                <button 
                  onClick={onClose} 
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button 
                  onClick={() => { onConfirmAction(); onClose(); }} 
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 text-slate-900 font-bold hover:bg-amber-400 transition shadow-lg shadow-amber-300/50"
                >
                  Ya, Lanjutkan
                </button>
              </>
            ) : (
              <button 
                onClick={onClose} 
                className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition shadow-lg"
              >
                Tutup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalModal;