import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/react';
import { Sidebar } from './components/Sidebar';
import { ChatList } from './components/ChatList';
import { ChatRoom } from './components/ChatRoom';
import { FriendsList } from './components/FriendsList';
import { Login } from './pages/Login';
import { setCurrentUserId, setTokenGetter, syncUser } from './services/api';
import { connectSocket } from './services/socket';
import './styles/app.css';

export function App() {
  const [activeTab, setActiveTab] = useState<'chats' | 'friends'>('chats');
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [isSynced, setIsSynced] = useState(false);

  // Register token getter for API service
  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  // Sync Clerk user to backend after login
  useEffect(() => {
    if (!isSignedIn || !user) return;

    (async () => {
      try {
        const backendUser = await syncUser({
          name: user.fullName ?? user.firstName ?? 'User',
          phone: user.primaryPhoneNumber?.phoneNumber ?? '',
        });
        setCurrentUserId(backendUser.id);
        connectSocket(backendUser.id);
        setIsSynced(true);
      } catch (e) {
        console.error('[App] Sync failed:', e);
      }
    })();
  }, [isSignedIn, user]);

  if (!isLoaded) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Login />;
  }

  if (!isSynced) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">동기화 중...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="panel">
        {activeTab === 'chats' && <ChatList />}
        {activeTab === 'friends' && <FriendsList />}
      </div>
      <div className="main">
        <Routes>
          <Route path="/chat/:id" element={<ChatRoom />} />
          <Route
            path="*"
            element={
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <p>채팅방을 선택하세요</p>
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  );
}
