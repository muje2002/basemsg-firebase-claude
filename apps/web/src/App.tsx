import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { ChatList } from './components/ChatList';
import { ChatRoom } from './components/ChatRoom';
import { FriendsList } from './components/FriendsList';
import './styles/app.css';

export function App() {
  const [activeTab, setActiveTab] = useState<'chats' | 'friends'>('chats');

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
