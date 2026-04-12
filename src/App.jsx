import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import TranslationPage from './pages/TranslationPage'
import PhraseLibraryPage from './pages/PhraseLibraryPage' 
import AboutPage from './pages/AboutPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import ProfilePage from './pages/ProfilePage'
import HistoryPage from './pages/HistoryPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
        <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B]">
          <Navbar />

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/translate" element={<ProtectedRoute><TranslationPage /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/phrases" element={<ProtectedRoute><PhraseLibraryPage /></ProtectedRoute>} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </div>

        <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 2500,
          style: {
            background: '#0F172A',
            color: '#F8FAFC',
            fontSize: '14px',
            borderRadius: '12px',
          },
          success: {
            iconTheme: { primary: '#0D9488', secondary: '#F8FAFC' },
          },
          error: {
            iconTheme: { primary: '#f87171', secondary: '#F8FAFC' },
          },
        }}
      />
      </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
