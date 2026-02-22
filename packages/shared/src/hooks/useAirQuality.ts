import { useQuery } from '@tanstack/react-query';
import { convertToTm, getNearbyStation, getAirQuality } from '../lib/api';
import {
  parseGrade,
  calcPm10Grade,
  calcPm25Grade,
  gradeToLabel,
  GRADE_THEMES,
  parseValue,
} from '../lib/airQualityUtils';
import type { AirQualityData } from '../types/airQuality';

// ─────────────────────────────────────────────
// 인터페이스
// ─────────────────────────────────────────────

/**
 * useAirQuality 훅에 주입하는 플랫폼별 의존성.
 *
 * Web과 React Native는 위치 정보를 가져오는 방식이 다르다:
 *   - Web: navigator.geolocation (브라우저 내장)
 *   - React Native: expo-location (권한 요청 필요)
 *
 * 이 인터페이스로 의존성을 주입하면 훅 내부 로직은
 * 플랫폼에 관계없이 100% 동일하게 유지된다.
 */
export interface UseAirQualityOptions {
  /** 공공데이터포털 Encoding 서비스 키 */
  apiKey: string;
  /** 플랫폼별 GPS 좌표 반환 함수 */
  getPosition: () => Promise<{ lat: number; lng: number }>;
}

// ─────────────────────────────────────────────
// useAirQuality Hook
// ─────────────────────────────────────────────

/**
 * 실시간 미세먼지 데이터를 가져오는 공유 커스텀 훅.
 *
 * 내부적으로 다음 흐름을 순차 실행한다:
 *   1. getPosition() → 현재 WGS84 좌표 획득 (플랫폼별 구현 주입)
 *   2. convertToTm() → TM 중부원점 좌표로 변환 (로컬 수학 계산)
 *   3. getNearbyStation() → 가장 가까운 측정소 조회
 *   4. getAirQuality()   → 실시간 PM10/PM2.5 데이터 획득
 *
 * Web(Vite)과 React Native(Expo) 양쪽에서 동일하게 사용한다.
 */
export function useAirQuality({ apiKey, getPosition }: UseAirQualityOptions) {
  return useQuery<AirQualityData, Error>({
    queryKey: ['airQuality'],

    queryFn: async (): Promise<AirQualityData> => {
      // ── Step 1: GPS 좌표 획득 ──────────────────────
      const { lat, lng } = await getPosition();

      // ── Step 2: TM 좌표 변환 (로컬 계산) ──────────
      const { x: tmX, y: tmY } = convertToTm(lat, lng);

      // ── Step 3: 가장 가까운 측정소 조회 ───────────
      const station = await getNearbyStation(tmX, tmY, apiKey);

      // ── Step 4: 실시간 대기오염 데이터 조회 ────────
      const raw = await getAirQuality(station.stationName, apiKey);

      // ── 데이터 정제 ───────────────────────────────
      const pm10Val = parseValue(raw.pm10Value);
      const pm25Val = parseValue(raw.pm25Value);

      const pm10Grade = raw.pm10Grade !== '-' && raw.pm10Grade
        ? parseGrade(raw.pm10Grade)
        : pm10Val !== null ? calcPm10Grade(pm10Val) : 'good';

      const pm25Grade = raw.pm25Grade !== '-' && raw.pm25Grade
        ? parseGrade(raw.pm25Grade)
        : pm25Val !== null ? calcPm25Grade(pm25Val) : 'good';

      return {
        stationName: station.stationName,
        address:     station.addr,
        dataTime:    raw.dataTime,
        pm10: {
          value:      pm10Val,
          grade:      pm10Grade,
          gradeLabel: gradeToLabel(pm10Grade),
        },
        pm25: {
          value:      pm25Val,
          grade:      pm25Grade,
          gradeLabel: gradeToLabel(pm25Grade),
        },
        theme: GRADE_THEMES[pm10Grade],
      };
    },

    staleTime:           5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect:  true,
    retry: 1,
  });
}
