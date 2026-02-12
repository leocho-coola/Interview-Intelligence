
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
  
  // 메이크스타 컬쳐 인터뷰 - 6가지 일하는 방식
  // 1. 우리 모두의 길로 여긴다
  { id: 'culture1', category: 'Culture', text: '회사의 최우선 목표와 중요한 일이라면 망설임 없이 도와서 해결한 경험이 있나요? 구체적으로 말씀해주세요.' },
  { id: 'culture2', category: 'Culture', text: '"나와 나의 일을 구분하지 않아요" - 회사의 문제를 본인의 문제처럼 생각하고 해결했던 사례가 있나요?' },
  
  // 2. 실수는 공개하고 해결합니다
  { id: 'culture3', category: 'Culture', text: '업무 중 실수를 했을 때, 어떻게 공개하고 해결했나요? 구체적인 사례를 말씀해주세요.' },
  { id: 'culture4', category: 'Culture', text: '누구라도 실수를 할 수 있다고 생각하시나요? 실수를 반복하지 않도록 한 본인만의 방법이 있나요?' },
  { id: 'culture5', category: 'Culture', text: '"그럴 수도 있어요. 그럼 반복하지 않도록 어떻게 하면 좋을까요?" - 실수를 개선의 기회로 만든 경험이 있나요?' },
  
  // 3. 서로 경청하고 해야 할 말은 결손하고 예의 바르게 합니다
  { id: 'culture6', category: 'Culture', text: '팀원의 의견을 경청하고 존중했던 구체적인 사례가 있나요?' },
  { id: 'culture7', category: 'Culture', text: '어려운 피드백을 전달해야 했던 상황에서, 어떻게 솔직하면서도 예의 바르게 이야기했나요?' },
  { id: 'culture8', category: 'Culture', text: '"마이크 들리지 않아요" - 상대방이 제대로 이해했는지 확인하며 소통한 경험이 있나요?' },
  
  // 4. 충분한 맥락과 배경을 공유합니다
  { id: 'culture9', category: 'Culture', text: '업무 공유 시 배경과 맥락을 충분히 설명해서 팀의 이해를 도운 사례가 있나요?' },
  { id: 'culture10', category: 'Culture', text: '"왜?"라는 질문을 서로가 어려워하지 않도록 한 경험이 있나요?' },
  { id: 'culture11', category: 'Culture', text: '"모든 사람이 알고 있다는 가정 하에 이야기 하지 않아요" - 정보 비대칭을 해소했던 사례를 말씀해주세요.' },
  
  // 5. NO 보다는 YES를 이야기합니다
  { id: 'culture12', category: 'Culture', text: '불가능해 보이는 요청에도 대안을 제시하며 긍정적으로 고려해본 경험이 있나요?' },
  { id: 'culture13', category: 'Culture', text: '반대를 위한 반대는 하지 않고, 건설적인 대안을 제시했던 사례가 있나요?' },
  { id: 'culture14', category: 'Culture', text: '"못해요, 싫어요, 안돼요는 안돼요" - 긍정적인 태도로 문제를 해결했던 경험을 말씀해주세요.' },
  
  // 6. 항상 회사에 도움이 되는 방향으로 결정합니다
  { id: 'culture15', category: 'Culture', text: '회사의 이익과 목표를 최우선으로 두고 결정을 내렸던 구체적인 사례가 있나요?' },
  { id: 'culture16', category: 'Culture', text: '개인적으로 해야 할 일이 있더라도, 회사의 중요한 일을 우선시했던 경험이 있나요?' },
  { id: 'culture17', category: 'Culture', text: '"한 마음 한 뜻으로 모여요" - 팀의 목표를 위해 본인의 의견을 조율했던 사례를 말씀해주세요.' },
];

export const MOCK_CANDIDATES: Candidate[] = [];
