import React from 'react';

const VotingPage = ({ candidates }) => {
  
  // 1. HITUNG TOTAL SUARA (Dilakukan sekali di luar loop)
  // Menggunakan Number() untuk memastikan data dari database terbaca sebagai angka
  const totalVotes = candidates.reduce((total, candidate) => {
    const count = Number(candidate.vote_count) || 0; 
    return total + count;
  }, 0);

  // 2. Sortir kandidat berdasarkan nomor urut (Salin array dulu agar aman)
  const sortedCandidates = [...candidates].sort((a, b) => a.number - b.number);

  return (
    <div className="p-6 animate-fade-in pb-24 md:pb-10">
       <div className="mb-6 border-l-4 border-amber-500 pl-3">
         <h2 className="text-2xl font-bold text-slate-900 font-serif">Live Count</h2>
         <p className="text-slate-500 text-xs mt-1">
            Hasil perolehan suara sementara. 
            <span className="ml-2 font-bold text-amber-600">Total: {totalVotes} Suara</span>
         </p>
       </div>
       
       <div className="space-y-4">
         {candidates.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-400">Memuat data kandidat...</p>
            </div>
         ) : (
             sortedCandidates.map(c => {
                const voteCount = Number(c.vote_count) || 0;
                
                // Hitung Persentase (Cek jika total > 0 untuk hindari NaN)
                const pct = (totalVotes > 0) ? Math.round((voteCount / totalVotes) * 100) : 0;
                
                return (
                  <div key={c.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                     <div className="flex justify-between mb-2">
                       <span className="font-bold text-slate-900 font-serif">{c.name}</span>
                       <span className="font-bold text-amber-600">{pct}%</span>
                     </div>
                     
                     {/* Progress Bar */}
                     <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-slate-900 h-full transition-all duration-1000 ease-out" 
                          style={{ width: `${pct}%` }}
                        ></div>
                     </div>
                     
                     <p className="text-xs text-slate-400 mt-2 text-right">{voteCount} Suara</p>
                  </div>
                )
             })
         )}
       </div>
    </div>
  );
};

export default VotingPage;