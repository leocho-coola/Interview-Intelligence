
import { GoogleGenAI, Type } from "@google/genai";
import { Candidate, JobRole } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeJobPersona = async (role: JobRole, candidates: Candidate[]) => {
  const relevantCandidates = candidates.filter(c => c.role === role && c.notes.length > 0);
  
  if (relevantCandidates.length === 0) {
    return "분석할 데이터가 부족합니다. 최소 1개 이상의 인터뷰 완료 데이터가 필요합니다.";
  }

  const interviewDataSummary = relevantCandidates.map(c => {
    return c.notes.map(n => ({
      interviewer: `${n.interviewer.name} (${n.interviewer.department})`,
      pros: n.overallPros,
      cons: n.overallCons,
      answers: n.answers.map(a => `${a.questionText}: ${a.answerText}`).join('\n')
    })).join('\n---\n');
  }).join('\n\n=== NEXT CANDIDATE ===\n\n');

  const prompt = `
    당신은 전문 HR 컨설턴트입니다. 다음은 ${role} 직무 후보자들의 정성적인 인터뷰 데이터(좋았던 점, 아쉬웠던 점 포함)입니다.
    이 데이터를 바탕으로 우리 조직에 가장 적합한 '직무 페르조나'를 정의해주세요.
    
    포함내용:
    1. 핵심 역량 분석 (면접관들이 공통적으로 주목한 강점)
    2. 주요 답변 패턴 및 합격자의 핵심 키워드
    3. 채용 시 주의해야 할 공통적인 리스크(Cons) 패턴
    4. 향후 면접에서 보완해야 할 질문 가이드
    
    데이터:
    ${interviewDataSummary}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "AI 분석 결과를 생성할 수 없습니다.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "분석 중 오류가 발생했습니다.";
  }
};

export const summarizeConsolidatedNotes = async (candidate: Candidate) => {
  if (candidate.notes.length === 0) return null;

  const notesText = candidate.notes.map((n, idx) => `
    [면접관 ${idx + 1}: ${n.interviewer.name}]
    좋았던 점(Pros): ${n.overallPros}
    아쉬웠던 점(Cons): ${n.overallCons}
    상세 답변 요약: ${n.answers.map(a => a.answerText).join(', ')}
  `).join('\n\n');

  const prompt = `
    후보자 ${candidate.name}에 대해 면접관들이 남긴 장단점 기록을 통합 요약해주세요.
    반드시 다음 2가지 섹션으로 한국어 답변하세요.
    
    1. [공통 긍정 신호]: 면접관들이 공통적으로 높게 평가한 부분.
    2. [추가 검증 필요 사항]: 면접관들이 공통적으로 우려(Cons)하거나 의견이 갈리는 부분.
    
    데이터:
    ${notesText}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "요약 중 오류가 발생했습니다.";
  }
};
