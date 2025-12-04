import React, { useState } from 'react'; 
import { Plus, Edit, Trash2, X, Save, Newspaper } from 'lucide-react';

const NewsPage = ({ news, role, onAddNews, onViewDetail, onEditNews, onDeleteNews }) => {
    // State untuk Modal Tambah/Edit
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null); // Jika null berarti mode Tambah

    // Helper untuk format tanggal
    const getDisplayDate = (item) => {
        const dateStr = item.date || item.created_at;
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    };

    // Handler Tombol Tambah
    const handleAddNew = () => {
        setEditingItem(null);
        setShowForm(true);
    };

    // Handler Tombol Edit
    const handleEditClick = (e, item) => {
        e.stopPropagation(); // Mencegah klik tembus ke detail
        setEditingItem(item);
        setShowForm(true);
    };

    // Handler Submit Form
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const newsData = {
            title: formData.get('title'),
            content: formData.get('content'),
        };

        if (editingItem) {
            // Mode Edit: Kirim ID dan Data baru
            onEditNews({ id: editingItem.id, ...newsData });
        } else {
            // Mode Tambah
            onAddNews(newsData);
        }

        setShowForm(false);
        setEditingItem(null);
    };

    return (
    <div className="p-6 animate-fade-in pb-24">
      <div className="mb-6 border-l-4 border-amber-500 pl-3">
            <h2 className="text-2xl font-bold text-slate-900 font-serif">Berita</h2>
            <p className="text-slate-500 text-xs mt-1">Informasi seputar pemilihan umum.</p>
      </div>
        
      <div className="space-y-4">
        {news.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-400">Belum ada berita.</p>
            </div>
        ) : (
            news.map(n => (
               <div 
                   key={n.id} 
                   className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 transition-shadow duration-300 hover:shadow-lg cursor-pointer" 
                   onClick={() => onViewDetail(n)} 
               >
                   <div>
                       <h3 className="font-bold text-slate-900 font-serifyb mb-1">{n.title}</h3>
                       <p className="text-xs text-slate-400 mb-3">{getDisplayDate(n)}</p>
                       <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{n.content}</p> 
                   </div>

                   {/* Tombol Aksi Admin */}
                   {role === 'admin' && (
                       <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-2">
                           <button 
                               onClick={(e) => handleEditClick(e, n)} 
                               className="text-slate-500 hover:text-blue-500 p-2 rounded-full transition bg-slate-50 hover:bg-blue-50"
                               title="Edit Berita"
                           >
                               <Edit size={18} />
                           </button>
                           <button 
                               onClick={(e) => {
                                   e.stopPropagation();
                                   onDeleteNews(n.id);
                               }}
                               className="text-slate-500 hover:text-red-500 p-2 rounded-full transition bg-slate-50 hover:bg-red-50"
                               title="Hapus Berita"
                           >
                               <Trash2 size={18} />
                           </button>
                       </div>
                   )}
               </div>
            ))
        )}
      </div>

      {role === 'admin' && (
        <button 
          onClick={handleAddNew} 
          className="w-full py-4 bg-slate-900 text-white rounded-2xl border border-dashed border-slate-700 font-bold flex items-center justify-center gap-2 mt-6 hover:bg-slate-800 transition shadow-lg"
        >
          <Plus size={18}/> Tambah Berita
        </button>
      )}

      {/* MODAL FORM BERITA */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-slate-900 p-4 flex justify-between items-center border-b border-slate-800">
                    <h3 className="text-amber-500 font-bold flex items-center gap-2">
                        <Newspaper size={18}/> {editingItem ? 'Edit Berita' : 'Tambah Berita'}
                    </h3>
                    <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white transition">
                        <X size={20}/>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Judul Berita</label>
                        <input 
                            name="title" 
                            required 
                            defaultValue={editingItem?.title || ''}
                            className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" 
                            placeholder="Masukkan judul..."
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Isi Konten</label>
                        <textarea 
                            name="content" 
                            required 
                            defaultValue={editingItem?.content || ''}
                            rows={6}
                            className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" 
                            placeholder="Tulis konten berita di sini..."
                        />
                    </div>
                    
                    <button type="submit" className="w-full bg-amber-500 text-slate-900 py-3 rounded-xl text-sm font-bold hover:bg-amber-400 transition flex items-center justify-center gap-2 mt-2 shadow-md">
                        <Save size={18}/> Simpan
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default NewsPage;