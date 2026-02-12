
import { Question, JobRole, Candidate } from './types';

// Helper to get today's timestamp at a specific hour
const getTodayAt = (hours: number) => {
  const date = new Date();
  date.setHours(hours, 0, 0, 0);
  return date.getTime();
};

export const QUESTION_POOL: Question[] = [
  // 공통
  { id: 'g1', category: 'General', text: '우리 회사에 지원하게 된 가장 큰 동기는 무엇인가요?' },
  { id: 'g2', category: 'General', text: '본인의 커리어에서 가장 중요하게 생각하는 가치는?' },
  { id: 'g3', category: 'General', text: '동료와 갈등이 생겼을 때 본인만의 해결 방법은?' },
  
  // SW (Software Engineering)
  { id: 'sw1', category: 'SW', text: '최근에 해결했던 기술적 난제와 해결 방법은 무엇인가요?' },
  { id: 'sw2', category: 'SW', text: '코드 리뷰 시 가장 중요하게 생각하는 포인트는?' },
  { id: 'sw3', category: 'SW', text: '대규모 트래픽 처리 경험이나 성능 최적화 사례가 있나요?' },
  { id: 'sw4', category: 'SW', text: '본인이 선호하는 기술 스택과 그 이유는 무엇인가요?' },
  
  // PO (Product Owner / Manager)
  { id: 'po1', category: 'PO', text: '데이터 기반으로 의사결정을 내렸던 구체적인 사례를 말씀해주세요.' },
  { id: 'po2', category: 'PO', text: '이해관계자들 간의 의견 대립을 어떻게 조율하시나요?' },
  { id: 'po3', category: 'PO', text: '제품의 성공을 측정하는 본인만의 핵심 지표(KPI)는 무엇인가요?' },
  { id: 'po4', category: 'PO', text: '우선순위 설정 시 가장 중요하게 고려하는 기준은 무엇인가요?' },

  // Design
  { id: 'de1', category: 'Design', text: '사용자 경험(UX) 개선을 위해 데이터를 활용한 사례가 있나요?' },
  { id: 'de2', category: 'Design', text: '디자인 시스템 구축 및 관리 경험이 있으신가요?' },
  { id: 'de3', category: 'Design', text: '개발자와의 협업 시 디자인 의도를 전달하는 본인만의 노하우는?' },

  // Culture / HR
  { id: 'hr1', category: 'Culture', text: '가장 일하기 좋았던 조직의 특징은 무엇이었나요?' },
  { id: 'hr2', category: 'Culture', text: '본인이 생각하는 이상적인 리더십의 모습은?' },
];

export const MOCK_CANDIDATES: Candidate[] = [];
