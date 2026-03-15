import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface ChatRoomDisplay {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

// Mock data for initial development — will switch to API
const MOCK_ROOMS: ChatRoomDisplay[] = [
  { id: 'room-1', name: '프로젝트 팀', lastMessage: '내일 회의 시간 확인해주세요!', lastMessageAt: new Date(Date.now() - 5 * 60000).toISOString(), unreadCount: 3 },
  { id: 'room-2', name: '김민수', lastMessage: '오늘 점심 같이 먹을래?', lastMessageAt: new Date(Date.now() - 30 * 60000).toISOString(), unreadCount: 1 },
  { id: 'room-3', name: '가족방', lastMessage: '주말에 모이자~', lastMessageAt: new Date(Date.now() - 2 * 3600000).toISOString(), unreadCount: 0 },
  { id: 'room-4', name: '이지은', lastMessage: '감사합니다 :)', lastMessageAt: new Date(Date.now() - 86400000).toISOString(), unreadCount: 0 },
];

function formatTime(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 86400000) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export function ChatList() {
  const [rooms, setRooms] = useState<ChatRoomDisplay[]>(MOCK_ROOMS);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = search
    ? rooms.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.lastMessage?.toLowerCase().includes(search.toLowerCase()))
    : rooms;

  return (
    <>
      <div className="panel-header">
        <h2>채팅</h2>
        <button title="새 채팅">✏️</button>
      </div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="채팅방, 메시지 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="chat-list">
        {filtered.map((room) => (
          <div
            key={room.id}
            className="chat-item"
            onClick={() => navigate(`/chat/${room.id}`)}
          >
            <div className="chat-avatar">{room.name[0]}</div>
            <div className="chat-info">
              <div className="chat-info-top">
                <span className="chat-name">{room.name}</span>
                <span className="chat-time">{formatTime(room.lastMessageAt)}</span>
              </div>
              <div className="chat-last-msg">{room.lastMessage}</div>
            </div>
            {room.unreadCount > 0 && (
              <span className="unread-badge">{room.unreadCount}</span>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state" style={{ padding: 40 }}>
            <p>{search ? '검색 결과가 없습니다' : '채팅방이 없습니다'}</p>
          </div>
        )}
      </div>
    </>
  );
}
