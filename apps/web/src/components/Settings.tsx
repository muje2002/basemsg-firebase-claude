import { useState } from 'react';
import { useAuth, useUser } from '@clerk/react';

export function Settings() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const userName = user?.fullName ?? user?.firstName ?? '사용자';
  const userEmail =
    user?.primaryEmailAddress?.emailAddress ?? '이메일 없음';

  const handleSignOut = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      signOut();
    }
  };

  return (
    <>
      <div className="panel-header">
        <h2>설정</h2>
      </div>
      <div className="settings-content">
        {/* 내 정보 */}
        <div className="settings-section">
          <div className="settings-section-title">내 정보</div>
          <div className="settings-item">
            <span className="settings-label">이름</span>
            <span className="settings-value">{userName}</span>
          </div>
          <div className="settings-item">
            <span className="settings-label">이메일</span>
            <span className="settings-value">{userEmail}</span>
          </div>
        </div>

        {/* 알림 설정 */}
        <div className="settings-section">
          <div className="settings-section-title">알림 설정</div>
          <div className="settings-item">
            <span className="settings-label">알림</span>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {/* 앱 정보 */}
        <div className="settings-section">
          <div className="settings-section-title">앱 정보</div>
          <div className="settings-item">
            <span className="settings-label">앱 버전</span>
            <span className="settings-value">1.0.0</span>
          </div>
        </div>

        {/* 로그아웃 */}
        <div className="settings-section">
          <button className="settings-logout-btn" onClick={handleSignOut}>
            로그아웃
          </button>
        </div>
      </div>
    </>
  );
}
