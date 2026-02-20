
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BarChart3, 
  ClipboardList,
  UserCircle2,
  Settings as SettingsIcon,
  LayoutDashboard,
  TrendingUp
} from 'lucide-react';
import { Candidate, Interviewer, ViewState, InterviewNote, JobRole, InterviewStatus } from './types';
import { MOCK_CANDIDATES } from './constants';
import { exchangeCodeForToken } from './services/googleAuthService';
import LandingPage from './components/LandingPage';
import InterviewSession from './components/InterviewSession';
import ConsolidationView from './components/ConsolidationView';
import Analytics from './components/Analytics';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import WeeklyStats from './components/WeeklyStats';

const App: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem('interview_pro_candidates');
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // 1. 김철수, 이영희, 박민준 제거
      let filtered = parsed.filter((c: Candidate) => 
        !['c1', 'c2', 'c3'].includes(c.id)
      );
      
      // 2. calendarEventId로 중복 제거 (같은 이벤트로 만들어진 후보자 중 최신 것만 유지)
      const eventIdMap = new Map<string, Candidate>();
      filtered.forEach((c: Candidate) => {
        if (c.calendarEventId) {
          // 이미 있으면 최신 것으로 교체 (더 큰 scheduledTime)
          const existing = eventIdMap.get(c.calendarEventId);
          if (!existing || (c.scheduledTime || 0) > (existing.scheduledTime || 0)) {
            eventIdMap.set(c.calendarEventId, c);
          }
        } else {
          // calendarEventId가 없는 후보자는 그대로 유지 (수동 추가된 후보자)
          eventIdMap.set(c.id, c);
        }
      });
      
      filtered = Array.from(eventIdMap.values());
      
      // 변경사항이 있으면 localStorage 업데이트
      if (filtered.length !== parsed.length) {
        localStorage.setItem('interview_pro_candidates', JSON.stringify(filtered));
        console.log(`🧹 중복 제거: ${parsed.length}개 → ${filtered.length}개`);
      }
      
      return filtered;
    }
    return [];
  });
  
  const [currentInterviewer, setCurrentInterviewer] = useState<Interviewer | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [isAdminMode, setIsAdminMode] = useState(false);

  // OAuth Callback 처리
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      
      if (code) {
        console.log('🔑 OAuth code received, exchanging for token...');
        const token = await exchangeCodeForToken(code);
        
        if (token) {
          console.log('✅ Token received successfully!');
          
          // Google 로그인으로 들어온 경우 자동으로 면접관 설정
          const pendingGoogleLogin = localStorage.getItem('pending_google_login');
          if (pendingGoogleLogin === 'true') {
            // Google 계정 정보로 면접관 설정
            const userName = localStorage.getItem('google_user_name') || 'Google User';
            const userEmail = localStorage.getItem('google_user_email') || '';
            
            setCurrentInterviewer({ 
              name: userName, 
              department: userEmail 
            });
            localStorage.removeItem('pending_google_login');
            console.log('✅ Auto-login as', userName);
          }
          
          // 루트 경로로 리디렉션 (URL 클린업)
          window.history.replaceState({}, document.title, '/');
        } else {
          console.error('❌ Failed to exchange token');
        }
      }
    };

    handleOAuthCallback();
  }, []);

  useEffect(() => {
    localStorage.setItem('interview_pro_candidates', JSON.stringify(candidates));
  }, [candidates]);

  const addInterviewNote = (candidateId: string, note: InterviewNote) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        return { 
          ...c, 
          notes: [...c.notes, note],
          status: InterviewStatus.COMPLETED // 🆕 면접 완료 시 상태 변경
        };
      }
      return c;
    }));
    setSelectedCandidateId(null);
    setView('DASHBOARD');
  };

  const createCandidateFromEvent = (eventName: string, eventDescription: string, eventId?: string, eventStartTime?: string): string => {
    const newId = `cal-${Date.now()}`;
    
    // 이벤트 시작 시간을 timestamp로 변환 (전달되지 않으면 현재 시간 사용)
    const scheduledTimestamp = eventStartTime ? new Date(eventStartTime).getTime() : Date.now();
    
    const newCandidate: Candidate = {
      id: newId,
      name: eventName,
      role: '면접' as JobRole, // 기본 역할
      notes: [],
      scheduledTime: scheduledTimestamp, // 원래 면접 예정 시간 저장
      resumeUrl: '',
      portfolioUrl: eventDescription, // 이벤트 설명을 포트폴리오 URL로 사용
      calendarEventId: eventId, // 캘린더 이벤트 ID 저장 (중복 방지용)
      status: InterviewStatus.SCHEDULED // 🆕 초기 상태는 '예정됨'
    };
    
    setCandidates(prev => [...prev, newCandidate]);
    console.log('✅ Created candidate from calendar event:', eventName, '시간:', new Date(scheduledTimestamp).toLocaleString('ko-KR'), '상태: 예정됨');
    return newId;
  };

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);

  if (!currentInterviewer) {
    return (
      <LandingPage 
        onEnter={(interviewer) => setCurrentInterviewer(interviewer)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <nav className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-100">
            <ClipboardList className="text-white w-6 h-6" />
          </div>
          <h1 className="font-black text-xl tracking-tighter text-slate-900">InterViewPro</h1>
        </div>
        
        <div className="p-4 flex-1 space-y-2">
          {!isAdminMode && (
            <button 
              onClick={() => { setView('DASHBOARD'); setSelectedCandidateId(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === 'DASHBOARD' && !selectedCandidateId ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <LayoutDashboard className="w-5 h-5" /> 채용 보드
            </button>
          )}

          <div className="pt-4 mt-4 border-t border-slate-100">
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">HR Admin Menu</p>
            <button 
              onClick={() => { setView('WEEKLY_STATS'); setIsAdminMode(true); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === 'WEEKLY_STATS' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <TrendingUp className="w-5 h-5" /> 주간 면접 통계
            </button>
            <button 
              onClick={() => { setView('ANALYTICS'); setIsAdminMode(true); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === 'ANALYTICS' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <BarChart3 className="w-5 h-5" /> 직무 페르조나 분석
            </button>
            <button 
              onClick={() => { setView('SETTINGS'); setIsAdminMode(true); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === 'SETTINGS' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <SettingsIcon className="w-5 h-5" /> 면접 질문 관리
            </button>
          </div>
        </div>

        <div className="p-4 m-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              {currentInterviewer.name[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-slate-900 truncate">{currentInterviewer.name}</p>
              <p className="text-[10px] text-slate-500 font-bold truncate uppercase tracking-tight">{currentInterviewer.department}</p>
            </div>
          </div>
          <button 
            onClick={() => setCurrentInterviewer(null)}
            className="mt-3 w-full text-[10px] text-indigo-600 font-black hover:underline text-left uppercase tracking-widest"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {selectedCandidateId && view === 'INTERVIEW' && selectedCandidate ? (
            <InterviewSession 
              candidate={selectedCandidate}
              interviewer={currentInterviewer}
              onSave={(note) => addInterviewNote(selectedCandidateId, note)}
              onCancel={() => { setSelectedCandidateId(null); setView('DASHBOARD'); }}
            />
          ) : view === 'DASHBOARD' ? (
            <Dashboard 
              candidates={candidates} 
              onStartInterview={(id) => {
                // 🆕 상태를 'in_progress'로 변경
                setCandidates(prev => prev.map(c => 
                  c.id === id ? { ...c, status: InterviewStatus.IN_PROGRESS } : c
                ));
                setSelectedCandidateId(id);
                setView('INTERVIEW');
              }}
              onViewConsolidation={(id) => {
                setSelectedCandidateId(id);
                setView('CONSOLIDATION');
              }}
              onCreateCandidateFromEvent={createCandidateFromEvent}
            />
          ) : view === 'CONSOLIDATION' && selectedCandidate ? (
            <ConsolidationView 
              candidate={selectedCandidate}
              onBack={() => setView('DASHBOARD')}
            />
          ) : view === 'ANALYTICS' ? (
            <Analytics 
              candidates={candidates} 
              onBack={() => { setView('DASHBOARD'); setIsAdminMode(false); }}
            />
          ) : view === 'SETTINGS' ? (
            <Settings 
              onBack={() => { setView('DASHBOARD'); setIsAdminMode(false); }}
            />
          ) : view === 'WEEKLY_STATS' ? (
            <WeeklyStats 
              candidates={candidates}
              onBack={() => { setView('DASHBOARD'); setIsAdminMode(false); }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
               <div className="bg-slate-100 p-6 rounded-full mb-4">
                 <Users className="w-12 h-12 text-slate-300" />
               </div>
               <h3 className="text-xl font-bold text-slate-800">그리팅에서 후보자를 선택해주세요</h3>
               <p className="text-slate-500 mt-1">면접 링크를 통해 입장하면 해당 후보자의 기록 화면이 바로 나타납니다.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
