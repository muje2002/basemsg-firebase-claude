interface SidebarProps {
  activeTab: 'chats' | 'friends';
  onTabChange: (tab: 'chats' | 'friends') => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <nav className="sidebar">
      <button
        className={`sidebar-tab ${activeTab === 'chats' ? 'active' : ''}`}
        onClick={() => onTabChange('chats')}
        title="채팅"
      >
        💬
      </button>
      <button
        className={`sidebar-tab ${activeTab === 'friends' ? 'active' : ''}`}
        onClick={() => onTabChange('friends')}
        title="친구"
      >
        👥
      </button>
    </nav>
  );
}
