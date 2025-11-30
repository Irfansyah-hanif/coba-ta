import React, { useState } from 'react';
// Tambahkan Calendar dan Clock untuk input terpisah
import { Vote, BarChart2, Newspaper, Settings, X, Save, Calendar, Clock } from 'lucide-react'; 
import CountdownTimer from '../components/CountdownTimer'; // Import komponen Timer

// Fungsi Helper untuk memformat tanggal dan waktu ISO ke format input date/time lokal
const formatDateAndTime = (isoString) => {
    if (!isoString) return { datePart: '', timePart: '' };
    try {
        const date = new Date(isoString);
        if (isNaN(date)) return { datePart: '', timePart: '' };

        // Format untuk input type="date" (YYYY-MM-DD)
        const datePart = date.toISOString().slice(0, 10);
        
        // Format untuk input type="time" (HH:MM) - Menggunakan waktu lokal user
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const timePart = `${hours}:${minutes}`;

        return { datePart, timePart };
    } catch (e) {
        console.error("Error formatting date:", e);
        return { datePart: '', timePart: '' };
    }
};

// Komponen Modal Edit Waktu (Admin)
const EditTimeModal = ({ endDate, onClose, onSave }) => {
    const initialParts = formatDateAndTime(endDate);
    
    const [datePart, setDatePart] = useState(initialParts.datePart); // YYYY-MM-DD
    const [timePart, setTimePart] = useState(initialParts.timePart); // HH:MM
    const [error, setError] = useState(null); 

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null); 
        
        if (!datePart || !timePart) {
            setError("Tanggal dan waktu tidak boleh kosong.");
            return;
        }

        const combinedDatetime = `${datePart}T${timePart}:00`; 
        const finalDate = new Date(combinedDatetime);

        if (isNaN(finalDate.getTime())) {
            setError("Format tanggal atau waktu tidak valid.");
            return;
        }

        if (finalDate <= new Date()) {
            setError("Batas waktu harus di masa depan. Silakan pilih tanggal dan waktu setelah saat ini.");
            return;
        }
        
        onSave(finalDate.toISOString()); 
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-slate-900 p-4 flex justify-between items-center border-b border-slate-800">
                    <h3 className="text-amber-500 font-bold flex items-center gap-2">
                        <Settings size={18}/> Atur Waktu
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}
                    
                    <div>
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Calendar size={14}/> Tentukan Tanggal
                        </label>
                        <input 
                            type="date" 
                            required 
                            value={datePart}
                            onChange={(e) => setDatePart(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" 
                        />
                    </div>

                    <div>
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                             <Clock size={14}/> Tentukan Waktu
                        </label>
                        <input 
                            type="time" 
                            required 
                            value={timePart}
                            onChange={(e) => setTimePart(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" 
                        />
                    </div>
                    
                    <button type="submit" className="w-full bg-amber-500 text-slate-900 py-3 rounded-xl text-sm font-bold hover:bg-amber-400 transition flex items-center justify-center gap-2 mt-4 shadow-md">
                        <Save size={18}/> Simpan Waktu
                    </button>
                </form>
            </div>
        </div>
    );
};


const HomePage = ({ role, userVoteStatus, setActiveTab, news, electionEndDate, handleSetEndDate, onViewNewsDetail }) => {
    const [showEditModal, setShowEditModal] = useState(false);
    
    // Cek apakah pemilihan sudah selesai
    const isElectionEnded = electionEndDate && new Date() > new Date(electionEndDate);

    return (
    <div className="animate-fade-in pt-2"> 
        {/* Header Gelap */}
        <div className="bg-slate-900 p-6 pb-24 rounded-b-[2.5rem] shadow-xl relative">
            {/* Tombol Edit Waktu (Hanya Admin) */}
            {role === 'admin' && (
                <button 
                    onClick={() => setShowEditModal(true)} 
                    className="absolute top-4 right-4 text-slate-400 hover:text-amber-500 transition p-2 rounded-full z-20"
                    title="Atur Batas Waktu Pemilihan"
                >
                    <Settings size={20} />
                </button>
            )}

            <div className="flex flex-col items-center justify-center mb-8 relative z-10 pt-4">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                COBLOS <span className="text-amber-500 italic font-serif">AKU</span>
              </h1>
              <p className="text-slate-400 text-[10px] tracking-[0.2em] mt-1 font-medium">
                BATAS WAKTU PEMILIHAN
              </p>
            </div>
            
            {/* Countdown Card */}
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-5 rounded-2xl mb-8 relative z-10">
               <CountdownTimer targetDate={electionEndDate} />
            </div>

            {/* Action Button */}
            {isElectionEnded || userVoteStatus.hasVoted ? (
              <button
                onClick={() => setActiveTab('voting')}
                className="w-full bg-amber-500 text-slate-900 py-4 rounded-full font-bold shadow-xl transition flex items-center justify-center gap-3 relative z-10"
              >
                <BarChart2 size={20} /> LIHAT HASIL
              </button>
            ) : (
              // MODIFIKASI DI SINI: Tombol hanya muncul jika user BUKAN tamu (guest)
              role !== 'guest' && (
                  <button
                    onClick={() => setActiveTab('candidates')}
                    className="w-full bg-amber-500 text-slate-900 py-4 rounded-full font-bold shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition flex items-center justify-center gap-3 relative z-10 border-2 border-amber-400/50"
                  >
                    <Vote size={20} /> MULAI MEMILIH SEKARANG
                  </button>
              )
            )}
        </div>
        
        {/* Kabar Terkini Section */}
        <div className="p-6 mt-10 relative z-30">
           <div className="flex items-center gap-2 mb-4 pl-1 border-l-4 border-amber-500">
            <h2 className="text-xl font-bold text-slate-900 font-serif">Kabar Terkini</h2>
            <span className="flex-1"></span>
            <button 
              onClick={() => setActiveTab('news')} 
              className="text-slate-500 text-xs flex items-center hover:text-amber-600"
            >
              Lihat Semua <span className="ml-1">›</span>
            </button>
           </div>
           
           <div className="space-y-3">
            {news.slice(0, 2).map(n => (
              <div 
                key={n.id} 
                onClick={() => onViewNewsDetail(n)} 
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-center cursor-pointer transition-shadow duration-300 hover:shadow-lg"
              >
                 <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-800 border border-slate-100">
                   <Newspaper size={20}/>
                 </div>
                 <div>
                   <h3 className="font-bold text-slate-900 text-sm mb-1 font-serif">{n.title}</h3>
                   <p className="text-xs text-slate-500">{n.date}</p>
                   <p className="text-xs text-slate-400 mt-1 line-clamp-1">{n.content}</p>
                 </div>
              </div>
            ))}
           </div>
        </div>
        
        {/* Modal Edit Waktu */}
        {showEditModal && (
            <EditTimeModal 
                endDate={electionEndDate} 
                onClose={() => setShowEditModal(false)}
                onSave={handleSetEndDate}
            />
        )}
    </div>
  );
};

export default HomePage;