import { supabase } from '../config/supabaseClient';

export class ApiService {
  constructor(userId) {
    this.userId = userId;
  }

  /**
   * Mengunggah file foto kandidat ke Supabase Storage.
   * @param {File} file - Objek File yang akan diunggah.
   * @param {string} candidateName - Nama kandidat untuk dijadikan bagian dari nama file unik.
   * @returns {Promise<string>} URL publik dari foto yang diunggah.
   */
  async uploadCandidatePhoto(file, candidateName) {
    if (!file) {
      console.warn("API: Tidak ada file yang dipilih untuk upload.");
      return null;
    }

    // 1. Persiapan Nama File
    // Bersihkan nama kandidat: hapus spasi, ganti dengan underscore, hapus karakter spesial
    const cleanName = candidateName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileExt = file.name.split('.').pop();
    const fileName = `${cleanName}-${Date.now()}.${fileExt}`;
    const filePath = `candidates/${fileName}`; // Path: folder/namafile

    console.log(`API: Mencoba upload ke bucket 'candidate_photos' dengan path: ${filePath}`);

    try {
      // 2. Upload file ke Supabase Storage
      // PENTING: Nama bucket ditulis langsung 'candidate_photos' (huruf kecil)
      const { data, error: uploadError } = await supabase.storage
        .from('candidate_photos') 
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Gagal Upload ke Storage:", uploadError);
        // Menampilkan pesan spesifik jika error karena hak akses
        if (uploadError.statusCode === '403' || uploadError.error === 'Unauthorized') {
             throw new Error("Akses ditolak. Pastikan Anda sudah LOGIN atau Policy Storage sudah benar.");
        }
        throw uploadError;
      }

      // 3. Mendapatkan URL publik dari file yang diunggah
      const { data: publicUrlData } = supabase.storage
        .from('candidate_photos')
        .getPublicUrl(filePath);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error("File terupload, tapi gagal mendapatkan URL publik.");
      }

      console.log("API: Upload berhasil, URL:", publicUrlData.publicUrl);
      return publicUrlData.publicUrl;

    } catch (error) {
      console.error("API Error uploadCandidatePhoto:", error);
      throw new Error(`Gagal mengunggah foto: ${error.message || error}`);
    }
  }

  // --- KANDIDAT ---

  async getCandidates() {
    console.log("API: Mengambil daftar kandidat...");
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('number', { ascending: true });
      
    if (error) {
      console.error("Error getCandidates:", error);
      throw error;
    }
    return { data };
  }
  
  async addCandidate(candidateData) {
    console.log("API: Menambahkan kandidat baru ke database...");
    const { data, error } = await supabase
      .from('candidates')
      .insert([candidateData])
      .select();

    if (error) {
      console.error("Error addCandidate (DB):", error);
      throw error;
    }
    return { data };
  }

  async updateCandidate(id, updates) {
    console.log(`API: Memperbarui kandidat ID ${id}...`);
    const { data, error } = await supabase
      .from('candidates')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error("Error updateCandidate:", error);
      throw error;
    }
    return { data };
  }

  async deleteCandidate(id) {
    console.log(`API: Menghapus kandidat ID ${id}...`);
    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleteCandidate:", error);
      throw error;
    }
    return true;
  }

  // --- VOTING ---
  
  async getUserVotingStatus() {
    if (!this.userId) return { hasVoted: false, candidateId: null };
    
    console.log(`API: Cek status voting untuk user ${this.userId}...`);
    
    const { data, error } = await supabase
      .from('votes')
      .select('candidate_id')
      .eq('user_id', this.userId)
      .limit(1)
      .single(); 
    
    if (error) {
       if (error.code !== 'PGRST116' && error.code !== '204') {
           console.error("Error getUserVotingStatus:", error);
       } else {
           // Data tidak ditemukan, user belum voting
           return { hasVoted: false, candidateId: null };
       }
    }

    if (data) {
       return { hasVoted: true, candidateId: data.candidate_id };
    }
    return { hasVoted: false, candidateId: null };
  }

  async castVote(candidateId, userRole) {
    console.log(`API: Melakukan vote untuk user ${this.userId} pada kandidat ${candidateId}...`);
    if (userRole !== 'voter' && userRole !== 'admin') {
        throw new Error("Akses ditolak. Hanya Pemilih yang sah.");
    }

    const status = await this.getUserVotingStatus();
    if (status.hasVoted) {
        throw new Error("Anda sudah menggunakan hak suara!");
    }

    const { error: insertError } = await supabase
      .from('votes')
      .insert([{ user_id: this.userId, candidate_id: candidateId, role: userRole }]);
    
    if (insertError) {
        console.error("Error castVote (insert):", insertError);
        throw insertError;
    }

    // Menggunakan RPC untuk increment
    const { error: updateError } = await supabase.rpc('increment_vote', { 
        row_id: candidateId 
    });
    
    if (updateError) {
        console.warn("Warning: RPC 'increment_vote' failed. Falling back to manual update.", updateError);
        
        try {
            const { data: current, error: fetchError } = await supabase
                .from('candidates')
                .select('vote_count')
                .eq('id', candidateId)
                .single();
            
            if (fetchError) throw fetchError;

            const newCount = (current?.vote_count || 0) + 1;
            const { error: manualUpdateError } = await supabase
                .from('candidates')
                .update({ vote_count: newCount })
                .eq('id', candidateId);

            if (manualUpdateError) throw manualUpdateError;
            console.log("Fallback manual update successful.");
            
        } catch (manualError) {
             console.error("Critical Error: Fallback manual update also failed.", manualError);
             throw new Error(`Gagal memperbarui hitungan suara: ${manualError.message}`);
        }
    }
    
    return true;
  }

  // --- BERITA ---
  async getNews() {
    console.log("API: Mengambil daftar berita...");
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
        console.error("Error getNews:", error);
        throw error;
    }
    return { data };
  }
  
  async addNews(newsData) {
    console.log("API: Menambahkan berita baru...");
    const { data, error } = await supabase
      .from('news')
      .insert([newsData])
      .select();

    if (error) {
        console.error("Error addNews:", error);
        throw error;
    }
    return { data };
  }
  
  async updateNews(id, updates) {
    console.log(`API: Memperbarui berita ID ${id}...`);
    const { data, error } = await supabase
      .from('news')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
        console.error("Error updateNews:", error);
        throw error;
    }
    return { data };
  }
  
  async deleteNews(id) {
    console.log(`API: Menghapus berita ID ${id}...`);
    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id);

    if (error) {
        console.error("Error deleteNews:", error);
        throw error;
    }
    return true;
  }
}