import { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";
import { ApiService } from "../services/apiService";

export default function useAppController() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [candidates, setCandidates] = useState([]);
  const [news, setNews] = useState([]);
  const [api, setApi] = useState(null);
  
  // State untuk detail page
  const [selectedCandidateId, setSelectedCandidateId] = useState(null); 
  const [selectedNews, setSelectedNews] = useState(null); 
    
  const [userVoteStatus, setUserVoteStatus] = useState({ hasVoted: false });
  const [isLoading, setIsLoading] = useState(true); 
  // Perbaiki inisialisasi electionEndDate (seharusnya date atau null)
  const [electionEndDate, setElectionEndDate] = useState(null); 

  // --- 1. STATE & HELPER UNTUK MODAL KUSTOM ---
  const [modalState, setModalState] = useState({
      isOpen: false,
      type: 'info', // 'success', 'error', 'confirm'
      title: '',
      message: '',
      isConfirm: false,
      onConfirmAction: () => {},
  });
  
  const showModal = ({ type, title, message, isConfirm = false, onConfirmAction = () => {} }) => {
      setModalState({ isOpen: true, type, title, message, isConfirm, onConfirmAction });
  };
  
  const closeModal = () => {
      setModalState(prev => ({ ...prev, isOpen: false }));
  };

  // Pengganti alert()
  const showAlert = (message, type = 'info', title = 'Pemberitahuan') => {
      showModal({ type, title, message, isConfirm: false });
  };
  
  // Pengganti confirm()
  const showConfirm = (title, message, onConfirmAction) => {
      showModal({ type: 'confirm', title, message, isConfirm: true, onConfirmAction });
  };
  // ---------------------------------------------
  
  
  // --- FUNGSI UNTUK MENGAMBIL SEMUA DATA PUBLIK (DIPISAHKAN) ---
  const fetchCandidatesAndNews = async () => {
      setIsLoading(true);
      try {
          // Mengambil Kandidat
          const { data: cData } = await supabase.from('candidates').select('*').order('number', { ascending: true });
          setCandidates(cData || []); 

          // Mengambil Berita
          const { data: nData } = await supabase.from('news').select('*').order('created_at', { ascending: false });
          setNews(nData || []);
          
      } catch (err) {
          console.error("Load Data Error: Cek RLS dan Koneksi Supabase.", err);
          setCandidates([]); 
          setNews([]);       
      } finally {
          setIsLoading(false);
      }
  };


  // ----------------------------
  // INIT APP & AUTH LISTENER
  // ----------------------------
    useEffect(() => {
        const initApp = async () => {
            const session = await supabase.auth.getSession();
            let currentUserId = null;

            if (session.data.session) {
                const userData = session.data.session.user;
                currentUserId = userData.id;
                setUser(userData);
                
                const userRole = userData.user_metadata?.role || 'voter'; 
                setRole(userRole); 
                
                const apiInstance = new ApiService(currentUserId);
                setApi(apiInstance);
            } 
            
            // --- PENGATURAN TANGGAL AWAL ---
            const storedEndDate = localStorage.getItem('electionEndDate');
            
            if (storedEndDate) {
                // Gunakan tanggal yang tersimpan di localStorage
                setElectionEndDate(new Date(storedEndDate));
            } else {
                // Jika tidak ada, tetapkan tanggal default (30 hari dari sekarang)
                const defaultDate = new Date();
                defaultDate.setDate(defaultDate.getDate() + 30);
                
                // Set state dan langsung simpan ke localStorage agar konsisten
                setElectionEndDate(defaultDate);
                localStorage.setItem('electionEndDate', defaultDate.toISOString()); 
            }
            
            // Panggil fetch data awal
            await fetchCandidatesAndNews();
        };

        initApp();
        
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                const userData = session.user;
                setUser(userData);
                const userRole = userData.user_metadata?.role || 'voter'; 
                setRole(userRole);
                const apiInstance = new ApiService(userData.id);
                setApi(apiInstance);
            } else {
                setUser(null);
                setRole(null);
                setApi(null);
                setActiveTab("home");
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

  // ----------------------------
  // LOAD DATA BERGANTUNG PADA USER/API
  // ----------------------------
  useEffect(() => {
    
    // Hanya cek apakah koneksi Supabase sudah diinisiasi
    if (!supabase) return; 

    const fetchPrivateData = async () => {
      try {
        // Hanya ambil status vote jika user benar-benar terautentikasi (bukan null atau guest)
        if (user && api && role !== 'guest') {
            const status = await api.getUserVotingStatus();
            setUserVoteStatus(status);
        } else {
             // Reset status vote jika anonim/guest
            setUserVoteStatus({ hasVoted: false });
        }
      } catch (err) {
        // Logging error agar mudah didiagnosa jika ada masalah RLS/koneksi
        console.error("Load Private Data Error:", err);
      }
    };
    
    // Periksa apakah data publik (Candidates & News) sudah dimuat
    if(candidates.length === 0 || news.length === 0) {
        fetchCandidatesAndNews();
    }
    
    fetchPrivateData();
    // Dependency list dipertahankan agar data refresh saat login/logout
  }, [user, api, role]); 
  
  // ----------------------------
  // HANDLERS OTENTIKASI
  // ----------------------------
  
    const handleLogin = async ({ email, password, role: requestedRole }) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            
            // --- VERIFIKASI PERAN BARU ---
            const session = data.session;
            const actualRole = session?.user.user_metadata?.role || 'voter';

            if (actualRole !== requestedRole) {
                // Peran tidak cocok (misal: Admin login via tombol Voter)
                
                // 1. Paksa Logout dari sesi yang salah
                await supabase.auth.signOut(); 
                
                // 2. Tampilkan pesan kesalahan yang lebih jelas
                const message = `Akses Ditolak. Akun ini terdaftar sebagai ${actualRole.toUpperCase()}. Silakan masuk melalui tombol ${actualRole.toUpperCase()}.`;
                showAlert(message, 'error', 'Peran Tidak Cocok');
                return false;
            }
            // --- AKHIR VERIFIKASI PERAN ---

            // Setelah login, panggil fetch ulang agar data kandidat ter-refresh
            await fetchCandidatesAndNews(); 
            
            // Login berhasil, navigasi akan ditangani oleh authListener
            showAlert(`Login Berhasil sebagai ${requestedRole}!`, 'success', 'Selamat Datang');
            return true;
        } catch (error) {
            console.error("Login Gagal:", error.message);
            showAlert(`Login Gagal: ${error.message}.`, 'error', 'Error Otentikasi');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async ({ email, password }) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { role: 'voter' } }
            });

            if (error) throw error;
            
            // FIX: Kembalikan true agar LoginPage bisa beralih ke mode Login
            showAlert("Pendaftaran berhasil! Silakan login menggunakan email dan password Anda.", 'success', 'Pendaftaran Sukses');
            return true; 
        } catch (error) {
            console.error("Pendaftaran Gagal:", error.message);
            showAlert(`Pendaftaran Gagal: ${error.message}.`, 'error', 'Error Pendaftaran');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuestLogin = () => {
        setRole('guest');
        setActiveTab("home");
    };

    const handleLogout = async () => {
        if (user && role !== 'guest') {
            await supabase.auth.signOut();
            showAlert("Anda telah berhasil keluar.", 'success', 'Keluar');
        } else {
            setRole(null);
            setActiveTab("home");
        }
    };


  // ----------------------------
  // HANDLERS DATA & LOGIKA
  // ----------------------------
  
    // FUNGSI UNTUK MENGATUR TANGGAL BERAKHIR PEMILIHAN
    const handleSetEndDate = (newDate) => {
        // newDate sudah berupa string ISO dari modal HomePage
        const dateObj = new Date(newDate);
        
        // 1. Update State Lokal (Agar CountdownTimer langsung refresh)
        setElectionEndDate(dateObj);
        
        // 2. Simpan secara permanen di browser (localStorage)
        localStorage.setItem('electionEndDate', dateObj.toISOString());
        
        // 3. Tampilkan notifikasi sukses
        showAlert(`Batas waktu pemilihan berhasil diatur ke ${dateObj.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}.`, 'success', 'Pengaturan Sukses');
        
        // Re-render harusnya otomatis karena state electionEndDate diubah.
    };
    
    // Logika Vote (Internal)
    const performVote = async (id) => {
        try {
            if (!api) throw new Error("API service not initialized.");
            
            await api.castVote(id, role);
            setUserVoteStatus({ hasVoted: true, candidateId: id });
            
            // FIX: Panggil fetchCandidatesAndNews() untuk mendapatkan vote_count terbaru
            await fetchCandidatesAndNews(); 
            
            setActiveTab("voting");
            setSelectedCandidateId(null);
            
            // --- [MODIFIKASI] Ubah pesan notifikasi di sini ---
            showAlert("Anda sudah mencoblos", 'success', 'Berhasil');
            
        } catch (err) {
            console.error("Vote Error:", err);
            showAlert(`Gagal memberikan suara: ${err.message || 'Error tidak diketahui'}`, 'error', 'Error Vote');
        }
    };

    const handleVote = (id) => {
        if (role === 'guest') {
             showAlert("Anda harus login sebagai Pemilih untuk memberikan suara!", 'error', 'Akses Ditolak');
             return;
        }
        showConfirm(
            "Konfirmasi Voting",
            "Yakin memilih kandidat ini? Pilihan Anda tidak dapat diubah.",
            () => performVote(id)
        );
    };

    const handleAddCandidate = async (candidateData) => { 
        if (role !== 'admin') {
            showAlert("Akses ditolak. Hanya Admin yang dapat menambahkan kandidat.", 'error', 'Akses Ditolak'); 
            return;
        }
        
        try {
          let photo_url = null;
          if (candidateData.photoFile && api) {
              photo_url = await api.uploadCandidatePhoto(candidateData.photoFile, candidateData.name); 
          }
          if (!photo_url) {
            photo_url = `https://ui-avatars.com/api/?name=${candidateData.name}&background=random`;
          }

          if (!api) throw new Error("API service not initialized.");

          await api.addCandidate({
            ...candidateData,
            photo_url: photo_url, 
            number: parseInt(candidateData.number),
            vote_count: 0,
            vision: candidateData.vision || "-",
            mission: candidateData.mission || "-",
          });

          await fetchCandidatesAndNews(); // Re-fetch setelah menambah
          showAlert(`Kandidat ${candidateData.name} berhasil ditambahkan!`, 'success', 'Tambah Kandidat Sukses');
        } catch (err) {
          console.error("Add Candidate Error:", err);
          showAlert("Gagal menambahkan kandidat. Pastikan bucket Supabase Storage sudah dikonfigurasi.", 'error', 'Error API');
        }
    };

    const handleEditCandidate = async (candidateData) => {
        if (role !== 'admin') {
          showAlert("Akses ditolak. Hanya Admin yang dapat mengedit kandidat.", 'error', 'Akses Ditolak'); 
          return;
        }

        try {
          const { id, photoFile, ...restData } = candidateData;
          let photo_url = null;

          const dataToUpdate = {
            ...restData,
            number: parseInt(restData.number),
          };

          if (photoFile && api) {
            photo_url = await api.uploadCandidatePhoto(photoFile, restData.name); 
            if (photo_url) dataToUpdate.photo_url = photo_url;
          }
          
          if (!api) throw new Error("API service not initialized.");

          await api.updateCandidate(id, dataToUpdate);

          await fetchCandidatesAndNews(); // Re-fetch setelah edit
          showAlert(`Kandidat ${restData.name} berhasil diperbarui.`, 'success', 'Edit Sukses');

        } catch (err) {
          console.error("Edit Candidate Error:", err);
          showAlert("Gagal mengedit kandidat.", 'error', 'Error Edit');
        }
    };

    const performDeleteCandidate = async (id) => {
        try {
          if (!api) throw new Error("API service not initialized.");
          await api.deleteCandidate(id);
          await fetchCandidatesAndNews(); // Re-fetch setelah hapus
          showAlert(`Kandidat berhasil dihapus.`, 'success', 'Penghapusan Sukses');
        } catch (err) {
          console.error(`[DELETE ERROR]`, err); 
          showAlert("Gagal menghapus kandidat.", 'error', 'Error Penghapusan');
        }
    };

    const handleDeleteCandidate = (id) => {
        if (role !== 'admin') {
          showAlert("Akses ditolak. Hanya Admin yang dapat menghapus kandidat.", 'error', 'Akses Ditolak'); 
          return;
        }
        showConfirm(
            "Hapus Kandidat",
            "Apakah Anda yakin ingin menghapus kandidat ini?",
            () => performDeleteCandidate(id)
        );
    };
    
    // --- LOGIKA BERITA (UPDATED: Menerima objek data, bukan prompt) ---
    
    // newsData: { title: string, content: string }
    const handleAddNews = async (newsData) => {
        // Validasi input di sini juga
        if (!newsData || !newsData.title || !newsData.content) {
             return showAlert("Data berita tidak lengkap.", 'error', 'Input Kosong');
        }

        try {
          if (!api) throw new Error("API service not initialized.");
          
          // Kirim data ke API
          await api.addNews({
            title: newsData.title,
            content: newsData.content
          });

          await fetchCandidatesAndNews(); // Re-fetch setelah menambah berita
          showAlert("Berita baru berhasil ditambahkan!", 'success', 'Sukses');
        } catch (err) {
          console.error("Add News Error:", err);
          showAlert("Gagal menambahkan berita.", 'error', 'Error');
        }
    };
        
    // newsData: { id: uuid, title: string, content: string, ... }
    const handleEditNews = async (newsData) => {
        if (role !== 'admin') {
            showAlert("Akses ditolak.", 'error', 'Akses Ditolak'); 
            return;
        }
        
        if (!newsData || !newsData.title || !newsData.content) {
             return showAlert("Data berita tidak lengkap.", 'error', 'Input Kosong');
        }

        try {
            if (!api) throw new Error("API service not initialized.");
            
            await api.updateNews(newsData.id, {
                title: newsData.title,
                content: newsData.content
            });

            await fetchCandidatesAndNews(); // Re-fetch data dari server agar sinkron
            
            // Update selectedNews jika sedang dilihat
            if (selectedNews && selectedNews.id === newsData.id) {
                setSelectedNews({ ...selectedNews, title: newsData.title, content: newsData.content });
            }
            
            showAlert(`Berita berhasil diperbarui.`, 'success', 'Sukses');

        } catch (err) {
            console.error("Edit News Error:", err);
            showAlert("Gagal mengedit berita.", 'error', 'Error');
        }
    };

    const performDeleteNews = async (id) => {
        try {
            if (!api) throw new Error("API service not initialized.");
            await api.deleteNews(id);
            await fetchCandidatesAndNews(); // Re-fetch setelah hapus berita
            if (selectedNews && selectedNews.id === id) setSelectedNews(null);
            showAlert("Berita berhasil dihapus.", 'success', 'Sukses');
        } catch (err) {
            console.error("Delete News Error:", err);
            showAlert("Gagal menghapus berita.", 'error', 'Error');
        }
    };

    const handleDeleteNews = (id) => {
        if (role !== 'admin') {
            showAlert("Akses ditolak.", 'error', 'Akses Ditolak'); 
            return;
        }
        showConfirm(
            "Hapus Berita",
            "Apakah Anda yakin ingin menghapus berita ini?",
            () => performDeleteNews(id)
        );
    };
    
    // Hapus logika onSnapshot jika ada, karena kita sudah menggunakan fetchCandidatesAndNews()


  // ----------------------------
  // RETURN 
  // ----------------------------
  return {
    user,
    role,
    activeTab,
    setActiveTab,
    candidates,
    news,
    userVoteStatus,
    selectedCandidateId,
    setSelectedCandidateId,
    selectedNews,
    setSelectedNews,
    isLoading,
    electionEndDate, 
    handleLogin, 
    handleRegister, 
    handleGuestLogin, 
    handleLogout,
    handleVote,
    handleAddCandidate, 
    handleEditCandidate, 
    handleDeleteCandidate, 
    handleAddNews,
    handleEditNews, 
    handleDeleteNews, 
    handleSetEndDate,
    
    // EXPOSURE MODAL
    modalState,
    closeModal,
  };
}