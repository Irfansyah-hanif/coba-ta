import { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";
import { ApiService } from "../services/apiService";

export default function useAppController() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  
  const [activeTab, setActiveTab] = useState(() => {
      return localStorage.getItem('activeTab') || "home";
  });
  
  useEffect(() => {
      localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const [candidates, setCandidates] = useState([]);
  const [news, setNews] = useState([]);
  const [api, setApi] = useState(null);
  
  const [selectedCandidateId, setSelectedCandidateId] = useState(null); 
  const [selectedNews, setSelectedNews] = useState(null); 
    
  const [userVoteStatus, setUserVoteStatus] = useState({ hasVoted: false });
  const [isLoading, setIsLoading] = useState(true); 
  const [electionEndDate, setElectionEndDate] = useState(null); 

  const [modalState, setModalState] = useState({
      isOpen: false,
      type: 'info',
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

  const showAlert = (message, type = 'info', title = 'Pemberitahuan') => {
      showModal({ type, title, message, isConfirm: false });
  };
  
  const showConfirm = (title, message, onConfirmAction) => {
      showModal({ type: 'confirm', title, message, isConfirm: true, onConfirmAction });
  };

  const fetchCandidatesAndNews = async () => {
      setIsLoading(true);
      try {
          const { data: cData } = await supabase.from('candidates').select('*').order('number', { ascending: true });
          setCandidates(cData || []); 

          const { data: nData } = await supabase.from('news').select('*').order('created_at', { ascending: false });
          setNews(nData || []);
          
      } catch (err) {
          console.error("Load Data Error", err);
          setCandidates([]); 
          setNews([]);       
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
      const initApp = async () => {
          const session = await supabase.auth.getSession();
          
          if (session.data.session) {
              const userData = session.data.session.user;
              setUser(userData);
              const userRole = userData.user_metadata?.role || 'voter'; 
              setRole(userRole); 
              const apiInstance = new ApiService(userData.id);
              setApi(apiInstance);
          } 
          
          const storedEndDate = localStorage.getItem('electionEndDate');
          if (storedEndDate) {
              setElectionEndDate(new Date(storedEndDate));
          } else {
              const defaultDate = new Date();
              defaultDate.setDate(defaultDate.getDate() + 30);
              setElectionEndDate(defaultDate);
              localStorage.setItem('electionEndDate', defaultDate.toISOString()); 
          }
          
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
              // Reset state saat auth state berubah menjadi null (logout)
              // Ini backup jika handleLogout manual tidak cukup
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

  useEffect(() => {
    if (!user) return;

    const channels = supabase.channel('realtime-voting')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
             setUserVoteStatus({ hasVoted: false, candidateId: null });
             showAlert("Data pemilihan telah di-reset oleh Admin. Anda dapat memilih kembali.", "info", "Reset Pemilihan");
          } 
          else if (payload.eventType === 'INSERT') {
             setUserVoteStatus({ hasVoted: true, candidateId: payload.new.candidate_id });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'candidates' },
        () => {
           fetchCandidatesAndNews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channels);
    };
  }, [user]);

  useEffect(() => {
    if (!supabase) return; 

    const fetchPrivateData = async () => {
      try {
        if (user && api && role !== 'guest') {
            const status = await api.getUserVotingStatus();
            setUserVoteStatus(status);
        } else {
            setUserVoteStatus({ hasVoted: false });
        }
      } catch (err) {
        console.error("Load Private Data Error:", err);
      }
    };
    
    if(candidates.length === 0 || news.length === 0) {
        fetchCandidatesAndNews();
    }
    
    fetchPrivateData();
  }, [user, api, role]); 
  
    const handleLogin = async ({ email, password, role: requestedRole }) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            
            const session = data.session;
            const actualRole = session?.user.user_metadata?.role || 'voter';

            if (actualRole !== requestedRole) {
                await supabase.auth.signOut(); 
                showAlert(`Akun ini terdaftar sebagai ${actualRole.toUpperCase()}.`, 'error', 'Peran Tidak Cocok');
                return false;
            }

            await fetchCandidatesAndNews(); 
            showAlert(`Login Berhasil!`, 'success', 'Selamat Datang');
            return true;
        } catch (error) {
            showAlert(`Login Gagal: ${error.message}`, 'error', 'Error');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async ({ email, password, fullName }) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { 
                    data: { 
                        role: 'voter',
                        full_name: fullName 
                    } 
                }
            });

            if (error) throw error;
            
            showAlert("Pendaftaran berhasil! Silakan login.", 'success', 'Sukses');
            return true; 
        } catch (error) {
            showAlert(`Pendaftaran Gagal: ${error.message}`, 'error', 'Error');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateProfile = async (fullName) => {
        if (!fullName.trim()) {
            showAlert("Nama tidak boleh kosong.", 'error', 'Validasi Gagal');
            return;
        }
        
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });

            if (error) throw error;

            setUser(data.user);
            
            showAlert("Profil berhasil diperbarui!", 'success', 'Sukses');
        } catch (error) {
            console.error("Update Profile Error:", error);
            showAlert(`Gagal update profil: ${error.message}`, 'error', 'Error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuestLogin = () => {
        setRole('guest');
        setActiveTab("home");
    };

    // --- MODIFIKASI: FUNGSI LOGOUT YANG LEBIH AMAN ---
    const handleLogout = async () => {
        // 1. Coba logout ke server Supabase (dibungkus try-catch agar tidak memblokir UI jika error)
        try {
            if (user && role !== 'guest') {
                await supabase.auth.signOut();
            }
        } catch (err) {
            console.warn("Logout server warning:", err);
        }

        // 2. FORCE RESET STATE (WAJIB DILAKUKAN)
        // Ini memastikan UI langsung kembali ke Login, terlepas dari respon server
        setUser(null);
        setRole(null);
        setApi(null);
        
        // Reset penyimpanan lokal
        localStorage.setItem('activeTab', 'home');
        setActiveTab("home");
        
        // Tampilkan notifikasi
        showAlert("Berhasil keluar.", 'success', 'Logout');
    };
    // ------------------------------------------------

    const handleSetEndDate = (newDate) => {
        const dateObj = new Date(newDate);
        setElectionEndDate(dateObj);
        localStorage.setItem('electionEndDate', dateObj.toISOString());
        showAlert(`Waktu diubah.`, 'success', 'Sukses');
    };
    
    const performVote = async (id) => {
        try {
            if (!api) throw new Error("API service not initialized.");
            
            if (electionEndDate && new Date() > electionEndDate) {
                throw new Error("Waktu pemilihan sudah habis!");
            }

            await api.castVote(id, role);
            setUserVoteStatus({ hasVoted: true, candidateId: id });
            
            await fetchCandidatesAndNews(); 
            
            setActiveTab("voting");
            setSelectedCandidateId(null);
            showAlert("Suara Anda telah direkam!", 'success', 'Berhasil');
            
        } catch (err) {
            showAlert(err.message, 'error', 'Gagal');
        }
    };

    const handleVote = (id) => {
        if (role === 'guest') {
             showAlert("Silakan login sebagai Pemilih.", 'error', 'Akses Ditolak');
             return;
        }
        
        if (electionEndDate && new Date() > electionEndDate) {
            showAlert("Waktu pemilihan sudah habis. Anda tidak dapat memilih.", 'error', 'Waktu Habis');
            return;
        }

        showConfirm(
            "Konfirmasi",
            "Yakin memilih kandidat ini? Pilihan tidak dapat diubah.",
            () => performVote(id)
        );
    };

    const handleAddCandidate = async (candidateData) => { 
        if (role !== 'admin') return;
        
        try {
          let photo_url = null;
          if (candidateData.photoFile && api) {
              photo_url = await api.uploadCandidatePhoto(candidateData.photoFile, candidateData.name); 
          }
          if (!photo_url) photo_url = `https://ui-avatars.com/api/?name=${candidateData.name}`;

          if (!api) throw new Error("API error");

          const { photoFile, ...dataForDatabase } = candidateData;

          await api.addCandidate({
            ...dataForDatabase,
            photo_url: photo_url, 
            number: parseInt(candidateData.number),
            vote_count: 0,
            vision: candidateData.vision || "-",
            mission: candidateData.mission || "-",
            position: candidateData.position || "Calon Ketua" 
          });

          await fetchCandidatesAndNews();
          showAlert(`Kandidat berhasil ditambahkan!`, 'success', 'Sukses');
        } catch (err) {
          console.error(err);
          showAlert("Gagal menambahkan kandidat.", 'error', 'Error');
        }
    };

    const handleEditCandidate = async (candidateData) => {
        if (role !== 'admin') return;

        try {
          const { id, photoFile, ...restData } = candidateData;
          let photo_url = null;

          const dataToUpdate = {
            ...restData,
            number: parseInt(restData.number),
            position: restData.position || "Calon Ketua"
          };

          if (photoFile && api) {
            photo_url = await api.uploadCandidatePhoto(photoFile, restData.name); 
            if (photo_url) dataToUpdate.photo_url = photo_url;
          }
          
          if (!api) throw new Error("API Error");
          await api.updateCandidate(id, dataToUpdate);

          await fetchCandidatesAndNews();
          showAlert(`Data berhasil diperbarui.`, 'success', 'Sukses');
        } catch (err) {
          showAlert("Gagal mengedit kandidat.", 'error', 'Error');
        }
    };

    const performDeleteCandidate = async (id) => {
        try {
          if (!api) throw new Error("API Error");
          await api.deleteCandidate(id);
          await fetchCandidatesAndNews();
          showAlert(`Kandidat dihapus.`, 'success', 'Sukses');
        } catch (err) {
          showAlert("Gagal menghapus.", 'error', 'Error');
        }
    };

    const handleDeleteCandidate = (id) => {
        if (role !== 'admin') return;
        showConfirm("Hapus Kandidat", "Yakin hapus data ini?", () => performDeleteCandidate(id));
    };
    
    const handleAddNews = async (newsData) => {
        try {
          if (!api) throw new Error("API Error");
          await api.addNews(newsData);
          await fetchCandidatesAndNews();
          showAlert("Berita ditambahkan!", 'success', 'Sukses');
        } catch (err) {
          showAlert("Gagal menambah berita.", 'error', 'Error');
        }
    };
        
    const handleEditNews = async (newsData) => {
        if (role !== 'admin') return;
        try {
            if (!api) throw new Error("API Error");
            await api.updateNews(newsData.id, {
                title: newsData.title,
                content: newsData.content
            });
            await fetchCandidatesAndNews();
            if (selectedNews && selectedNews.id === newsData.id) {
                setSelectedNews({ ...selectedNews, ...newsData });
            }
            showAlert(`Berita diperbarui.`, 'success', 'Sukses');
        } catch (err) {
            showAlert("Gagal edit berita.", 'error', 'Error');
        }
    };

    const performDeleteNews = async (id) => {
        try {
            if (!api) throw new Error("API Error");
            await api.deleteNews(id);
            await fetchCandidatesAndNews(); 
            if (selectedNews && selectedNews.id === id) setSelectedNews(null);
            showAlert("Berita dihapus.", 'success', 'Sukses');
        } catch (err) {
            showAlert("Gagal hapus berita.", 'error', 'Error');
        }
    };

    const handleDeleteNews = (id) => {
        if (role !== 'admin') return;
        showConfirm("Hapus Berita", "Yakin hapus?", () => performDeleteNews(id));
    };

    const handleResetElection = () => {
        if (role !== 'admin') return;
        showConfirm(
            "Reset Hasil Pemilihan",
            "Tindakan ini akan MENGHAPUS SEMUA SUARA dan mengembalikan skor menjadi 0. Pemilih dapat memilih kembali.",
            async () => {
                try {
                    if (!api) throw new Error("API Error");
                    await api.resetElection();
                    
                    setUserVoteStatus({ hasVoted: false });
                    
                    await fetchCandidatesAndNews();
                    showAlert("Pemilihan berhasil di-reset. Pemilih dapat melakukan voting ulang.", 'success', 'Reset Berhasil');
                } catch (err) {
                    showAlert(`Gagal reset: ${err.message}`, 'error', 'Error');
                }
            }
        );
    };

  return {
    user, role, activeTab, setActiveTab,
    candidates, news, userVoteStatus,
    selectedCandidateId, setSelectedCandidateId,
    selectedNews, setSelectedNews,
    isLoading, electionEndDate, 
    handleLogin, handleRegister, handleGuestLogin, handleLogout,
    handleVote, handleAddCandidate, handleEditCandidate, handleDeleteCandidate, 
    handleAddNews, handleEditNews, handleDeleteNews, 
    handleSetEndDate, handleResetElection, 
    handleUpdateProfile,
    modalState, closeModal,
  };
}