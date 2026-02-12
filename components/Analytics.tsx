
import React, { useState } from 'react';
import { Candidate, JobRole } from '../types';
import { analyzeJobPersona } from '../services/geminiService';
import { 
  Sparkles, 
  BarChart, 
  Target, 
  Zap, 
  ChevronRight, 
  Search, 
  ArrowLeft 
} from 'lucide-react';

interface AnalyticsProps {
  candidates: Candidate[];
  onBack: () => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ candidates, onBack }) => {
  const [selectedRole, setSelectedRole] = useState<JobRole>(JobRole.FRONTEND);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeJobPersona(selectedRole, candidates);
    setAnalysis(result);
    setLoading(false);
  };

  const roleStats = Object.values(JobRole).map(role => ({
    name: role,
    count: candidates.filter(c => c.role === role && c.notes.length > 0).length
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-3 hover:bg-slate-50 rounded-2xl transition-all border border-slate-100 group"
            title="대시보드로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">직무 페르조나 인사이트</h2>
            <p className="text-slate-500 mt-1">인터뷰 데이터를 AI로 분석하여 우리 회사에 맞는 인재상을 정의합니다.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Selection Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">분석할 직무 선택</h4>
            <div className="space-y-3">
              {roleStats.map(stat => (
                <button 
                  key={stat.name}
                  onClick={() => setSelectedRole(stat.name as JobRole)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all border ${selectedRole === stat.name ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-200' : 'border-slate-100 hover:border-slate-300 text-slate-600'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${selectedRole === stat.name ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'}`}></div>
                    <span className="text-sm font-bold">{stat.name}</span>
                  </div>
                  <span className="text-[10px] font-black bg-white/50 px-2 py-1 rounded-lg border border-slate-100">
                    {stat.count} 건
                  </span>
                </button>
              ))}
            </div>
            
            <button 
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full mt-8 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-200 text-white font-black py-5 rounded-[20px] transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  분석 엔진 가동 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform" /> 
                  페르조나 리포트 생성
                </>
              )}
            </button>
          </div>

          <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <h4 className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-4">Data utilization</h4>
            <div className="space-y-5">
              <div className="flex gap-4">
                <Target className="w-6 h-6 text-white shrink-0" />
                <p className="text-xs text-indigo-50 leading-relaxed font-medium">인터뷰어들의 질문 패턴을 분석하여 어떤 역량을 주로 평가하는지 파악합니다.</p>
              </div>
              <div className="flex gap-4">
                <Zap className="w-6 h-6 text-white shrink-0" />
                <p className="text-xs text-indigo-50 leading-relaxed font-medium">합격자들의 공통 답변 키워드를 추출하여 우수 인재의 특징을 도출합니다.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8">
          {analysis ? (
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500">
              <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedRole} 직무 페르조나</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Intelligence Report by Gemini 3.0</p>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                  <BarChart className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
              <div className="p-10">
                <div className="prose prose-slate max-w-none">
                  <div className="whitespace-pre-wrap text-slate-700 leading-loose text-base font-medium">
                    {analysis}
                  </div>
                </div>
              </div>
              <div className="p-10 pt-0 flex justify-end">
                <button className="flex items-center gap-2 text-indigo-600 font-black hover:bg-indigo-50 px-6 py-3 rounded-2xl transition-all">
                  PDF 리포트 다운로드 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-200">
              <div className="bg-slate-50 p-10 rounded-[32px] mb-8">
                <Search className="w-16 h-16 text-slate-200" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">인사이트 분석 대기 중</h3>
              <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
                좌측에서 직무를 선택하고 버튼을 누르시면 해당 직무에 축적된 면접 데이터를 기반으로 인재상 리포트를 생성합니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
