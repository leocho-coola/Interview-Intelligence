// Google OAuth 2.0 인증 서비스

const CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_SECRET;

// 현재 호스트에 맞게 리디렉션 URI 동적 생성
const getRedirectUri = () => {
  const origin = window.location.origin;
  return `${origin}/auth/callback`;
};

const REDIRECT_URI = getRedirectUri();

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly'
].join(' ');

/**
 * Google OAuth 로그인 시작
 */
export const initiateGoogleLogin = () => {
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  
  console.log('🔑 OAuth Configuration:');
  console.log('  - Client ID:', CLIENT_ID);
  console.log('  - Redirect URI:', REDIRECT_URI);
  console.log('  - Current Origin:', window.location.origin);
  console.log('  - Full URL:', window.location.href);
  
  authUrl.searchParams.append('client_id', CLIENT_ID || '');
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', SCOPES);
  authUrl.searchParams.append('access_type', 'offline');
  authUrl.searchParams.append('prompt', 'consent');

  console.log('🌐 Full Auth URL:', authUrl.toString());
  
  // 새 창에서 Google 로그인 열기
  window.location.href = authUrl.toString();
};

/**
 * Authorization Code를 Access Token으로 교환
 */
export const exchangeCodeForToken = async (code: string): Promise<string | null> => {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID || '',
        client_secret: CLIENT_SECRET || '',
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      console.error('Token exchange failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    // Access Token을 localStorage에 저장
    if (data.access_token) {
      localStorage.setItem('google_access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('google_refresh_token', data.refresh_token);
      }
      return data.access_token;
    }

    return null;
  } catch (error) {
    console.error('Token exchange error:', error);
    return null;
  }
};

/**
 * 저장된 Access Token 가져오기
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem('google_access_token');
};

/**
 * 로그인 여부 확인
 */
export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

/**
 * 로그아웃 (토큰 삭제)
 */
export const logout = () => {
  localStorage.removeItem('google_access_token');
  localStorage.removeItem('google_refresh_token');
};
