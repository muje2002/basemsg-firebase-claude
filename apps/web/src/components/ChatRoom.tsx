import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import type { Message } from '@basemsg/shared';

const CURRENT_USER_ID = 'user-1';

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '👋', '👏',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '🎉', '🎊', '🔥', '💯', '✨', '💥', '💬', '⭐',
];

// Mock messages
const MOCK_MESSAGES: Record<string, Message[]> = {
  'room-1': [
    { id: 'm1', chatRoomId: 'room-1', senderId: 'user-2', text: '다들 내일 회의 시간 괜찮으세요?', type: 'text', createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
    { id: 'm2', chatRoomId: 'room-1', senderId: 'user-3', text: '저는 2시 이후로 가능합니다', type: 'text', createdAt: new Date(Date.now() - 8 * 60000).toISOString() },
    { id: 'm3', chatRoomId: 'room-1', senderId: 'user-1', text: '저도 2시 괜찮아요', type: 'text', createdAt: new Date(Date.now() - 6 * 60000).toISOString() },
    { id: 'm4', chatRoomId: 'room-1', senderId: 'user-2', text: '내일 회의 시간 확인해주세요!', type: 'text', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  ],
  'room-2': [
    { id: 'm5', chatRoomId: 'room-2', senderId: 'user-1', text: '안녕!', type: 'text', createdAt: new Date(Date.now() - 60 * 60000).toISOString() },
    { id: 'm6', chatRoomId: 'room-2', senderId: 'user-2', text: '오늘 점심 같이 먹을래?', type: 'text', createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
  ],
  'room-3': [
    { id: 'm7', chatRoomId: 'room-3', senderId: 'user-4', text: '주말에 모이자~', type: 'text', createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  ],
  'room-4': [
    { id: 'm8', chatRoomId: 'room-4', senderId: 'user-6', text: '감사합니다 :)', type: 'text', createdAt: new Date(Date.now() - 86400000).toISOString() },
  ],
};

const ROOM_NAMES: Record<string, string> = {
  'room-1': '프로젝트 팀',
  'room-2': '김민수',
  'room-3': '가족방',
  'room-4': '이지은',
};

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      setMessages(MOCK_MESSAGES[id] ?? []);
      setShowEmoji(false);
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !id) return;

    const msg: Message = {
      id: `msg-${Date.now()}`,
      chatRoomId: id,
      senderId: CURRENT_USER_ID,
      text,
      type: 'text',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    setInput('');
    setShowEmoji(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttach = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,video/*,.pdf,.doc,.docx,.txt';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && id) {
        const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file';
        const msg: Message = {
          id: `msg-${Date.now()}`,
          chatRoomId: id,
          senderId: CURRENT_USER_ID,
          text: type === 'image' ? '📷 사진' : type === 'video' ? '🎬 동영상' : `📎 ${file.name}`,
          type,
          fileName: file.name,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, msg]);
      }
    };
    fileInput.click();
  };

  if (!id) return null;

  const roomName = ROOM_NAMES[id] ?? '채팅방';

  return (
    <>
      <div className="chat-header">
        <div className="chat-avatar">{roomName[0]}</div>
        <h3>{roomName}</h3>
      </div>

      <div className="messages-area">
        {messages.map((msg) => {
          const isOwn = msg.senderId === CURRENT_USER_ID;
          const isEmoji = msg.type === 'emoji';
          const isAttachment = msg.type === 'image' || msg.type === 'video' || msg.type === 'file';
          return (
            <div key={msg.id} className={`message-row ${isOwn ? 'own' : 'other'}`}>
              <div className={`message-bubble ${isOwn ? 'own' : 'other'} ${isEmoji ? 'emoji-msg' : ''}`}>
                {isAttachment && (
                  <div className="attachment-label">
                    {msg.type === 'image' ? '📷' : msg.type === 'video' ? '🎬' : '📎'} {msg.fileName ?? msg.type}
                  </div>
                )}
                {msg.text}
              </div>
              <span className="message-time">{formatTime(msg.createdAt)}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {showEmoji && (
        <div className="emoji-picker">
          {EMOJI_LIST.map((emoji, i) => (
            <button key={i} onClick={() => setInput((prev) => prev + emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="input-area">
        <button className="attach-btn" onClick={handleAttach} title="첨부">
          ➕
        </button>
        <button
          className="emoji-btn"
          onClick={() => setShowEmoji(!showEmoji)}
          title="이모티콘"
        >
          😊
        </button>
        <div className="input-wrapper">
          <textarea
            rows={1}
            placeholder="메시지 입력..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowEmoji(false)}
          />
        </div>
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!input.trim()}
          title="보내기"
        >
          ➤
        </button>
      </div>
    </>
  );
}
