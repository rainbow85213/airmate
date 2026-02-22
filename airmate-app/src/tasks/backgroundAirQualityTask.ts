/**
 * 백그라운드 대기질 확인 태스크.
 *
 * expo-task-manager + expo-background-fetch를 사용해 앱이 꺼져있어도
 * 주기적으로 대기질을 확인하고, 나쁨 이상이면 로컬 알림을 발송한다.
 *
 * 등록(registerBackgroundFetchAsync)은 App.tsx에서 한다.
 */
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAirQuality, calcPm10Grade, calcPm25Grade, parseValue } from '@airmate/shared';
import { sendLocalNotification } from '../hooks/useNotifications';
import type { AirGrade } from '@airmate/shared';

export const BACKGROUND_FETCH_TASK = 'airmate-background-fetch';

const STATION_NAME_KEY = 'airmate_station_name';
const LAST_GRADE_KEY = 'airmate_last_bg_grade';

/** 포어그라운드에서 stationName을 저장해두면 백그라운드 태스크가 사용한다 */
export async function saveStationName(name: string) {
  await AsyncStorage.setItem(STATION_NAME_KEY, name);
}

/** 백그라운드 fetch 태스크를 15분 간격으로 등록 */
export async function registerBackgroundFetch() {
  const status = await BackgroundFetch.getStatusAsync();
  if (
    status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
    status === BackgroundFetch.BackgroundFetchStatus.Denied
  ) {
    console.log('[BackgroundFetch] 권한이 없거나 제한됨');
    return;
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15분 (iOS는 OS가 실제 주기 결정)
      stopOnTerminate: false,   // 앱 종료 후에도 계속
      startOnBoot: true,        // Android: 재부팅 후 재등록
    });
    console.log('[BackgroundFetch] 태스크 등록 완료');
  }
}

// ─────────────────────────────────────────────
// 태스크 정의 (앱 초기화 시점에 등록되어야 함)
// ─────────────────────────────────────────────

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const stationName = await AsyncStorage.getItem(STATION_NAME_KEY);
    if (!stationName) return BackgroundFetch.BackgroundFetchResult.NoData;

    const apiKey = process.env.EXPO_PUBLIC_DATA_GO_KR_API_KEY ?? '';
    const item = await getAirQuality(stationName, apiKey);

    const pm10 = parseValue(item.pm10Value);
    const pm25 = parseValue(item.pm25Value);

    const pm10Grade: AirGrade = pm10 !== null ? calcPm10Grade(pm10) : 'good';
    const pm25Grade: AirGrade = pm25 !== null ? calcPm25Grade(pm25) : 'good';

    const badGrades: AirGrade[] = ['bad', 'very-bad'];
    const pm10Bad = badGrades.includes(pm10Grade);
    const pm25Bad = badGrades.includes(pm25Grade);

    if (!pm10Bad && !pm25Bad) {
      // 좋아졌으면 마지막 등급 초기화
      await AsyncStorage.removeItem(LAST_GRADE_KEY);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    const worstGrade: AirGrade =
      pm10Grade === 'very-bad' || pm25Grade === 'very-bad' ? 'very-bad' : 'bad';
    const lastGrade = await AsyncStorage.getItem(LAST_GRADE_KEY);

    if (lastGrade === worstGrade) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const gradeLabel = worstGrade === 'very-bad' ? '매우 나쁨' : '나쁨';
    const parts: string[] = [];
    if (pm10Bad && pm10 !== null) parts.push(`PM10 ${pm10}㎍/㎥`);
    if (pm25Bad && pm25 !== null) parts.push(`PM2.5 ${pm25}㎍/㎥`);

    await sendLocalNotification(
      `😷 대기질 ${gradeLabel} — ${stationName} 측정소`,
      parts.join(' · '),
    );
    await AsyncStorage.setItem(LAST_GRADE_KEY, worstGrade);

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (e) {
    console.error('[BackgroundFetch] 오류:', e);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});
