import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import { QUESTION_POOL } from '../constants';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, Filter } from 'lucide-react';

interface SettingsProps {
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [newQuestion, setNewQuestion] = useState({ category: 'Culture', text: '' });
  const [filterCategory, setFilterCategory] = useState<string>('All');

  useEffect(() => {
    // localStorage에서 커스텀 질문 로드
    const savedQuestions = localStorage.getItem('custom_interview_questions');
    if (savedQuestions) {
      setQuestions(JSON.parse(savedQuestions));
    } else {
      // 기본 질문으로 초기화
      setQuestions(QUESTION_POOL);
      localStorage.setItem('custom_interview_questions', JSON.stringify(QUESTION_POOL));
    }
  }, []);

  const saveQuestions = (updatedQuestions: Question[]) => {
    setQuestions(updatedQuestions);
    localStorage.setItem('custom_interview_questions', JSON.stringify(updatedQuestions));
  };

  const handleAddQuestion = () => {
    if (!newQuestion.text.trim()) return;
    
    const newQ: Question = {
      id: `custom-${Date.now()}`,
      category: newQuestion.category,
      text: newQuestion.text
    };
    
    const updated = [...questions, newQ];
    saveQuestions(updated);
    setNewQuestion({ category: 'Culture', text: '' });
  };

  const handleEditQuestion = (id: string) => {
    const question = questions.find(q => q.id === id);
    if (question) {
      setEditingId(id);
      setEditText(question.text);
    }
  };

  const handleSaveEdit = () => {
    if (!editingId || !editText.trim()) return;
    
    const updated = questions.map(q => 
      q.id === editingId ? { ...q, text: editText } : q
    );
    saveQuestions(updated);
    setEditingId(null);
    setEditText('');
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm('이 질문을 삭제하시겠습니까?')) {
      const updated = questions.filter(q => q.id !== id);
      saveQuestions(updated);
    }
  };

  const handleResetToDefault = () => {
    if (confirm('모든 질문을 기본값으로 초기화하시겠습니까?')) {
      saveQuestions(QUESTION_POOL);
    }
  };

  const categories = Array.from(new Set(questions.map(q => q.category)));
  const filteredQuestions = filterCategory === 'All' 
    ? questions 
    : questions.filter(q => q.category === filterCategory);

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
            <h1 className="text-2xl font-extrabold text-slate-900">면접 질문 관리</h1>
            <p className="text-sm text-slate-500 mt-1">질문 템플릿을 추가, 수정, 삭제할 수 있습니다</p>
          </div>
        </div>
        <button
          onClick={handleResetToDefault}
          className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          기본값으로 초기화
        </button>
      </header>

      {/* Add New Question */}
      <section className="bg-gradient-to-br from-indigo-500 to-violet-500 p-6 rounded-2xl shadow-lg text-white">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          새 질문 추가
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold mb-2">카테고리</label>
            <select
              value={newQuestion.category}
              onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
              className="w-full px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="General" className="text-slate-900">공통 (General)</option>
              <option value="Culture" className="text-slate-900">컬쳐 (Culture)</option>
              <option value="SW" className="text-slate-900">개발 (SW)</option>
              <option value="PO" className="text-slate-900">기획 (PO)</option>
              <option value="Design" className="text-slate-900">디자인 (Design)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">질문 내용</label>
            <textarea
              value={newQuestion.text}
              onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
              placeholder="예: 가장 일하기 좋았던 조직의 특징은 무엇이었나요?"
              className="w-full px-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 font-medium focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
              rows={3}
            />
          </div>
          <button
            onClick={handleAddQuestion}
            disabled={!newQuestion.text.trim()}
            className="w-full bg-white text-indigo-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            질문 추가
          </button>
        </div>
      </section>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-5 h-5 text-slate-500" />
        <span className="text-sm font-bold text-slate-600">필터:</span>
        {['All', ...categories].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              filterCategory === cat
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat === 'All' ? '전체' : cat}
          </button>
        ))}
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            질문 목록 ({filteredQuestions.length}개)
          </h2>
        </div>
        
        {filteredQuestions.map((question) => (
          <div
            key={question.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-all"
          >
            <div className="flex items-start gap-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                question.category === 'Culture' ? 'bg-violet-100 text-violet-700' :
                question.category === 'SW' ? 'bg-blue-100 text-blue-700' :
                question.category === 'PO' ? 'bg-green-100 text-green-700' :
                question.category === 'Design' ? 'bg-pink-100 text-pink-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {question.category}
              </span>
              
              <div className="flex-1 min-w-0">
                {editingId === question.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors flex items-center gap-2 text-sm font-bold"
                      >
                        <Save className="w-4 h-4" />
                        저장
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditText(''); }}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors flex items-center gap-2 text-sm font-bold"
                      >
                        <X className="w-4 h-4" />
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-800 font-medium">{question.text}</p>
                )}
              </div>

              {editingId !== question.id && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEditQuestion(question.id)}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                    title="수정"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
