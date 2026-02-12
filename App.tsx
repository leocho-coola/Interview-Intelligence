
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BarChart3, 
  ClipboardList,
  UserCircle2,
  Settings,
  LayoutDashboard
} from 'lucide-react';
import { Candidate, Interviewer, ViewState, InterviewNote } from './types';
import { MOCK_CANDIDATES } from './constants';
import { exchangeCodeForToken } from './services/googleAuthService';
import LandingPage from './components/LandingPage';
import InterviewSession from './components/InterviewSession';
import ConsolidationView from './components/ConsolidationView';
import Analytics from './components/Analytics';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem('interview_pro_candidates');
    return saved ? JSON.parse(saved) : MOCK_CANDIDATES;
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
        await exchangeCodeForToken(code);
        // URL에서 code 파라미터 제거
        window.history.replaceState({}, document.title, window.location.pathname);
        // 페이지 새로고침하여 로그인 상태 반영
        window.location.reload();
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
        return { ...c, notes: [...c.notes, note] };
      }
      return c;
    }));
    setSelectedCandidateId(null);
    setView('DASHBOARD');
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
              onClick={() => { setView('ANALYTICS'); setIsAdminMode(true); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === 'ANALYTICS' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <BarChart3 className="w-5 h-5" /> 직무 페르조나 분석
            </button>
            <button 
              onClick={() => setIsAdminMode(!isAdminMode)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-slate-500 hover:bg-slate-50`}
            >
              <Settings className="w-5 h-5" /> 시스템 설정
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
                setSelectedCandidateId(id);
                setView('INTERVIEW');
              }}
              onViewConsolidation={(id) => {
                setSelectedCandidateId(id);
                setView('CONSOLIDATION');
              }}
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
