/**
 * 브라우저 Notification API를 사용하는 웹 알림 훅.
 *
 * - grade가 'bad' | 'very-bad'일 때 권한 요청 후 알림 발송
 * - localStorage로 마지막 알림 등급을 기억해 중복 발송 방지
 * - 등급이 바뀔 때만 재발송
 */
import { useEffect } from 'react';
import type { AirGrade } from '@airmate/shared';

const STORAGE_KEY = 'airmate_last_notified_grade';

function getLastNotifiedGrade(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setLastNotifiedGrade(grade: string) {
  try {
    localStorage.setItem(STORAGE_KEY, grade);
  } catch {
    // ignore
  }
}

async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

function sendNotification(title: string, body: string) {
  if (Notification.permission !== 'granted') return;
  new Notification(title, {
    body,
    icon: '/vite.svg',
    tag: 'airmate-alert', // 같은 tag면 이전 알림이 교체됨
  });
}

interface UseWebNotificationsOptions {
  pm10Grade: AirGrade | undefined;
  pm25Grade: AirGrade | undefined;
  stationName: string | undefined;
  pm10Value: number | null | undefined;
  pm25Value: number | null | undefined;
}

export function useWebNotifications({
  pm10Grade,
  pm25Grade,
  stationName,
  pm10Value,
  pm25Value,
}: UseWebNotificationsOptions) {
  useEffect(() => {
    if (!pm10Grade || !pm25Grade || !stationName) return;

    // 나쁨 이상인 오염물질 파악
    const badGrades = (['bad', 'very-bad'] as AirGrade[]);
    const pm10Bad = badGrades.includes(pm10Grade);
    const pm25Bad = badGrades.includes(pm25Grade);

    if (!pm10Bad && !pm25Bad) return;

    // 알림 기준 등급 결정 (더 나쁜 쪽 우선)
    const worstGrade =
      pm10Grade === 'very-bad' || pm25Grade === 'very-bad'
        ? 'very-bad'
        : 'bad';

    // 이미 같은 등급으로 알림을 보냈으면 중복 방지
    const lastGrade = getLastNotifiedGrade();
    if (lastGrade === worstGrade) return;

    const gradeLabel = worstGrade === 'very-bad' ? '매우 나쁨' : '나쁨';
    const parts: string[] = [];
    if (pm10Bad && pm10Value !== null && pm10Value !== undefined) {
      parts.push(`PM10 ${pm10Value}㎍/㎥`);
    }
    if (pm25Bad && pm25Value !== null && pm25Value !== undefined) {
      parts.push(`PM2.5 ${pm25Value}㎍/㎥`);
    }

    requestPermission().then((granted) => {
      if (!granted) return;
      sendNotification(
        `😷 대기질 ${gradeLabel} — ${stationName} 측정소`,
        parts.join(' · '),
      );
      setLastNotifiedGrade(worstGrade);
    });
  }, [pm10Grade, pm25Grade, stationName, pm10Value, pm25Value]);
}
