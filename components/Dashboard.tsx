
import React, { useState, useEffect, useMemo } from 'react';
import { Candidate } from '../types';
import { getTodayEvents, filterInterviewEvents, CalendarEvent } from '../services/calendarService';
import { initiateGoogleLogin, isAuthenticated, logout } from '../services/googleAuthService';
import { 
  UserPlus, 
  PlayCircle, 
  Eye, 
  FileBox, 
  Users, 
  ChevronRight, 
  Calendar, 
  RefreshCw,
  Clock,
  LogIn,
  LogOut
} from 'lucide-react';

interface DashboardProps {
  candidates: Candidate[];
  onStartInterview: (id: string) => void;
  onViewConsolidation: (id: string) => void;
  onCreateCandidateFromEvent?: (eventName: string, eventDescription: string, eventId?: string) => string;
}

const Dashboard: React.FC<DashboardProps> = ({ candidates, onStartInterview, onViewConsolidation, onCreateCandidateFromEvent }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleEventClick = (event: CalendarEvent) => {
    if (onCreateCandidateFromEvent) {
      // 이미 이 이벤트로 생성된 후보자가 있는지 확인
      const existingCandidate = candidates.find(c => c.calendarEventId === event.id);
      
      if (existingCandidate) {
        // 이미 생성된 후보자가 있으면 바로 면접 시작
        console.log('✅ 기존 후보자로 면접 시작:', existingCandidate.name);
        onStartInterview(existingCandidate.id);
      } else {
        // 새로운 후보자 생성 후 면접 시작
        console.log('✨ 신규 후보자 생성:', event.summary);
        const candidateId = onCreateCandidateFromEvent(event.summary, event.description || '', event.id);
        onStartInterview(candidateId);
      }
    }
  };

  // 컴포넌트 로드 시 로그인 상태 확인 + 주기적 체크
  useEffect(() => {
    const checkAuthStatus = () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);
      if (authenticated && calendarEvents.length === 0) {
        loadCalendarEvents();
      }
    };

    // 초기 체크
    checkAuthStatus();

    // 0.5초마다 인증 상태 체크 (OAuth 콜백 후 즉시 반영)
    const interval = setInterval(checkAuthStatus, 500);

    return () => clearInterval(interval);
  }, [calendarEvents.length]);

  const loadCalendarEvents = async () => {
    try {
      const events = await getTodayEvents();
      const interviewEvents = filterInterviewEvents(events);
      
      // ✅ 모든 면접 일정을 항상 표시 (필터링 제거!)
      console.log(`📅 캘린더 이벤트 로드: ${interviewEvents.length}개 표시`);
      
      // 캘린더 위젯에 모든 일정 표시
      setCalendarEvents(interviewEvents);
      
    } catch (error) {
      console.error('캘린더 로드 실패:', error);
    }
  };

  const handleSync = async () => {
    if (!isAuthenticated()) {
      alert('먼저 Google 계정으로 로그인해주세요!');
      return;
    }
    setIsSyncing(true);
    await loadCalendarEvents();
    setTimeout(() => setIsSyncing(false), 1500);
  };

  const handleGoogleLogin = () => {
    initiateGoogleLogin();
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setCalendarEvents([]);
  };

  // 오늘 날짜를 기준으로 정렬 (오늘 면접 대상자가 상단에)
  const sortedCandidates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    return [...candidates].sort((a, b) => {
      const aTime = a.scheduledTime || 0;
      const bTime = b.scheduledTime || 0;
      
      const aDate = new Date(aTime);
      aDate.setHours(0, 0, 0, 0);
      const aIsToday = aDate.getTime() === todayTimestamp;
      
      const bDate = new Date(bTime);
      bDate.setHours(0, 0, 0, 0);
      const bIsToday = bDate.getTime() === todayTimestamp;
      
      // 오늘 면접이 최우선
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;
      
      // 둘 다 오늘이면 시간순
      if (aIsToday && bIsToday) return aTime - bTime;
      
      // 둘 다 오늘이 아니면 최신순
      return bTime - aTime;
    });
  }, [candidates]);

  const formatTime = (ts?: number) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  
  const formatDate = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '내일';
    if (diffDays === -1) return '어제';
    if (diffDays > 1 && diffDays <= 7) return `${diffDays}일 후`;
    if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)}일 전`;
    
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Today's Schedule Widget (Calendar Sync) */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full -ml-20 -mb-20 blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-500 to-violet-500 p-3 rounded-2xl shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">오늘의 면접 일정</h3>
                <p className="text-xs text-indigo-200 font-semibold mt-1">
                  {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} · Google Calendar 연동
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isLoggedIn ? (
                <>
                  <button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> 
                    {isSyncing ? '동기화 중...' : '새로고침'}
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm border border-red-400/30 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 text-red-200"
                  >
                    <LogOut className="w-4 h-4" /> 
                    로그아웃
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleGoogleLogin}
                  className="flex items-center gap-2 bg-white hover:bg-gray-100 px-6 py-3 rounded-xl text-sm font-bold transition-all text-slate-900 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <LogIn className="w-4 h-4" /> 
                  Google 로그인
                </button>
              )}
            </div>
          </div>

          {/* 캘린더 일정 표시 */}
          {isLoggedIn && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {calendarEvents.length > 0 ? (
                calendarEvents.map((event) => {
                  const eventTime = new Date(event.start);
                  return (
                    <div 
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="group bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-xl hover:bg-gradient-to-br hover:from-indigo-500/30 hover:to-violet-500/30 hover:border-white/40 transition-all cursor-pointer hover:scale-105 hover:shadow-xl"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-xs">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          {eventTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                        <span className="bg-gradient-to-r from-emerald-400 to-green-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">📅 TODAY</span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors mb-1.5 break-words line-clamp-2">{event.summary}</h4>
                      {event.description && (
                        <p className="text-xs text-slate-300 font-medium line-clamp-1 mb-2 break-words">{event.description}</p>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-indigo-200 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlayCircle className="w-4 h-4" />
                        <span>면접 시작</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 inline-block">
                    <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
                    <p className="text-slate-300 text-base font-semibold">오늘 예정된 면접 일정이 없습니다</p>
                    <p className="text-slate-400 text-sm mt-2">새로고침 버튼을 눌러 최신 일정을 확인하세요</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 로그인하지 않은 경우 */}
          {!isLoggedIn && (
            <div className="text-center py-12">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 inline-block">
                <LogIn className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
                <p className="text-slate-300 text-base font-semibold mb-4">Google Calendar와 연동하여<br/>오늘의 면접 일정을 확인하세요</p>
                <button 
                  onClick={handleGoogleLogin}
                  className="bg-white hover:bg-gray-100 text-slate-900 font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 inline-flex items-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Google 로그인
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Board Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-gradient-to-r from-emerald-400 to-green-400 text-xs font-bold px-3 py-1 rounded-full text-slate-900">전체 후보자</div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">채용 보드</h2>
          </div>
          <p className="text-sm text-slate-500">위 캘린더 일정을 클릭하면 면접이 시작되고 여기에 표시됩니다</p>
        </div>
        <button className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 text-sm shadow-lg hover:shadow-xl hover:scale-105">
          <UserPlus className="w-5 h-5" /> 후보자 추가
        </button>
      </header>

      {/* Candidates Grid */}
      {sortedCandidates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedCandidates.map(candidate => {
            const isToday = candidate.scheduledTime && formatDate(candidate.scheduledTime) === '오늘';
            
            return (
              <div 
                key={candidate.id} 
                className={`group bg-white rounded-xl border transition-all p-3 flex items-center gap-3 ${
                  isToday 
                    ? 'border-indigo-400 shadow-lg shadow-indigo-100/50 ring-2 ring-indigo-200' 
                    : 'border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/50'
                }`}
              >
                {/* 날짜 표시 (왼쪽) */}
                {candidate.scheduledTime && (
                  <div className="flex-shrink-0 w-12 text-center">
                    <div className={`text-[10px] font-black uppercase tracking-tight mb-0.5 ${
                      isToday ? 'text-indigo-600' : 'text-slate-400'
                    }`}>
                      {formatDate(candidate.scheduledTime)}
                    </div>
                    <div className={`text-xl font-black ${
                      isToday ? 'text-indigo-600' : 'text-slate-700'
                    }`}>
                      {new Date(candidate.scheduledTime).getDate()}
                    </div>
                    <div className={`text-[10px] font-bold ${
                      isToday ? 'text-indigo-500' : 'text-slate-500'
                    }`}>
                      {new Date(candidate.scheduledTime).toLocaleDateString('ko-KR', { month: 'short' }).replace('월', '')}월
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className={`w-11 h-11 bg-gradient-to-br rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                    isToday 
                      ? 'from-indigo-100 to-violet-100' 
                      : 'from-slate-100 to-slate-200 group-hover:from-indigo-100 group-hover:to-violet-100'
                  }`}>
                    <FileBox className={`w-5 h-5 transition-colors ${
                      isToday ? 'text-indigo-500' : 'text-slate-400 group-hover:text-indigo-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 mb-0.5 flex items-center gap-1.5 break-words">
                      <span className="break-words truncate">{candidate.name}</span>
                      {candidate.notes.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse"></span>}
                      {isToday && <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-[9px] font-black rounded-full flex-shrink-0">TODAY</span>}
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{candidate.role}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                       <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">면접 {candidate.notes.length}회</span>
                       {candidate.scheduledTime && (
                         <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5">
                           <Clock className="w-3 h-3" /> {formatTime(candidate.scheduledTime)}
                         </span>
                       )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-1.5 flex-shrink-0">
                  <button 
                    onClick={() => onStartInterview(candidate.id)}
                    className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-indigo-600 hover:to-violet-600 text-white h-9 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md hover:shadow-lg hover:scale-105"
                  >
                    면접 시작 <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => onViewConsolidation(candidate.id)}
                    disabled={candidate.notes.length === 0}
                    className="bg-white border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 h-9 w-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-slate-200 hover:scale-105"
                    title="통합 결과 보기"
                  >
                    <Eye className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl border-2 border-dashed border-slate-300">
          <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Users className="w-10 h-10 text-slate-300" />
          </div>
          <h4 className="text-xl font-bold text-slate-800 mb-2">아직 면접 기록이 없습니다</h4>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            캘린더 일정을 클릭하여 면접을 시작하거나<br/>
            우측 상단의 "후보자 추가" 버튼을 눌러주세요
          </p>
          <button 
            onClick={handleGoogleLogin}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Calendar className="w-5 h-5" />
            캘린더 연동하기
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
