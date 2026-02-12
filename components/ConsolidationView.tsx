
import React, { useState, useEffect } from 'react';
import { Candidate, InterviewNote, InterviewStage } from '../types';
import { 
  ArrowLeft, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  AlertCircle, 
  ThumbsUp, 
  Layers,
  Clock,
  User,
  ChevronRight
} from 'lucide-react';
import { summarizeConsolidatedNotes } from '../services/geminiService';

interface ConsolidationViewProps {
  candidate: Candidate;
  onBack: () => void;
}

const ConsolidationView: React.FC<ConsolidationViewProps> = ({ candidate, onBack }) => {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(candidate.notes[0]?.id || null);

  useEffect(() => {
    if (candidate.notes.length >= 1) {
      handleGetAiSummary();
    }
  }, [candidate]);

  const handleGetAiSummary = async () => {
    setLoading(true);
    const summary = await summarizeConsolidatedNotes(candidate);
    setAiSummary(summary || null);
    setLoading(false);
  };

  const getLatestStage = () => {
    if (candidate.notes.length === 0) return '서류 검토 중';
    const sorted = [...candidate.notes].sort((a, b) => b.timestamp - a.timestamp);
    return sorted[0].stage;
  };

  const getStageColor = (stage: InterviewStage) => {
    switch(stage) {
      case InterviewStage.FIRST_TECHNICAL: return 'bg-blue-100 text-blue-700 border-blue-200';
      case InterviewStage.SECOND_CULTURE: return 'bg-purple-100 text-purple-700 border-purple-200';
      case InterviewStage.FINAL: return 'bg-amber-100 text-amber-700 border-amber-200';
      case InterviewStage.COFFEE_CHAT: return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    }
  };

  const activeNote = candidate.notes.find(n => n.id === activeNoteId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Top Navigation & Profile */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-3 hover:bg-slate-50 rounded-2xl transition-all border border-slate-100"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-indigo-600 rounded-[24px] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-100">
              {candidate.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{candidate.name}</h2>
                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100">
                  {candidate.role}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> 면접관 {candidate.notes.length}명 참여</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="flex items-center gap-1.5 font-bold text-indigo-600"><Layers className="w-4 h-4" /> 현재 단계: {getLatestStage()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 px-8 py-4 bg-slate-50 rounded-3xl border border-slate-100">
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">인터뷰 상태</p>
            <span className="text-sm font-black text-indigo-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> 평가 진행 중
            </span>
          </div>
          <div className="w-px h-10 bg-slate-200"></div>
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">최종 의사결정</p>
            <span className="text-sm font-black text-slate-400 bg-white px-3 py-1 rounded-lg border border-slate-200">Pending</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel: AI Synthesis and Tabbed Notes */}
        <div className="lg:col-span-8 space-y-8">
          {/* AI Synthesis Card */}
          <section className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-500/20 p-2.5 rounded-2xl border border-indigo-500/30">
                    <Sparkles className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">AI 통합 분석 리포트</h3>
                    <p className="text-xs text-slate-400 font-medium">모든 인터뷰 단계를 종합하여 분석했습니다.</p>
                  </div>
                </div>
                {loading && <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>}
              </div>
              
              {aiSummary && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold uppercase tracking-wider">
                      <ThumbsUp className="w-4 h-4" /> 공통 긍정 신호
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{aiSummary.split('\n\n')[0]}</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-bold uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4" /> 추가 검증 필요 사항
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{aiSummary.split('\n\n')[1] || '면접관들 사이의 의견 차이가 크지 않습니다.'}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Individual Notes - Tabbed Interface */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">면접관별 상세 기록</h4>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">총 {candidate.notes.length}개의 기록</span>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 pb-2">
              {[...candidate.notes].sort((a, b) => b.timestamp - a.timestamp).map((note) => (
                <button
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={`flex flex-col items-start p-4 rounded-[24px] border transition-all duration-300 min-w-[160px] ${
                    activeNoteId === note.id 
                    ? 'bg-white border-indigo-400 shadow-lg shadow-indigo-100 ring-2 ring-indigo-50' 
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${activeNoteId === note.id ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`}></div>
                    <span className={`text-sm font-black ${activeNoteId === note.id ? 'text-slate-900' : 'text-slate-500'}`}>{note.interviewer.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-tighter ${activeNoteId === note.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {note.stage}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeNote && (
              <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-xl font-black">
                      {activeNote.interviewer.name[0]}
                    </div>
                    <div>
                      <h5 className="text-lg font-black text-slate-900">{activeNote.interviewer.name} 면접관의 평가</h5>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-bold uppercase tracking-tight">
                        <span>{activeNote.interviewer.department}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(activeNote.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full border text-xs font-black shadow-sm ${getStageColor(activeNote.stage)}`}>
                    {activeNote.stage}
                  </span>
                </div>

                <div className="p-8 space-y-8">
                  {/* Summary Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-emerald-50/50 p-6 rounded-[32px] border border-emerald-100 shadow-sm">
                      <div className="flex items-center gap-2 text-emerald-700 text-[10px] font-black uppercase tracking-widest mb-3">
                        <ThumbsUp className="w-3.5 h-3.5" /> Pros (강점)
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed italic font-medium">"{activeNote.overallPros || '작성된 내용이 없습니다.'}"</p>
                    </div>
                    <div className="bg-rose-50/50 p-6 rounded-[32px] border border-rose-100 shadow-sm">
                      <div className="flex items-center gap-2 text-rose-700 text-[10px] font-black uppercase tracking-widest mb-3">
                        <AlertCircle className="w-3.5 h-3.5" /> Cons (약점)
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed italic font-medium">"{activeNote.overallCons || '작성된 내용이 없습니다.'}"</p>
                    </div>
                  </div>

                  {/* Detailed Answers Section */}
                  <div className="space-y-4">
                    <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-4">질문별 상세 답변 기록</h6>
                    {activeNote.answers.map((ans, idx) => (
                      <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-[24px] p-6 hover:bg-white hover:shadow-md transition-all">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">Q{idx + 1}</span>
                          <p className="text-sm font-black text-slate-800 leading-snug">{ans.questionText}</p>
                        </div>
                        <div className="pl-9 relative">
                          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200/50"></div>
                          <p className="text-sm text-slate-600 leading-relaxed">{ans.answerText || '(답변 기록 없음)'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm sticky top-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">전형 프로세스 현황</h4>
            <div className="space-y-6">
              {Object.values(InterviewStage).map((stage, idx) => {
                const isCompleted = candidate.notes.some(n => n.stage === stage);
                return (
                  <div key={stage} className={`flex items-start gap-4 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isCompleted ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                      <CheckCircle2 className={`w-6 h-6 ${isCompleted ? 'text-white' : 'text-slate-300'}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-black ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>{idx + 1}. {stage}</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-tighter">
                        {isCompleted ? '평가 완료' : '대기 중'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 space-y-3">
              <button className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-5 rounded-[20px] font-black text-sm transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2">
                합격 결정 및 다음 단계 이동 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsolidationView;
