import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { loginWithGoogle, logout } from './lib/firebase';
import { Button } from './components/ui/button';
import { Loader2 } from 'lucide-react';
import TabBar from './components/layout/TabBar';
import TopBar from './components/layout/TopBar';
import LearnPage from './pages/LearnPage';
import LessonPage from './pages/LessonPage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import VocabularyPage from './pages/VocabularyPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!user) return <Navigate to="/login" />;
  return <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden pb-16">{children}</div>;
}

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <main className="flex-1 overflow-y-auto w-full max-w-xl mx-auto flex flex-col">
        {children}
      </main>
      <TabBar />
    </>
  );
}

function LoginPage() {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (user) return <Navigate to="/" />;

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6 text-center">
      <div className="w-24 h-24 bg-green-500 rounded-3xl mb-8 flex items-center justify-center text-4xl font-black">
        B
      </div>
      <h1 className="text-3xl font-black mb-2 text-white">Bhasha</h1>
      <p className="text-zinc-400 mb-12">Learn new languages with gamified bites.</p>
      <Button size="lg" className="w-full max-w-sm bg-green-500 text-black hover:bg-green-400 font-bold" onClick={loginWithGoogle}>
        Continue with Google
      </Button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><MainLayout><LearnPage /></MainLayout></ProtectedRoute>} />
          <Route path="/lesson/:courseId/:unitId/:lessonId" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
          <Route path="/vocabulary" element={<ProtectedRoute><MainLayout><VocabularyPage /></MainLayout></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><MainLayout><LeaderboardPage /></MainLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><MainLayout><ProfilePage /></MainLayout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
