
import React from 'react';
import { UserCircle2, ArrowRight, ClipboardList, Sparkles, LogIn } from 'lucide-react';
import { Interviewer } from '../types';
import { initiateGoogleLogin } from '../services/googleAuthService';

interface LandingPageProps {
  onEnter: (interviewer: Interviewer) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = (document.getElementById('name') as HTMLInputElement).value;
    const dept = (document.getElementById('dept') as HTMLInputElement).value;
    if (name && dept) {
      onEnter({ name, department: dept });
    }
  };

  const handleGoogleLogin = () => {
    // Google 로그인 시작 전에 임시 면접관 정보 저장
    localStorage.setItem('pending_google_login', 'true');
    initiateGoogleLogin();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-50"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm mb-6 animate-bounce">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-slate-600">InterViewPro: Intelligence Hub</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">반갑습니다, 면접관님!</h1>
          <p className="text-slate-500">정교한 인재 채용을 위한 인터뷰 기록 시스템입니다.</p>
        </div>

        <div className="bg-white p-10 rounded-[32px] shadow-2xl shadow-indigo-100/50 border border-slate-100 transition-all hover:border-indigo-100">
          <div className="flex justify-center mb-8">
            <div className="bg-indigo-50 p-4 rounded-3xl">
              <UserCircle2 className="w-12 h-12 text-indigo-600" />
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-2">면접 시스템 로그인</h2>
              <p className="text-sm text-slate-500">Google 계정으로 간편하게 시작하세요</p>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-slate-50 text-slate-900 font-bold py-6 px-6 rounded-2xl transition-all border-2 border-slate-200 hover:border-indigo-300 flex items-center justify-center gap-3 group shadow-lg hover:shadow-xl"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google 계정으로 시작하기
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Greeting ATS 연동</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>Gemini AI Analytics</span>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-8 text-xs text-slate-400">
          본 시스템은 기업 내부용이며 모든 기록은 사내 채용 데이터로 안전하게 보관됩니다.
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
