import React, { useMemo } from 'react';
import { Candidate } from '../types';
import { ArrowLeft, Calendar, TrendingUp, Users, CheckCircle, Clock, BarChart3 } from 'lucide-react';

interface WeeklyStatsProps {
  candidates: Candidate[];
  onBack: () => void;
}

const WeeklyStats: React.FC<WeeklyStatsProps> = ({ candidates, onBack }) => {
  // 주간 통계 계산
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 이번 주 시작 (월요일)
    const currentDayOfWeek = today.getDay();
    const daysToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - daysToMonday);
    
    // 이번 주 끝 (일요일)
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
    thisWeekEnd.setHours(23, 59, 59, 999);
    
    // 지난 주 시작/끝
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setMilliseconds(-1);
    
    // 이번 주 면접 (notes가 있는 것)
    const thisWeekInterviews = candidates.filter(c => 
      c.notes.some(note => {
        const noteDate = new Date(note.timestamp);
        return noteDate >= thisWeekStart && noteDate <= thisWeekEnd;
      })
    );
    
    // 지난 주 면접
    const lastWeekInterviews = candidates.filter(c =>
      c.notes.some(note => {
        const noteDate = new Date(note.timestamp);
        return noteDate >= lastWeekStart && noteDate <= lastWeekEnd;
      })
    );
    
    // 이번 주 총 면접 횟수
    const thisWeekTotal = thisWeekInterviews.reduce((sum, c) => 
      sum + c.notes.filter(note => {
        const noteDate = new Date(note.timestamp);
        return noteDate >= thisWeekStart && noteDate <= thisWeekEnd;
      }).length
    , 0);
    
    // 지난 주 총 면접 횟수
    const lastWeekTotal = lastWeekInterviews.reduce((sum, c) =>
      sum + c.notes.filter(note => {
        const noteDate = new Date(note.timestamp);
        return noteDate >= lastWeekStart && noteDate <= lastWeekEnd;
      }).length
    , 0);
    
    // 요일별 통계
    const dailyStats = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(thisWeekStart);
      date.setDate(thisWeekStart.getDate() + i);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const interviewCount = candidates.reduce((sum, c) =>
        sum + c.notes.filter(note => {
          const noteDate = new Date(note.timestamp);
          return noteDate >= date && noteDate <= dayEnd;
        }).length
      , 0);
      
      return {
        date,
        dayName: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
        count: interviewCount,
        isToday: date.toDateString() === today.toDateString()
      };
    });
    
    const maxCount = Math.max(...dailyStats.map(d => d.count), 1);
    
    // 증가율 계산
    const growthRate = lastWeekTotal === 0 
      ? (thisWeekTotal > 0 ? 100 : 0)
      : ((thisWeekTotal - lastWeekTotal) / lastWeekTotal * 100);
    
    return {
      thisWeekTotal,
      lastWeekTotal,
      thisWeekCandidates: thisWeekInterviews.length,
      growthRate,
      dailyStats,
      maxCount
    };
  }, [candidates]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">주간 면접 통계</h1>
            <p className="text-sm text-slate-500 mt-1">이번 주 면접 현황을 한눈에 확인하세요</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="w-4 h-4" />
          <span className="font-medium">
            {weeklyStats.dailyStats[0].date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} ~ {weeklyStats.dailyStats[6].date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
          </span>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 이번 주 총 면접 */}
        <div className="bg-gradient-to-br from-indigo-500 to-violet-500 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              weeklyStats.growthRate >= 0 
                ? 'bg-emerald-400/30 text-emerald-100' 
                : 'bg-red-400/30 text-red-100'
            }`}>
              {weeklyStats.growthRate >= 0 ? '↗' : '↘'} {Math.abs(Math.round(weeklyStats.growthRate))}%
            </div>
          </div>
          <div className="text-4xl font-black mb-2">{weeklyStats.thisWeekTotal}</div>
          <div className="text-sm font-semibold text-white/80">이번 주 총 면접 횟수</div>
          <div className="text-xs text-white/60 mt-2">지난 주: {weeklyStats.lastWeekTotal}회</div>
        </div>

        {/* 면접 본 후보자 수 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-emerald-100 to-green-100 p-3 rounded-xl">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="text-4xl font-black text-slate-900 mb-2">{weeklyStats.thisWeekCandidates}</div>
          <div className="text-sm font-semibold text-slate-600">면접 본 후보자 수</div>
          <div className="text-xs text-slate-400 mt-2">이번 주 기준</div>
        </div>

        {/* 평균 면접 시간 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-4xl font-black text-slate-900 mb-2">
            {weeklyStats.thisWeekCandidates > 0 
              ? (weeklyStats.thisWeekTotal / weeklyStats.thisWeekCandidates).toFixed(1)
              : '0'}
          </div>
          <div className="text-sm font-semibold text-slate-600">후보자당 평균 면접 횟수</div>
          <div className="text-xs text-slate-400 mt-2">이번 주 기준</div>
        </div>
      </div>

      {/* Daily Bar Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          요일별 면접 현황
        </h2>
        <div className="flex items-end justify-between gap-4 h-64">
          {weeklyStats.dailyStats.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-3">
              {/* Bar */}
              <div className="relative w-full flex items-end justify-center" style={{ height: '200px' }}>
                <div
                  className={`w-full rounded-t-xl transition-all ${
                    day.isToday 
                      ? 'bg-gradient-to-t from-indigo-500 to-violet-500 shadow-lg shadow-indigo-200' 
                      : day.count > 0
                      ? 'bg-gradient-to-t from-slate-300 to-slate-200 hover:from-indigo-400 hover:to-violet-400 cursor-pointer'
                      : 'bg-slate-100'
                  }`}
                  style={{ 
                    height: `${(day.count / weeklyStats.maxCount) * 100}%`,
                    minHeight: day.count > 0 ? '8px' : '0'
                  }}
                >
                  {day.count > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                      {day.count}회
                    </div>
                  )}
                </div>
              </div>
              
              {/* Label */}
              <div className="text-center">
                <div className={`text-sm font-bold ${day.isToday ? 'text-indigo-600' : 'text-slate-600'}`}>
                  {day.dayName}
                </div>
                <div className="text-xs text-slate-400">
                  {day.date.getDate()}일
                </div>
                {day.isToday && (
                  <div className="text-[10px] font-black text-indigo-500 uppercase mt-1">
                    Today
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Interviews */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          최근 완료한 면접
        </h2>
        
        <div className="space-y-3">
          {candidates
            .filter(c => c.notes.length > 0)
            .flatMap(c => c.notes.map(note => ({ ...note, candidateName: c.name })))
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5)
            .map((note, index) => {
              const date = new Date(note.timestamp);
              const isThisWeek = date >= new Date(weeklyStats.dailyStats[0].date);
              
              return (
                <div
                  key={note.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    isThisWeek 
                      ? 'bg-indigo-50 border-indigo-200' 
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-full flex items-center justify-center font-black flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900">{note.candidateName}</div>
                    <div className="text-sm text-slate-600">{note.stage}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-slate-700">
                      {date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-xs text-slate-500">
                      {date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {isThisWeek && (
                    <div className="px-2 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full">
                      이번 주
                    </div>
                  )}
                </div>
              );
            })}
          
          {candidates.filter(c => c.notes.length > 0).length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-semibold">아직 완료된 면접이 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyStats;
