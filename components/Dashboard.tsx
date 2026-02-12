
import React, { useState, useEffect } from 'react';
import { Candidate } from '../types';
import { getTodayEvents, filterInterviewEvents, CalendarEvent } from '../services/calendarService';
import { 
  UserPlus, 
  PlayCircle, 
  Eye, 
  FileBox, 
  Users, 
  ChevronRight, 
  Calendar, 
  RefreshCw,
  Clock
} from 'lucide-react';

interface DashboardProps {
  candidates: Candidate[];
  onStartInterview: (id: string) => void;
  onViewConsolidation: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ candidates, onStartInterview, onViewConsolidation }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // 컴포넌트 로드 시 자동으로 캘린더 일정 가져오기
  useEffect(() => {
    loadCalendarEvents();
  }, []);

  const loadCalendarEvents = async () => {
    try {
      const events = await getTodayEvents();
      const interviewEvents = filterInterviewEvents(events);
      setCalendarEvents(interviewEvents);
    } catch (error) {
      console.error('캘린더 로드 실패:', error);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await loadCalendarEvents();
    setTimeout(() => setIsSyncing(false), 1500);
  };

  const todayInterviews = candidates
    .filter(c => c.scheduledTime)
    .sort((a, b) => (a.scheduledTime || 0) - (b.scheduledTime || 0));

  const formatTime = (ts?: number) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Today's Schedule Widget (Calendar Sync) */}
      <section className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-[80px]"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/20 p-3 rounded-2xl border border-indigo-500/30">
                <Calendar className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Today's Interview Schedule</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">구글 캘린더 연동됨</p>
              </div>
            </div>
            <button 
              onClick={handleSync}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /> 
              {isSyncing ? '동기화 중...' : 'Google Calendar 동기화'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Google Calendar 일정이 있으면 먼저 표시 */}
            {calendarEvents.length > 0 ? (
              calendarEvents.map((event) => {
                const eventTime = new Date(event.start);
                return (
                  <div 
                    key={event.id}
                    className="bg-white/5 border border-white/10 p-5 rounded-3xl hover:bg-white/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-indigo-400 font-black text-sm">
                        <Clock className="w-4 h-4" />
                        {eventTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </div>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">📅 캘린더</span>
                    </div>
                    <h4 className="text-lg font-black group-hover:text-indigo-400 transition-colors mb-1">{event.summary}</h4>
                    {event.description && (
                      <p className="text-xs text-slate-400 font-medium line-clamp-2">{event.description}</p>
                    )}
                  </div>
                );
              })
            ) : (
              /* 기존 모의 데이터 표시 */
              todayInterviews.length > 0 ? (
                todayInterviews.map((candidate) => (
                  <div 
                    key={candidate.id}
                    className="bg-white/5 border border-white/10 p-5 rounded-3xl hover:bg-white/10 transition-all cursor-pointer group"
                    onClick={() => onStartInterview(candidate.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-indigo-400 font-black text-sm">
                        <Clock className="w-4 h-4" />
                        {formatTime(candidate.scheduledTime)}
                      </div>
                      <span className="bg-white/10 text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-300">UPCOMING</span>
                    </div>
                    <h4 className="text-lg font-black group-hover:text-indigo-400 transition-colors">{candidate.name}</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{candidate.role}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-8">
                  <p className="text-slate-400 text-sm">
                    {calendarEvents.length === 0 ? '오늘 예정된 면접 일정이 없습니다.' : '캘린더를 동기화하세요.'}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Main Board Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">ALL CANDIDATES</span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">전체 후보자 보드</h2>
          </div>
          <p className="text-sm text-slate-500">그리팅 ATS 및 직접 추가된 모든 후보자 목록입니다.</p>
        </div>
        <button className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-6 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 text-sm border border-indigo-100">
          <UserPlus className="w-5 h-5" /> 후보자 직접 추가
        </button>
      </header>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {candidates.map(candidate => (
          <div 
            key={candidate.id} 
            className="bg-white rounded-[32px] border border-slate-200 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-100/40 transition-all p-6 flex items-center justify-between group"
          >
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-slate-50 group-hover:bg-indigo-50 rounded-[20px] flex items-center justify-center transition-colors">
                <FileBox className="w-8 h-8 text-slate-300 group-hover:text-indigo-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-0.5 flex items-center gap-2">
                  {candidate.name}
                  {candidate.notes.length > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                </h3>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{candidate.role}</p>
                <div className="flex items-center gap-3 mt-2">
                   <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg font-bold">인터뷰 {candidate.notes.length}회 완료</span>
                   {candidate.scheduledTime && (
                     <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                       <Clock className="w-3 h-3" /> {formatTime(candidate.scheduledTime)}
                     </span>
                   )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => onStartInterview(candidate.id)}
                className="bg-slate-900 hover:bg-indigo-600 text-white h-14 px-8 rounded-2xl text-sm font-black transition-all flex items-center gap-2 shadow-xl shadow-slate-100"
              >
                시작 <ChevronRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onViewConsolidation(candidate.id)}
                disabled={candidate.notes.length === 0}
                className="bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 h-14 w-14 rounded-2xl flex items-center justify-center transition-all disabled:opacity-20"
                title="통합 결과 보기"
              >
                <Eye className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {candidates.length === 0 && (
        <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
          <Users className="w-16 h-16 text-slate-200 mx-auto mb-6" />
          <h4 className="text-xl font-bold text-slate-800">후보자 데이터가 없습니다</h4>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">ATS 연동 설정 혹은 우측 상단 '직접 추가' 버튼을 눌러주세요.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
