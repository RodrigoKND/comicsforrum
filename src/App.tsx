import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Chatbot from './components/common/Chatbot';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import PostDetail from './pages/PostDetail';
import PublishPage from './pages/PublishPage';
import AuthPage from './pages/AuthPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-black">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/:category" element={<CategoryPage />} />
              <Route path="/post/:id" element={<PostDetail />} />
              <Route path="/publish" element={<PublishPage />} />
              <Route path="/login" element={<AuthPage />} />
            </Routes>
          </main>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#ffffff',
                border: '1px solid #374151',
              },
            }}
          />
          <Chatbot />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;