interface SidebarProps {
  activeTab: 'chats' | 'friends' | 'settings';
  onTabChange: (tab: 'chats' | 'friends' | 'settings') => void;
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
      <button
        className={`sidebar-tab ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => onTabChange('settings')}
        title="설정"
      >
        ⚙️
      </button>
    </nav>
  );
}
