
export enum JobRole {
  FRONTEND = 'Frontend Developer',
  BACKEND = 'Backend Developer',
  PRODUCT_MANAGER = 'Product Manager',
  DESIGNER = 'Product Designer',
  HR_SPECIALIST = 'HR Specialist'
}

export enum InterviewStage {
  FIRST_TECHNICAL = '1차 역량 인터뷰',
  SECOND_CULTURE = '2차 컬쳐 인터뷰',
  FINAL = '최종 인터뷰',
  COFFEE_CHAT = '커피챗'
}

export interface Question {
  id: string;
  category: string;
  text: string;
}

export interface Answer {
  questionId: string;
  questionText: string;
  answerText: string;
}

export interface Interviewer {
  name: string;
  department: string;
}

export interface InterviewNote {
  id: string;
  candidateId: string;
  interviewer: Interviewer;
  answers: Answer[];
  overallPros: string;
  overallCons: string;
  timestamp: number;
  stage: InterviewStage;
}

export interface Candidate {
  id: string;
  name: string;
  role: JobRole;
  notes: InterviewNote[];
  scheduledTime?: number;
  resumeUrl?: string;
  portfolioUrl?: string;
  calendarEventId?: string; // 캘린더 이벤트 ID (중복 방지용)
}

export type ViewState = 'DASHBOARD' | 'INTERVIEW' | 'CONSOLIDATION' | 'ANALYTICS' | 'SETTINGS' | 'WEEKLY_STATS';
