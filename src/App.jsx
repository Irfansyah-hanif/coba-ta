import React from "react";

// Controller Hook
// FIX: Menghapus ekstensi .jsx agar resolusi file oleh bundler berhasil
import useAppController from "./hooks/useAppController";

// Layout Components
// FIX: Menghapus ekstensi .jsx
import HeaderNavigation from "./components/HeaderNavigation";
import BottomNavigation from "./components/BottomNavigation";

// Pages
// FIX: Menghapus ekstensi .jsx dari semua impor halaman
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CandidatesPage from "./pages/CandidatesPage";
import VotingPage from "./pages/VotingPage";
import NewsPage from "./pages/NewsPage";
import ProfilePage from "./pages/ProfilePage";
import CandidateDetailPage from "./pages/CandidateDetailPage";
import NewsDetailPage from "./pages/NewsDetailPage";
// ---------------------------------------------------------------------

export default function App() {
  const {
    role,
    user,
    activeTab,
    setActiveTab,
    candidates,
    news,
    userVoteStatus,

    // State Kandidat
    selectedCandidateId, 
    setSelectedCandidateId, 

    // State untuk Berita
    selectedNews,
    setSelectedNews,
    
    isLoading,
    handleLogin,
    // Handler Auth
    handleRegister, 
    handleGuestLogin,
    handleLogout,

    // Handler Vote & Kandidat
    handleVote,
    handleAddCandidate,
    handleDeleteCandidate,
    handleEditCandidate,
    
    // Handler Berita
    handleAddNews,
    handleEditNews, 
    handleDeleteNews 
  } = useAppController();

  // --- LOGIKA DETAIL KANDIDAT ---
  
  const currentCandidate = candidates.find(c => c.id === selectedCandidateId);
  
  const handleViewCandidateDetail = (candidateId) => {
    setSelectedCandidateId(candidateId);
  };
  
  const handleCloseCandidateDetail = () => {
    setSelectedCandidateId(null);
  };
  
  // --- LOGIKA DETAIL BERITA ---

  const handleViewNewsDetail = (newsItem) => {
    // Saat item berita diklik, set state selectedNews
    setSelectedNews(newsItem);
  };

  const handleCloseNewsDetail = () => {
    setSelectedNews(null);
  };

  // Tentukan apakah kita berada di halaman detail (Kandidat atau Berita)
  const isViewingDetailPage = !!selectedNews || !!selectedCandidateId;


  // Jika belum pilih peran → tampilkan halaman login
  if (!role) {
    return (
      <LoginPage 
        onLogin={handleLogin} 
        onRegister={handleRegister} 
        onGuestLogin={handleGuestLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Header (Sembunyikan jika di halaman detail manapun) */}
      {!isViewingDetailPage && ( 
        <HeaderNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          role={role}
          user={user}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content */}
      <main className="md:pt-20 pb-safe md:pb-10 w-full md:max-w-7xl md:mx-auto p-4 md:p-6">

        {/* Tampilkan detail kandidat jika selectedCandidateId ada */}
        {selectedCandidateId && (
            <CandidateDetailPage 
              candidate={currentCandidate} 
              onBack={handleCloseCandidateDetail} 
              onVote={handleVote} 
              role={role}
              hasVoted={userVoteStatus.hasVoted}
              isLoading={isLoading}
            />
        )}
        
        {/* Tampilkan detail berita jika selectedNews ada */}
        {!selectedCandidateId && selectedNews && ( 
            <NewsDetailPage 
              newsItem={selectedNews} 
              onBack={handleCloseNewsDetail} 
              role={role} 
              onEditNews={handleEditNews} 
              onDeleteNews={handleDeleteNews} 
            />
        )}
        
        {/* Tampilkan Tab Utama jika tidak ada detail yang sedang dilihat */}
        {!isViewingDetailPage && ( 
          <>
            {activeTab === "home" && (
              // Komponen HomePage
              <HomePage
                role={role}
                userVoteStatus={userVoteStatus}
                setActiveTab={setActiveTab}
                news={news}
                // TAMBAH: Teruskan handler untuk melihat detail berita
                onViewNewsDetail={handleViewNewsDetail}
              />
            )}

            {activeTab === "candidates" && (
              // Komponen CandidatesPage
              <CandidatesPage
                candidates={candidates}
                role={role}
                onVote={handleVote}
                onViewDetail={handleViewCandidateDetail} 
                onAddCandidate={handleAddCandidate}
                onEditCandidate={handleEditCandidate}
                hasVoted={userVoteStatus.hasVoted}
                isLoading={isLoading}
                onDelete={handleDeleteCandidate}
              />
            )}

            {activeTab === "voting" && (
              // Komponen VotingPage
              <VotingPage candidates={candidates} />
            )}

            {activeTab === "news" && (
              // Komponen NewsPage
              <NewsPage 
                news={news} 
                role={role} 
                onAddNews={handleAddNews}
                onViewDetail={handleViewNewsDetail}
                onEditNews={handleEditNews} 
                onDeleteNews={handleDeleteNews} 
              />
            )}

            {activeTab === "profile" && (
              // Komponen ProfilePage
              <ProfilePage
                user={user}
                role={role}
                onLogout={handleLogout}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation (Sembunyikan jika di halaman detail manapun) */}
      {!isViewingDetailPage && ( 
        <BottomNavigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={handleLogout} 
          role={role} 
        />
      )}
    </div>
  );
}