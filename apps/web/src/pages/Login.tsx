import { useState } from 'react';
import { SignIn, SignUp } from '@clerk/react';
import '../styles/login.css';

export function Login() {
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">basemsg</h1>
        <p className="login-subtitle">
          {isSignUpMode ? '새 계정을 만들어 시작하세요' : '로그인하여 시작하세요'}
        </p>
        <div className="clerk-form">
          {isSignUpMode ? (
            <SignUp
              signInUrl="#"
              appearance={{
                elements: {
                  rootBox: { width: '100%' },
                  cardBox: { boxShadow: 'none', width: '100%' },
                  card: { boxShadow: 'none', width: '100%' },
                },
              }}
            />
          ) : (
            <SignIn
              signUpUrl="#"
              appearance={{
                elements: {
                  rootBox: { width: '100%' },
                  cardBox: { boxShadow: 'none', width: '100%' },
                  card: { boxShadow: 'none', width: '100%' },
                },
              }}
            />
          )}
        </div>
        <button
          type="button"
          className="login-switch"
          onClick={() => setIsSignUpMode(!isSignUpMode)}
        >
          {isSignUpMode ? '이미 계정이 있나요? ' : '계정이 없나요? '}
          <span className="login-switch-highlight">
            {isSignUpMode ? '로그인' : '회원가입'}
          </span>
        </button>
      </div>
    </div>
  );
}
