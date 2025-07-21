import React from 'react';
import LoginForm from './components/LoginForm';
import LandingPage from './pages/LandingPage';
import './App.css';

function App() {
  // Implementación temporal hasta instalar react-router-dom
  const path = window.location.pathname;
  
  if (path === '/login') {
    return <LoginForm />;
  }
  
  return <LandingPage />;
}

export default App;
