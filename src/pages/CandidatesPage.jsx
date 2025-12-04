import React, { useState } from 'react'; 
import { Plus, X, Save, Image as ImageIcon, Edit } from 'lucide-react'; 
import CandidateCard from '../components/CandidateCard';

const CandidatesPage = ({ candidates, role, onVote, onViewDetail, onDelete, onAddCandidate, onEditCandidate, hasVoted, isLoading }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [candidatePhoto, setCandidatePhoto] = useState(null); 

  // Handler untuk membuka modal Edit
  const handleEditClick = (candidate) => {
    setEditingCandidate(candidate);
    setShowAddForm(true);
    setCandidatePhoto(null);
  };

  // Handler untuk menutup modal
  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingCandidate(null);
    setCandidatePhoto(null);
  }
    
  // Handler Submit (Add atau Edit)
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const candidateData = Object.fromEntries(formData.entries());

    // Hapus photo_url dari form data mentah, kita pakai file atau url lama
    delete candidateData.photo_url;
    
    const finalData = {
      ...candidateData,
      photoFile: candidatePhoto, // File baru jika ada
    };

    if (editingCandidate) {
      // MODE EDIT
      const dataToEdit = {
        id: editingCandidate.id, 
        ...finalData,
      };
      onEditCandidate(dataToEdit);
    } else {
      // MODE TAMBAH
      onAddCandidate(finalData);
    }

    handleCloseForm();
  };
    
  const isEditMode = !!editingCandidate;
  const modalTitle = isEditMode ? 'Edit Kandidat' : 'Tambah Kandidat Baru';
  const submitButtonText = isEditMode ? 'Simpan Perubahan' : 'Simpan Data';

  return (
    <div className="p-6 animate-fade-in pb-24 md:pb-10">
      <div className="flex justify-between items-start mb-8">
        <div className="border-l-4 border-amber-500 pl-4">
          <h2 className="text-3xl font-bold text-slate-900 font-serif">Kandidat Ketua</h2>
          <p className="text-slate-500 text-sm mt-1">Kenali visi, misi, dan program kerja.</p>
        </div>
        
        {/* Tombol Tambah (Hanya Admin) */}
        {role === 'admin' && (
          <button 
            onClick={() => {
              setEditingCandidate(null);
              setShowAddForm(true);
            }}
            className="bg-slate-900 text-amber-500 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <Plus size={18} /> Tambah
          </button>
        )}
      </div>

      {/* MODAL FORM */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="bg-slate-900 p-4 flex justify-between items-center border-b border-slate-800 shrink-0">
              <h3 className="text-amber-500 font-bold flex items-center gap-2">
                {isEditMode ? <Edit size={18}/> : <Plus size={18}/>} {modalTitle}
              </h3>
              <button onClick={handleCloseForm} className="text-slate-400 hover:text-white transition"><X size={20}/></button>
            </div>
            
            {/* Body Modal (Scrollable) */}
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {isEditMode && (
                  <input type="hidden" name="id" value={editingCandidate.id} />
                )}

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nama Kandidat</label>
                  <input 
                    name="name" 
                    placeholder="Contoh: Budi Santoso" 
                    required 
                    defaultValue={editingCandidate?.name || ''} 
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" 
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nomor Urut</label>
                  <input 
                    name="number" 
                    type="number" 
                    placeholder="1" 
                    required 
                    defaultValue={editingCandidate?.number || ''} 
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" 
                  />
                </div>
                
                {/* --- INPUT DATA DIRI --- */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">NIM</label>
                      <input name="nim" placeholder="12345678" required defaultValue={editingCandidate?.nim || ''} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Fakultas</label>
                      <input name="fakultas" placeholder="Teknik" required defaultValue={editingCandidate?.fakultas || ''} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Prodi</label>
                      <input name="prodi" placeholder="Informatika" required defaultValue={editingCandidate?.prodi || ''} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Status</label>
                      <input name="status" placeholder="Mahasiswa Aktif" required defaultValue={editingCandidate?.status || ''} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tempat Lahir</label>
                      <input name="tempat_lahir" placeholder="Jakarta" required defaultValue={editingCandidate?.tempat_lahir || ''} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tanggal Lahir</label>
                      <input name="tanggal_lahir" type="date" required defaultValue={editingCandidate?.tanggal_lahir || ''} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
                    </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Jenis Kelamin</label>
                  <select name="jenis_kelamin" required defaultValue={editingCandidate?.jenis_kelamin || ''} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500">
                    <option value="" disabled>Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                {/* --- UPLOAD FOTO --- */}
                <div className="border p-4 rounded-xl border-slate-200 bg-slate-50">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
                    <ImageIcon size={14}/> {isEditMode ? 'Ganti Foto (Opsional)' : 'Upload Foto'}
                  </label>
                  
                  {isEditMode && editingCandidate.photo_url && (
                    <div className="mb-2">
                        <p className="text-xs text-slate-400 mb-1">Foto saat ini:</p>
                        <img src={editingCandidate.photo_url} alt="Current" className="w-16 h-16 object-cover rounded-lg border border-slate-300"/>
                    </div>
                  )}
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setCandidatePhoto(e.target.files[0])} 
                    required={!isEditMode} // Wajib hanya saat tambah baru
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 p-2 bg-white border border-slate-200 rounded-lg cursor-pointer" 
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Visi Singkat</label>
                  <textarea 
                    name="vision" 
                    placeholder="Visi kandidat..." 
                    required 
                    defaultValue={editingCandidate?.vision || ''} 
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" 
                    rows="2" 
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Misi</label>
                  <textarea 
                    name="mission" 
                    placeholder="Misi kandidat..." 
                    required 
                    defaultValue={editingCandidate?.mission || ''} 
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" 
                    rows="3" 
                  />
                </div>

                <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2 mt-4 shadow-lg cursor-pointer">
                  <Save size={18}/> {submitButtonText}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* List Kandidat */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-80 bg-slate-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.length === 0 ? (
              <p className="text-slate-500 col-span-full text-center py-10">Belum ada kandidat.</p>
          ) : (
              candidates.map(c => (
                <CandidateCard 
                    key={c.id} 
                    candidate={c} 
                    role={role} 
                    onVote={onVote} 
                    onViewDetail={() => onViewDetail(c.id)} 
                    onDelete={onDelete} 
                    onEdit={handleEditClick} // Pastikan prop ini diteruskan ke Card
                    hasVoted={hasVoted} 
                  />
              ))
          )}
        </div>
      )}
    </div>
  );
};

export default CandidatesPage;