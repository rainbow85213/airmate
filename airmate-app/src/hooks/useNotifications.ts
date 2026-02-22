/**
 * Expo 알림 권한 + 발송 로직 훅.
 *
 * - 앱 시작 시 알림 권한 요청
 * - grade가 'bad' | 'very-bad'이면 로컬 알림 발송
 * - AsyncStorage로 마지막 알림 등급 기억해 중복 방지
 */
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AirGrade } from '@airmate/shared';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const STORAGE_KEY = 'airmate_last_notified_grade';

async function getLastGrade(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

async function saveLastGrade(grade: string) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, grade);
  } catch {
    // ignore
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function sendLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null, // 즉시 발송
  });
}

interface UseNotificationsOptions {
  pm10Grade: AirGrade | undefined;
  pm25Grade: AirGrade | undefined;
  stationName: string | undefined;
  pm10Value: number | null | undefined;
  pm25Value: number | null | undefined;
}

export function useNotifications({
  pm10Grade,
  pm25Grade,
  stationName,
  pm10Value,
  pm25Value,
}: UseNotificationsOptions) {
  // 앱 시작 시 권한 요청
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // 데이터 변경 시 알림 조건 확인
  useEffect(() => {
    if (!pm10Grade || !pm25Grade || !stationName) return;

    const badGrades: AirGrade[] = ['bad', 'very-bad'];
    const pm10Bad = badGrades.includes(pm10Grade);
    const pm25Bad = badGrades.includes(pm25Grade);

    if (!pm10Bad && !pm25Bad) return;

    const worstGrade: AirGrade =
      pm10Grade === 'very-bad' || pm25Grade === 'very-bad' ? 'very-bad' : 'bad';
    const gradeLabel = worstGrade === 'very-bad' ? '매우 나쁨' : '나쁨';

    const parts: string[] = [];
    if (pm10Bad && pm10Value !== null && pm10Value !== undefined) {
      parts.push(`PM10 ${pm10Value}㎍/㎥`);
    }
    if (pm25Bad && pm25Value !== null && pm25Value !== undefined) {
      parts.push(`PM2.5 ${pm25Value}㎍/㎥`);
    }

    (async () => {
      const lastGrade = await getLastGrade();
      if (lastGrade === worstGrade) return;

      const granted = await requestNotificationPermission();
      if (!granted) return;

      await sendLocalNotification(
        `😷 대기질 ${gradeLabel} — ${stationName} 측정소`,
        parts.join(' · '),
      );
      await saveLastGrade(worstGrade);
    })();
  }, [pm10Grade, pm25Grade, stationName, pm10Value, pm25Value]);
}
