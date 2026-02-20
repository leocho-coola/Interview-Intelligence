
import React, { useState, useEffect, useMemo } from 'react';
import { Candidate, InterviewStatus, InterviewStage } from '../types';
import { getTodayEvents, filterInterviewEvents, CalendarEvent, parseInterviewStage } from '../services/calendarService';
import { initiateGoogleLogin, isAuthenticated, logout } from '../services/googleAuthService';
import { 
  UserPlus, 
  PlayCircle, 
  Eye, 
  FileBox, 
  Users, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
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
  onCreateCandidateFromEvent?: (eventName: string, eventDescription: string, eventId?: string, eventStartTime?: string, stage?: InterviewStage) => string;
}

const Dashboard: React.FC<DashboardProps> = ({ candidates, onStartInterview, onViewConsolidation, onCreateCandidateFromEvent }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLastWeek, setShowLastWeek] = useState(false);
  const [showNextWeek, setShowNextWeek] = useState(false);

  const handleEventClick = (event: CalendarEvent) => {
    if (onCreateCandidateFromEvent) {
      // 캘린더 이벤트 제목에서 단계와 후보자 이름 파싱
      const parsed = parseInterviewStage(event.summary);
      
      // 이미 이 이벤트로 생성된 후보자가 있는지 확인
      const existingCandidate = candidates.find(c => c.calendarEventId === event.id);
      
      if (existingCandidate) {
        // 이미 생성된 후보자가 있으면 바로 면접 시작
        console.log('✅ 기존 후보자로 면접 시작:', existingCandidate.name, '단계:', parsed.stage);
        onStartInterview(existingCandidate.id);
      } else {
        // 새로운 후보자 생성 후 면접 시작 (단계 정보 포함)
        console.log('✨ 신규 후보자 생성:', parsed.candidateName, '단계:', parsed.stage, '시간:', event.start);
        const candidateId = onCreateCandidateFromEvent(
          parsed.candidateName, 
          event.description || '', 
          event.id, 
          event.start,
          parsed.stage
        );
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
      
      // ✅ 시간순 정렬 (내림차순 - 최신이 위로)
      const sortedEvents = interviewEvents.sort((a, b) => {
        const aTime = new Date(a.start).getTime();
        const bTime = new Date(b.start).getTime();
        return bTime - aTime; // 늦은 시간 → 빠른 시간 (최신순)
      });
      
      console.log(`📅 캘린더 이벤트 로드: ${sortedEvents.length}개 표시 (최신순 정렬)`);
      
      // 🆕 자동으로 후보자 생성 (이미 존재하지 않는 경우)
      if (onCreateCandidateFromEvent) {
        sortedEvents.forEach(event => {
          const existingCandidate = candidates.find(c => c.calendarEventId === event.id);
          if (!existingCandidate) {
            const parsed = parseInterviewStage(event.summary);
            console.log('✨ 자동 후보자 생성:', parsed.candidateName, '단계:', parsed.stage);
            onCreateCandidateFromEvent(
              parsed.candidateName, 
              event.description || '', 
              event.id, 
              event.start,
              parsed.stage
            );
          }
        });
      }
      
      // 캘린더 위젯에 모든 일정 표시
      setCalendarEvents(sortedEvents);
      
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

  // 🆕 주차 계산 함수 (월요일 시작)
  const getWeekKey = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    
    // 월요일을 주의 시작으로 설정
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 일요일이면 -6, 아니면 월요일로 조정
    const monday = new Date(d.setDate(diff));
    
    return `${monday.getFullYear()}-W${Math.ceil((monday.getDate() + 6) / 7)}-${monday.getMonth()}`;
  };

  // 🆕 주차 라벨 생성
  const getWeekLabel = (weekKey: string, candidates: Candidate[]) => {
    if (candidates.length === 0) return '';
    
    // 새로운 Date 객체 생성 (원본 변경 방지)
    const firstDate = new Date(candidates[0].scheduledTime || Date.now());
    const day = firstDate.getDay();
    const diff = firstDate.getDate() - day + (day === 0 ? -6 : 1);
    
    // 월요일 계산 (새 객체로)
    const monday = new Date(firstDate);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    // 오늘 기준 이번 주 월요일 계산
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDay = today.getDay();
    const todayDiff = today.getDate() - todayDay + (todayDay === 0 ? -6 : 1);
    
    const todayMonday = new Date(today);
    todayMonday.setDate(todayDiff);
    todayMonday.setHours(0, 0, 0, 0);
    
    // 이번 주인지 확인
    if (monday.getTime() === todayMonday.getTime()) {
      return '이번 주';
    }
    
    // 지난주/다음주 확인
    const lastWeekMonday = new Date(todayMonday);
    lastWeekMonday.setDate(todayMonday.getDate() - 7);
    const nextWeekMonday = new Date(todayMonday);
    nextWeekMonday.setDate(todayMonday.getDate() + 7);
    
    if (monday.getTime() === lastWeekMonday.getTime()) {
      return '지난 주';
    }
    if (monday.getTime() === nextWeekMonday.getTime()) {
      return '다음 주';
    }
    
    // 그 외
    return `${monday.getMonth() + 1}월 ${monday.getDate()}일 ~ ${sunday.getMonth() + 1}월 ${sunday.getDate()}일`;
  };

  // 🆕 주별로 그룹핑
  const candidatesByWeek = useMemo(() => {
    const groups = new Map<string, Candidate[]>();
    
    candidates.forEach(candidate => {
      if (candidate.scheduledTime) {
        const weekKey = getWeekKey(new Date(candidate.scheduledTime));
        if (!groups.has(weekKey)) {
          groups.set(weekKey, []);
        }
        groups.get(weekKey)!.push(candidate);
      }
    });
    
    // 각 주 내에서 시간순 정렬 (최신이 위로)
    groups.forEach(weekCandidates => {
      weekCandidates.sort((a, b) => (b.scheduledTime || 0) - (a.scheduledTime || 0));
    });
    
    // 주차별로 정렬 (이번 주 → 다음 주 → 지난 주 순서)
    const result = Array.from(groups.entries())
      .map(([weekKey, weekCandidates]) => ({
        weekKey,
        label: getWeekLabel(weekKey, weekCandidates),
        candidates: weekCandidates,
        isThisWeek: getWeekLabel(weekKey, weekCandidates) === '이번 주',
        isLastWeek: getWeekLabel(weekKey, weekCandidates) === '지난 주',
        isNextWeek: getWeekLabel(weekKey, weekCandidates) === '다음 주',
        firstTime: weekCandidates[0]?.scheduledTime || 0
      }))
      .sort((a, b) => {
        // 1순위: 이번 주는 항상 최상단
        if (a.isThisWeek) return -1;
        if (b.isThisWeek) return 1;
        
        // 2순위: 다음 주는 이번 주 다음
        if (a.isNextWeek && b.isLastWeek) return -1;
        if (a.isLastWeek && b.isNextWeek) return 1;
        
        // 3순위: 같은 카테고리 내에서는 시간순 (미래는 최신순, 과거는 최신순)
        return b.firstTime - a.firstTime;
      });
    
    console.log('📊 주별 그룹핑 결과:', result.map(w => ({
      label: w.label,
      count: w.candidates.length,
      isThisWeek: w.isThisWeek,
      isNextWeek: w.isNextWeek,
      isLastWeek: w.isLastWeek
    })));
    
    return result;
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

  // 🆕 상태 뱃지 렌더링
  const renderStatusBadge = (status?: InterviewStatus) => {
    if (!status || status === InterviewStatus.SCHEDULED) {
      return (
        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-bold">
          📅 예정
        </span>
      );
    }
    if (status === InterviewStatus.IN_PROGRESS) {
      return (
        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-md font-bold animate-pulse">
          ⏳ 진행중
        </span>
      );
    }
    if (status === InterviewStatus.COMPLETED) {
      return (
        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-bold">
          ✅ 완료
        </span>
      );
    }
    if (status === InterviewStatus.NO_SHOW) {
      return (
        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-md font-bold">
          ❌ 불참
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Today's Schedule Widget (Calendar Sync) */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-2xl p-5 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full -ml-20 -mb-20 blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-500 to-violet-500 p-3 rounded-2xl shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">오늘의 면접 일정</h3>
                <p className="text-xs text-indigo-200 font-semibold mt-1">
                  {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} · Google Calendar 연동 (최근 2주)
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

          {/* 캘린더 일정 표시 - 오늘 것만 */}
          {isLoggedIn && (
            <div className="space-y-2.5">
              {(() => {
                // 오늘 날짜만 필터링
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayTimestamp = today.getTime();
                
                const todayEvents = calendarEvents.filter(event => {
                  const eventDate = new Date(event.start);
                  eventDate.setHours(0, 0, 0, 0);
                  return eventDate.getTime() === todayTimestamp;
                });
                
                console.log('📅 오늘의 면접 일정:', todayEvents.length, '개');
                
                return todayEvents.length > 0 ? (
                  todayEvents.map((event) => {
                    const eventTime = new Date(event.start);
                  return (
                    <div 
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="group bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-xl hover:bg-gradient-to-br hover:from-indigo-500/30 hover:to-violet-500/30 hover:border-white/40 transition-all cursor-pointer hover:shadow-xl flex items-center gap-3"
                    >
                      {/* 날짜 표시 (왼쪽) */}
                      <div className="flex-shrink-0 w-12 text-center">
                        <div className="text-[10px] font-black uppercase tracking-tight mb-0.5 text-indigo-300">
                          오늘
                        </div>
                        <div className="text-xl font-black text-white">
                          {eventTime.getDate()}
                        </div>
                        <div className="text-[10px] font-bold text-indigo-300">
                          {eventTime.toLocaleDateString('ko-KR', { month: 'short' }).replace('월', '')}월
                        </div>
                      </div>
                      
                      {/* 아이콘 */}
                      <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all flex-shrink-0">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      
                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors mb-0.5 break-words truncate">{event.summary}</h4>
                        <p className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wide mb-1">면접 일정</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> {eventTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </span>
                          <span className="bg-gradient-to-r from-emerald-400 to-green-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">📅 TODAY</span>
                        </div>
                      </div>
                      
                      {/* 버튼 */}
                      <button 
                        className="bg-white hover:bg-white/90 text-slate-900 h-9 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md hover:shadow-lg flex-shrink-0"
                      >
                        면접 시작 <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                  })
                ) : (
                <div className="text-center py-12">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 inline-block">
                    <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
                    <p className="text-slate-300 text-base font-semibold">오늘 예정된 면접 일정이 없습니다</p>
                    <p className="text-slate-400 text-sm mt-2">새로고침 버튼을 눌러 최신 일정을 확인하세요</p>
                  </div>
                </div>
              );
            })()}
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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
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

      {/* Today's Interviews - REMOVED (duplicate with calendar widget) */}

      {/* Weekly Interview Records */}
      {candidatesByWeek.map((week, weekIndex) => {
        // 지난 주/다음 주는 토글로 제어
        if (week.isLastWeek && !showLastWeek) {
          return (
            <div key={week.weekKey} className="space-y-3">
              <button
                onClick={() => setShowLastWeek(true)}
                className="w-full flex items-center justify-between bg-slate-100 hover:bg-slate-200 p-4 rounded-xl transition-all border border-slate-200"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  <h3 className="text-sm font-bold text-slate-600">{week.label} ({week.candidates.length}건)</h3>
                </div>
                <ChevronDown className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          );
        }
        
        if (week.isNextWeek && !showNextWeek) {
          return (
            <div key={week.weekKey} className="space-y-3">
              <button
                onClick={() => setShowNextWeek(true)}
                className="w-full flex items-center justify-between bg-slate-100 hover:bg-slate-200 p-4 rounded-xl transition-all border border-slate-200"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  <h3 className="text-sm font-bold text-slate-600">{week.label} ({week.candidates.length}건)</h3>
                </div>
                <ChevronDown className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          );
        }
        
        return (
          <div key={week.weekKey} className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${week.isThisWeek ? 'bg-indigo-400' : 'bg-slate-400'}`}></div>
                {week.label} ({week.candidates.length}건)
              </h3>
              {(week.isLastWeek || week.isNextWeek) && (
                <button
                  onClick={() => week.isLastWeek ? setShowLastWeek(false) : setShowNextWeek(false)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-semibold transition-colors"
                >
                  접기 <ChevronUp className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-2">
            {week.candidates.map(candidate => {
            const isToday = formatDate(candidate.scheduledTime) === '오늘';
            
            return (
              <div 
                key={candidate.id} 
                className={`group bg-white rounded-xl border transition-all p-3 flex items-center gap-3 ${
                  isToday 
                    ? 'border-indigo-300 shadow-md shadow-indigo-100/50 ring-2 ring-indigo-100' 
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
                      isToday ? 'text-indigo-700' : 'text-slate-700'
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
                  <div className="w-11 h-11 bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-indigo-100 group-hover:to-violet-100 rounded-lg flex items-center justify-center transition-all flex-shrink-0">
                    <FileBox className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 mb-0.5 flex items-center gap-1.5 break-words">
                      <span className="break-words truncate">{candidate.name}</span>
                      {candidate.notes.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse"></span>}
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{candidate.role}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                       {renderStatusBadge(candidate.status)}
                       {/* 🆕 현재 진행 단계 뱃지 */}
                       {candidate.currentStage && (
                         <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md font-bold">
                           {candidate.currentStage}
                         </span>
                       )}
                       <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">면접 {candidate.notes.length}회</span>
                       {candidate.scheduledTime && (
                         <span className="text-[10px] text-slate-600 font-bold flex items-center gap-0.5">
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
        </div>
        );
      })}

      {/* Empty State - 캘린더 이벤트도 없고 후보자도 없을 때만 표시 */}
      {candidates.length === 0 && calendarEvents.length === 0 && (
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
