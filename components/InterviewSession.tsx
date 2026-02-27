
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Candidate, 
  Interviewer, 
  Question, 
  Answer, 
  InterviewNote,
  InterviewStage,
  InterviewResult
} from '../types';
import { QUESTION_POOL } from '../constants';
import { SpeechRecognitionService, isSpeechRecognitionSupported } from '../services/speechRecognitionService';
import { 
  GripVertical, 
  Plus, 
  Save, 
  Trash2, 
  PlusCircle, 
  HelpCircle,
  Hash,
  ArrowLeft,
  ChevronDown,
  Filter,
  ThumbsUp,
  AlertCircle,
  MessageSquare,
  FileText,
  ExternalLink,
  Maximize2,
  Minimize2,
  Layers,
  Clock,
  Mic,
  MicOff,
  Pause,
  Play
} from 'lucide-react';

interface InterviewSessionProps {
  candidate: Candidate;
  interviewer: Interviewer;
  onSave: (note: InterviewNote) => void;
  onCancel: () => void;
}

const InterviewSession: React.FC<InterviewSessionProps> = ({ 
  candidate, 
  interviewer, 
  onSave, 
  onCancel 
}) => {
  // 임시저장 키 생성
  const draftKey = `interview_draft_${candidate.id}`;
  
  // 임시저장된 데이터 로드
  const loadDraft = () => {
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('임시저장 로드 실패:', e);
        return null;
      }
    }
    return null;
  };
  
  const draft = loadDraft();
  
  const [selectedQuestions, setSelectedQuestions] = useState<Answer[]>(draft?.selectedQuestions || []);
  const [overallPros, setOverallPros] = useState(draft?.overallPros || '');
  const [overallCons, setOverallCons] = useState(draft?.overallCons || '');
  const [customQuestion, setCustomQuestion] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showResume, setShowResume] = useState(true);
  const [selectedStage, setSelectedStage] = useState<InterviewStage>(draft?.selectedStage || candidate.currentStage || InterviewStage.FIRST_TECHNICAL);
  const [interviewResult, setInterviewResult] = useState<InterviewResult>(draft?.interviewResult || InterviewResult.PENDING); // 🆕 면접 결과
  const [lastSaved, setLastSaved] = useState<Date | null>(draft ? new Date(draft.timestamp) : null);
  
  // 🆕 음성 인식 관련 state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [activeQuestionForRecording, setActiveQuestionForRecording] = useState<string | null>(null);
  const [speechService, setSpeechService] = useState<SpeechRecognitionService | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  
  // 자동 임시저장 (5초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedQuestions.length > 0 || overallPros || overallCons) {
        const draftData = {
          selectedQuestions,
          overallPros,
          overallCons,
          selectedStage,
          interviewResult,
          timestamp: Date.now()
        };
        localStorage.setItem(draftKey, JSON.stringify(draftData));
        setLastSaved(new Date());
        console.log('✅ 자동 임시저장 완료');
      }
    }, 5000); // 5초마다 저장
    
    return () => clearInterval(interval);
  }, [selectedQuestions, overallPros, overallCons, selectedStage, interviewResult, draftKey]);
  
  // 🆕 녹음 시간 타이머
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isRecording && !isPaused) {
      timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording, isPaused]);
  
  // 🆕 음성 인식 초기화 및 정리
  useEffect(() => {
    return () => {
      if (speechService) {
        speechService.stop();
      }
    };
  }, [speechService]);
  
  // localStorage에서 커스텀 질문 Pool 로드
  const [questionPool, setQuestionPool] = useState<Question[]>(() => {
    const saved = localStorage.getItem('custom_interview_questions');
    return saved ? JSON.parse(saved) : QUESTION_POOL;
  });

  const categories = useMemo(() => {
    const cats = Array.from(new Set(questionPool.map(q => q.category)));
    return ['All', ...cats];
  }, [questionPool]);

  const filteredQuestions = useMemo(() => {
    if (activeCategory === 'All') return questionPool;
    return questionPool.filter(q => q.category === activeCategory);
  }, [activeCategory, questionPool]);

  const handleDragStart = (e: React.DragEvent, question: Question) => {
    e.dataTransfer.setData('question', JSON.stringify(question));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const questionData = e.dataTransfer.getData('question');
    if (questionData) {
      const question: Question = JSON.parse(questionData);
      addQuestionToBoard(question.id, question.text);
    }
  };

  const addQuestionToBoard = (id: string, text: string) => {
    if (selectedQuestions.some(q => q.questionId === id && !id.startsWith('custom'))) return;
    setSelectedQuestions(prev => [
      ...prev, 
      { questionId: id, questionText: text, answerText: '' }
    ]);
  };

  const addCustomQuestion = () => {
    if (!customQuestion.trim()) return;
    addQuestionToBoard('custom-' + Date.now(), customQuestion);
    setCustomQuestion('');
  };

  const updateAnswer = (index: number, text: string) => {
    setSelectedQuestions(prev => {
      const updated = [...prev];
      updated[index].answerText = text;
      return updated;
    });
  };

  const removeQuestion = (index: number) => {
    setSelectedQuestions(prev => prev.filter((_, i) => i !== index));
  };
  
  // 🆕 녹음 시간 포맷팅
  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 🆕 녹음 시작
  const startRecording = (questionId: string) => {
    if (!isSpeechRecognitionSupported()) {
      setRecordingError('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 Edge를 사용해주세요.');
      return;
    }
    
    try {
      const service = new SpeechRecognitionService({
        lang: 'ko-KR',
        continuous: true,
        interimResults: true
      });
      
      service.onResult((transcript, isFinal) => {
        if (isFinal) {
          // 최종 결과: 답변에 추가
          const questionIndex = selectedQuestions.findIndex(q => q.questionId === questionId);
          if (questionIndex !== -1) {
            updateAnswer(questionIndex, selectedQuestions[questionIndex].answerText + ' ' + transcript);
          }
          setInterimTranscript('');
        } else {
          // 임시 결과: 미리보기로 표시
          setInterimTranscript(transcript);
        }
      });
      
      service.onError((error) => {
        console.error('음성 인식 오류:', error);
        setRecordingError(error);
        setIsRecording(false);
        setActiveQuestionForRecording(null);
      });
      
      service.onEnd(() => {
        console.log('음성 인식 종료');
      });
      
      service.start();
      setSpeechService(service);
      setIsRecording(true);
      setIsPaused(false);
      setActiveQuestionForRecording(questionId);
      setRecordingTime(0);
      setRecordingError(null);
      
      console.log('✅ 녹음 시작:', questionId);
    } catch (error) {
      console.error('녹음 시작 실패:', error);
      setRecordingError('녹음을 시작할 수 없습니다. 마이크 권한을 확인해주세요.');
    }
  };
  
  // 🆕 녹음 일시정지/재개
  const togglePause = () => {
    if (isPaused) {
      // 재개
      if (speechService) {
        speechService.start();
      }
      setIsPaused(false);
    } else {
      // 일시정지
      if (speechService) {
        speechService.stop();
      }
      setIsPaused(true);
    }
  };
  
  // 🆕 녹음 중지
  const stopRecording = () => {
    if (speechService) {
      speechService.stop();
      setSpeechService(null);
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setActiveQuestionForRecording(null);
    setInterimTranscript('');
    setRecordingTime(0);
    
    console.log('⏹️ 녹음 중지');
  };

  const handleSave = () => {
    if (selectedQuestions.length === 0) {
      alert('최소 하나 이상의 질문에 대한 기록이 필요합니다.');
      return;
    }
    const note: InterviewNote = {
      id: 'n-' + Date.now(),
      candidateId: candidate.id,
      interviewer,
      answers: selectedQuestions,
      overallPros,
      overallCons,
      timestamp: Date.now(),
      stage: selectedStage,
      result: interviewResult, // 🆕 면접 결과 추가
    };
    
    // 임시저장 데이터 삭제
    localStorage.removeItem(draftKey);
    
    onSave(note);
  };

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'SW': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'PO': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'Design': return 'bg-pink-50 text-pink-600 border-pink-100';
      case 'General': return 'bg-slate-50 text-slate-600 border-slate-100';
      default: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    }
  };

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-40px)] animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden">
      
      {/* 🆕 녹음 오류 메시지 */}
      {recordingError && (
        <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-700">{recordingError}</p>
            <button 
              onClick={() => setRecordingError(null)}
              className="text-xs text-red-600 hover:text-red-700 font-semibold mt-1"
            >
              닫기
            </button>
          </div>
        </div>
      )}
      
      {/* Header Info - 전체 화면 너비 */}
      <div className="bg-white border-b border-slate-200 p-5 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-5">
          <button 
            onClick={onCancel}
            className="p-3 hover:bg-slate-50 rounded-2xl transition-colors border border-slate-100"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <span className="text-white font-extrabold text-2xl">{candidate.name[0]}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-900">{candidate.name}</h2>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
                   <Layers className="w-3 h-3 text-indigo-600" />
                   <select 
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value as InterviewStage)}
                    className="bg-transparent text-[11px] font-black text-indigo-700 outline-none cursor-pointer appearance-none"
                   >
                     {Object.values(InterviewStage).map(s => (
                       <option key={s} value={s}>{s}</option>
                     ))}
                   </select>
                </div>
                {/* 🆕 합격/불합격 선택 */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setInterviewResult(InterviewResult.PASS)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black transition-all ${
                      interviewResult === InterviewResult.PASS
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    합격
                  </button>
                  <button
                    onClick={() => setInterviewResult(InterviewResult.FAIL)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black transition-all ${
                      interviewResult === InterviewResult.FAIL
                        ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                        : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                    }`}
                  >
                    <AlertCircle className="w-3 h-3" />
                    불합격
                  </button>
                  <button
                    onClick={() => setInterviewResult(InterviewResult.PENDING)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black transition-all ${
                      interviewResult === InterviewResult.PENDING
                        ? 'bg-slate-500 text-white shadow-lg shadow-slate-200'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    평가 대기
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-500 font-semibold">{candidate.role}</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          {/* 임시저장 상태 표시 */}
          {lastSaved && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold">
              <Clock className="w-4 h-4" />
              임시저장됨 {lastSaved.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
          <button 
            onClick={() => setShowResume(!showResume)}
            className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all border ${showResume ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}
          >
            {showResume ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            {showResume ? '이력서 닫기' : '이력서 보기'}
          </button>
          <button 
            onClick={handleSave}
            className="px-8 py-4 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 flex items-center gap-2 transition-all transform active:scale-95"
          >
            <Save className="w-5 h-5" /> 기록 완료 및 제출
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden px-4">
        {/* Left Panel: Question Pool - 항상 표시 */}
        <div className="w-80 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-500" /> 질문 Pool
                </h3>
                <div className="relative">
                  <select 
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    className="pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold appearance-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat === 'All' ? '전체 직무' : cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">질문을 드래그하거나 [+] 클릭</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {filteredQuestions.map(q => (
                <div 
                  key={q.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, q)}
                  className="p-3 bg-white border border-slate-100 rounded-2xl cursor-grab hover:border-indigo-300 hover:shadow-md transition-all active:cursor-grabbing group relative border-l-4 border-l-slate-200 hover:border-l-indigo-500"
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-3 h-3 text-slate-200 mt-1 shrink-0 group-hover:text-indigo-400" />
                    <div>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase mb-1 inline-block tracking-widest border ${getCategoryColor(q.category)}`}>
                        {q.category}
                      </span>
                      <p className="text-xs font-bold text-slate-700 leading-snug">{q.text}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => addQuestionToBoard(q.id, q.text)}
                    className="absolute right-2 bottom-2 bg-indigo-50 p-1 rounded-lg text-indigo-600 opacity-0 group-hover:opacity-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <div className="relative group">
                <input 
                  type="text" 
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="직접 입력..."
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-inner"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomQuestion()}
                />
                <button 
                  onClick={addCustomQuestion}
                  className="absolute right-1.5 top-1.5 p-1.5 bg-slate-900 text-white rounded-lg hover:bg-indigo-600 transition-all"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
        </div>

        {/* Middle Panel: Active Interview Board */}
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`flex-1 flex flex-col bg-white rounded-2xl border-2 border-dashed ${selectedQuestions.length === 0 ? 'border-indigo-100' : 'border-slate-100'} overflow-hidden shadow-inner relative transition-all`}
        >
          {selectedQuestions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
              <div className="bg-indigo-50 p-8 rounded-full mb-6">
                <Hash className="w-16 h-16 text-indigo-200" />
              </div>
              <p className="text-xl font-black text-slate-700 mb-2 tracking-tight">기록할 질문을 추가하세요</p>
              <p className="text-sm text-slate-400 max-w-xs font-medium">Pool에서 드래그하거나 직접 입력하여 시작합니다.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {/* Question List */}
              {selectedQuestions.map((q, idx) => (
                <div key={q.questionId} className="group animate-in slide-in-from-right-4 bg-slate-50/50 p-6 rounded-[28px] border border-slate-100 hover:bg-white hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-slate-900 text-white text-xs flex items-center justify-center rounded-2xl font-black">
                        {idx + 1}
                      </span>
                      <h4 className="text-base font-black text-slate-800 tracking-tight leading-tight">{q.questionText}</h4>
                    </div>
                    <button 
                      onClick={() => removeQuestion(idx)}
                      className="text-slate-300 hover:text-red-500 p-2 transition-colors rounded-xl hover:bg-red-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <textarea 
                    value={q.answerText}
                    onChange={(e) => updateAnswer(idx, e.target.value)}
                    placeholder="답변 핵심 내용 기록..."
                    className="w-full min-h-[120px] p-5 bg-white border border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  />
                  
                  {/* 🆕 녹음 컨트롤 */}
                  <div className="mt-3 flex items-center gap-3">
                    {!isRecording || activeQuestionForRecording !== q.questionId ? (
                      <button
                        onClick={() => startRecording(q.questionId)}
                        disabled={isRecording && activeQuestionForRecording !== q.questionId}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                      >
                        <Mic className="w-4 h-4" />
                        음성으로 답변 입력
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={togglePause}
                          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-xl"
                        >
                          {isPaused ? (
                            <>
                              <Play className="w-4 h-4" />
                              재개
                            </>
                          ) : (
                            <>
                              <Pause className="w-4 h-4" />
                              일시정지
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={stopRecording}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-xl"
                        >
                          <MicOff className="w-4 h-4" />
                          중지
                        </button>
                        
                        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-200">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-black text-red-700">{formatRecordingTime(recordingTime)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* 🆕 임시 텍스트 미리보기 */}
                  {activeQuestionForRecording === q.questionId && interimTranscript && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-xs text-blue-700 font-medium">
                        <span className="font-bold">인식 중:</span> {interimTranscript}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Overall Feedback Split Section */}
              <div className="pt-10 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2 rounded-xl">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight uppercase">면접관 종합 의견</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                      <ThumbsUp className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">좋았던 점</span>
                    </div>
                    <textarea 
                      value={overallPros}
                      onChange={(e) => setOverallPros(e.target.value)}
                      placeholder="후보자의 강점..."
                      className="w-full min-h-[180px] p-6 bg-emerald-50/30 border border-emerald-100 rounded-[28px] text-sm font-medium text-slate-700 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-inner"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span className="text-xs font-black text-rose-700 uppercase tracking-wider">아쉬웠던 점</span>
                    </div>
                    <textarea 
                      value={overallCons}
                      onChange={(e) => setOverallCons(e.target.value)}
                      placeholder="우려되는 부분..."
                      className="w-full min-h-[180px] p-6 bg-rose-50/30 border border-rose-100 rounded-[28px] text-sm font-medium text-slate-700 focus:bg-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Resume & Portfolio Viewer - 조건부 표시 */}
        {showResume && (
          <div className="flex flex-col w-[500px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl animate-in slide-in-from-right-4 duration-300">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 p-2 rounded-xl">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">이력서 및 포트폴리오</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Candidate Document Viewer</p>
                </div>
              </div>
              <div className="flex gap-2">
                {candidate.portfolioUrl && (
                  <a 
                    href={candidate.portfolioUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-xl text-xs font-black transition-all border border-indigo-100"
                  >
                    포트폴리오 <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
            
            <div className="flex-1 bg-slate-800 relative">
              {candidate.resumeUrl ? (
                <iframe 
                  src={`${candidate.resumeUrl}#toolbar=0&navpanes=0`} 
                  className="w-full h-full border-none"
                  title="Candidate Resume"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-12 text-center">
                   <FileText className="w-16 h-16 mb-4 opacity-20" />
                   <p className="text-sm font-bold">이력서 파일이 존재하지 않습니다.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewSession;
