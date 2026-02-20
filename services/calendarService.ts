// Google Calendar API 연동 서비스

import { getAccessToken } from './googleAuthService';
import { InterviewStage } from '../types';

export interface CalendarEvent {
  id: string;
  summary: string; // 일정 제목
  start: string; // 시작 시간
  end: string; // 종료 시간
  description?: string;
}

export interface ParsedInterviewInfo {
  stage: InterviewStage;
  candidateName: string;
  originalTitle: string;
}

/**
 * 오늘 기준 ±7일 캘린더 일정 가져오기 (OAuth 방식)
 * @returns 최근 2주간의 일정 목록
 */
export const getTodayEvents = async (): Promise<CalendarEvent[]> => {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    console.warn('Google 로그인이 필요합니다.');
    return [];
  }

  try {
    // 오늘 기준 7일 전 00:00:00 ~ 7일 후 23:59:59
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    sevenDaysLater.setHours(23, 59, 59, 999);
    
    const timeMin = sevenDaysAgo.toISOString();
    const timeMax = sevenDaysLater.toISOString();

    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.append('timeMin', timeMin);
    url.searchParams.append('timeMax', timeMax);
    url.searchParams.append('singleEvents', 'true');
    url.searchParams.append('orderBy', 'startTime');
    
    console.log('📅 캘린더 조회 범위:', {
      from: sevenDaysAgo.toLocaleDateString('ko-KR'),
      to: sevenDaysLater.toLocaleDateString('ko-KR')
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('Calendar API 에러:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    
    console.log('📊 전체 캘린더 이벤트:', data.items?.length || 0);

    return data.items?.map((item: any) => ({
      id: item.id,
      summary: item.summary || '(제목 없음)',
      start: item.start.dateTime || item.start.date,
      end: item.end.dateTime || item.end.date,
      description: item.description,
    })) || [];

  } catch (error) {
    console.error('캘린더 일정 가져오기 실패:', error);
    return [];
  }
};

/**
 * 면접 관련 일정만 필터링
 * @param events 전체 일정 목록
 * @returns 면접 관련 일정만
 */
export const filterInterviewEvents = (events: CalendarEvent[]): CalendarEvent[] => {
  const keywords = ['면접', '인터뷰', 'interview', '채용', '후보자', 'candidate'];
  
  const filtered = events.filter(event => {
    const text = `${event.summary} ${event.description || ''}`.toLowerCase();
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  });
  
  console.log('🔍 필터링 결과:', {
    전체: events.length,
    면접관련: filtered.length,
    제목목록: filtered.map(e => e.summary)
  });
  
  return filtered;
};

/**
 * 캘린더 이벤트 제목에서 면접 단계와 후보자 이름 파싱
 * @param eventTitle 캘린더 이벤트 제목
 * @returns 파싱된 면접 정보
 * 
 * 예시:
 * - "[1차 역량] 홍길동 면접" → { stage: '1차 역량 인터뷰', candidateName: '홍길동' }
 * - "[2차 컬쳐] 김철수 인터뷰" → { stage: '2차 컬쳐 인터뷰', candidateName: '김철수' }
 * - "[최종] 이영희" → { stage: '최종 인터뷰', candidateName: '이영희' }
 * - "박민수 면접" → { stage: '1차 역량 인터뷰' (기본값), candidateName: '박민수' }
 */
export const parseInterviewStage = (eventTitle: string): ParsedInterviewInfo => {
  let stage: InterviewStage = InterviewStage.FIRST_TECHNICAL; // 기본값
  let candidateName = eventTitle;
  
  // 1차 역량 인터뷰 패턴
  if (/\[?1차|첫.?번째|first|초기|역량\]?/i.test(eventTitle)) {
    stage = InterviewStage.FIRST_TECHNICAL;
    candidateName = eventTitle.replace(/\[?1차.*?\]?/gi, '').trim();
  }
  // 2차 컬쳐 인터뷰 패턴
  else if (/\[?2차|두.?번째|second|컬쳐|문화\]?/i.test(eventTitle)) {
    stage = InterviewStage.SECOND_CULTURE;
    candidateName = eventTitle.replace(/\[?2차.*?\]?/gi, '').trim();
  }
  // 최종 인터뷰 패턴
  else if (/\[?최종|final|마지막\]?/i.test(eventTitle)) {
    stage = InterviewStage.FINAL;
    candidateName = eventTitle.replace(/\[?최종.*?\]?/gi, '').trim();
  }
  // 커피챗 패턴
  else if (/\[?커피|coffee|chat|챗\]?/i.test(eventTitle)) {
    stage = InterviewStage.COFFEE_CHAT;
    candidateName = eventTitle.replace(/\[?커피.*?\]?/gi, '').trim();
  }
  
  // 불필요한 키워드 제거
  candidateName = candidateName
    .replace(/면접|인터뷰|interview|채용|후보자|candidate/gi, '')
    .replace(/\[.*?\]/g, '') // 대괄호 제거
    .replace(/\(.*?\)/g, '') // 소괄호 제거
    .trim();
  
  console.log('🔍 단계 파싱:', {
    원본: eventTitle,
    단계: stage,
    후보자: candidateName
  });
  
  return {
    stage,
    candidateName,
    originalTitle: eventTitle
  };
};
