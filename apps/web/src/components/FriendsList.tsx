import { useState } from 'react';

interface FriendDisplay {
  id: string;
  name: string;
  phone: string;
}

const MOCK_FRIENDS: FriendDisplay[] = [
  { id: 'f1', name: '김민수', phone: '010-1234-5678' },
  { id: 'f2', name: '박서연', phone: '010-2345-6789' },
  { id: 'f3', name: '엄마', phone: '010-3456-7890' },
  { id: 'f4', name: '아빠', phone: '010-4567-8901' },
  { id: 'f5', name: '이지은', phone: '010-5678-9012' },
];

export function FriendsList() {
  const [friends, setFriends] = useState<FriendDisplay[]>(MOCK_FRIENDS);
  const [search, setSearch] = useState('');

  const filtered = search
    ? friends.filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.phone.includes(search),
      )
    : friends;

  const handleRemove = (id: string) => {
    if (confirm('이 친구를 삭제하시겠습니까?')) {
      setFriends((prev) => prev.filter((f) => f.id !== id));
    }
  };

  return (
    <>
      <div className="panel-header">
        <h2>친구</h2>
        <button title="친구 추가">👤+</button>
      </div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="이름, 전화번호 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="friend-count">친구 {filtered.length}명</div>
      <div className="chat-list">
        {filtered.map((friend) => (
          <div key={friend.id} className="friend-item">
            <div className="chat-avatar">{friend.name[0]}</div>
            <div className="friend-info">
              <div className="friend-name">{friend.name}</div>
              <div className="friend-phone">{friend.phone}</div>
            </div>
            <div className="friend-actions">
              <button onClick={() => handleRemove(friend.id)}>삭제</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
