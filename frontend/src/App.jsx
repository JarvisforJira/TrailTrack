import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginForm from './components/LoginForm.jsx';
import Dashboard from './components/Dashboard.jsx';
import Pipeline from './components/Pipeline.jsx';
import Accounts from './components/Accounts.jsx';
import Contacts from './components/Contacts.jsx';
import Leads from './components/Leads.jsx';
import Activities from './components/Activities.jsx';
import Tasks from './components/Tasks.jsx';

function AppContent() {
  const { user, token, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [message, setMessage] = useState('');

  // Show login if not authenticated
  if (!token || !user) {
    return <LoginForm />;
  }

  const navigation = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'pipeline', label: 'Pipeline' },
    { key: 'leads', label: 'Leads' },
    { key: 'accounts', label: 'Accounts' },
    { key: 'contacts', label: 'Contacts' },
    { key: 'activities', label: 'Activities' },
    { key: 'tasks', label: 'Tasks' }
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'pipeline':
        return <Pipeline />;
      case 'leads':
        return <Leads />;
      case 'accounts':
        return <Accounts />;
      case 'contacts':
        return <Contacts />;
      case 'activities':
        return <Activities />;
      case 'tasks':
        return <Tasks />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div>
      <header className="header">
        <div className="container">
          <h1>TrailTrack CRM</h1>
          <nav className="nav">
            {navigation.map(item => (
              <button
                key={item.key}
                className={currentView === item.key ? 'active' : ''}
                onClick={() => setCurrentView(item.key)}
              >
                {item.label}
              </button>
            ))}
            <button onClick={logout} style={{ marginLeft: '20px' }}>
              Logout ({user.name})
            </button>
          </nav>
        </div>
      </header>

      <main className="container">
        {message && (
          <div className={message.type === 'error' ? 'error' : 'success'}>
            {message.text}
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
