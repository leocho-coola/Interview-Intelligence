// Google Calendar API 연동 서비스

import { getAccessToken } from './googleAuthService';

export interface CalendarEvent {
  id: string;
  summary: string; // 일정 제목
  start: string; // 시작 시간
  end: string; // 종료 시간
  description?: string;
}

/**
 * 오늘의 캘린더 일정 가져오기 (OAuth 방식)
 * @returns 오늘의 일정 목록
 */
export const getTodayEvents = async (): Promise<CalendarEvent[]> => {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    console.warn('Google 로그인이 필요합니다.');
    return [];
  }

  try {
    // 오늘 00:00:00 ~ 23:59:59
    const today = new Date();
    const timeMin = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const timeMax = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.append('timeMin', timeMin);
    url.searchParams.append('timeMax', timeMax);
    url.searchParams.append('singleEvents', 'true');
    url.searchParams.append('orderBy', 'startTime');

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
  
  return events.filter(event => {
    const text = `${event.summary} ${event.description || ''}`.toLowerCase();
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  });
};
