import React, { useState, useEffect } from 'react';
import { User, LogOut, Download, Edit2, Save, X } from 'lucide-react';

const ProfilePage = ({ user, role, onLogout, onUpdateProfile }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  // State untuk mode Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  // Ambil nama saat ini
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";

  useEffect(() => {
    const handler = (e) => {
      // -----------------------------------------------------------------------
      // MODIFIKASI: Baris di bawah ini dikomentari agar popup otomatis browser MUNCUL.
      // Jika Anda ingin memblokir popup otomatis dan hanya mengandalkan tombol, 
      // hapus tanda komentar (//) pada baris e.preventDefault()
      // -----------------------------------------------------------------------
      // e.preventDefault(); 
      
      // Simpan event agar tombol "Install Aplikasi" di bawah tetap bisa digunakan
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Tampilkan prompt instalasi secara manual
    deferredPrompt.prompt();
    // Tunggu respon pengguna
    const { outcome } = await deferredPrompt.userChoice;
    // Reset variabel jika sudah diinstal/ditolak
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Mulai Edit
  const handleStartEdit = () => {
      setEditName(displayName);
      setIsEditing(true);
  };

  // Simpan Edit
  const handleSaveEdit = () => {
      if(onUpdateProfile) {
          onUpdateProfile(editName);
      }
      setIsEditing(false);
  };

  // Batal Edit
  const handleCancelEdit = () => {
      setIsEditing(false);
  };

  return (
    <div className="p-6 animate-fade-in pb-24 md:pb-10">
      <div className="mb-6 border-l-4 border-amber-500 pl-3">
         <h2 className="text-2xl font-bold text-slate-900 font-serif">Profil Pengguna</h2>
      </div>
       
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col items-center mb-6 relative overflow-hidden">
         <div className="absolute top-0 w-full h-24 bg-gradient-to-r from-slate-800 to-slate-900"></div>
         
         <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center p-1 mb-3 shadow-lg relative z-10">
             <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <User size={48}/>
             </div>
         </div>
         
         {/* Bagian Nama (Editable) */}
         <div className="relative z-10 w-full flex flex-col items-center">
             {isEditing ? (
                 <div className="flex items-center gap-2 mt-2 w-full max-w-xs">
                     <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full text-center font-bold text-xl text-slate-900 border-b-2 border-amber-500 focus:outline-none bg-transparent"
                        autoFocus
                     />
                     <button onClick={handleSaveEdit} className="p-2 text-green-600 hover:bg-green-50 rounded-full">
                         <Save size={20} />
                     </button>
                     <button onClick={handleCancelEdit} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                         <X size={20} />
                     </button>
                 </div>
             ) : (
                 <div className="flex items-center gap-2 mt-1 group cursor-pointer" onClick={handleStartEdit} title="Klik untuk mengedit">
                     <h3 className="font-bold text-2xl text-slate-900 font-serif text-center">{displayName}</h3>
                     <Edit2 size={16} className="text-slate-300 group-hover:text-amber-500 transition-colors"/>
                 </div>
             )}
             
             <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full mt-2 uppercase tracking-wide">
                 {role}
             </span>
         </div>
         
         <div className="mt-6 w-full space-y-3">
            <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-sm">Email</span>
                <span className="text-slate-900 text-sm font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-sm">User ID</span>
                <span className="text-slate-900 text-sm font-mono">{user?.id?.substring(0, 8)}...</span>
            </div>
         </div>
      </div>

      {/* Tombol Install (Hanya muncul jika browser mendukung PWA install prompt) */}
      {deferredPrompt && (
          <button 
            onClick={handleInstallClick} 
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg mb-4 hover:bg-slate-800 transition"
          >
            <Download size={18} /> Install Aplikasi
          </button>
      )}

      <button 
        onClick={onLogout} 
        className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-red-100 hover:bg-red-100 transition"
      >
        <LogOut size={18} /> Keluar Akun
      </button>
    </div>
  );
};

export default ProfilePage;