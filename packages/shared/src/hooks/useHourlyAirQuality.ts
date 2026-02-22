import { useQuery } from '@tanstack/react-query';
import { getHourlyAirQuality } from '../lib/api';
import { parseGrade, calcPm10Grade, calcPm25Grade, parseValue } from '../lib/airQualityUtils';
import type { HourlyDataPoint } from '../types/airQuality';

export interface UseHourlyAirQualityOptions {
  /** useAirQuality로 먼저 확보한 측정소 이름. undefined면 쿼리가 비활성화된다. */
  stationName: string | undefined;
  apiKey: string;
}

/**
 * 최근 24시간 시간별 대기오염 데이터를 가져오는 공유 훅.
 *
 * stationName이 확보된 이후에만 API를 호출한다(enabled: !!stationName).
 * 반환 데이터는 시간 오름차순(오래된 것부터)으로 정렬된 HourlyDataPoint 배열이다.
 *
 * Web(recharts)과 React Native(react-native-chart-kit) 양쪽에서 동일하게 사용한다.
 */
export function useHourlyAirQuality({ stationName, apiKey }: UseHourlyAirQualityOptions) {
  return useQuery<HourlyDataPoint[], Error>({
    queryKey: ['airQuality', 'hourly', stationName],

    queryFn: async (): Promise<HourlyDataPoint[]> => {
      if (!stationName) throw new Error('측정소 이름이 없습니다.');

      const items = await getHourlyAirQuality(stationName, apiKey);

      // API는 최신순(내림차순)으로 반환하므로 reverse()로 시간 오름차순 정렬
      return [...items].reverse().map((item) => {
        const pm10 = parseValue(item.pm10Value);
        const pm25 = parseValue(item.pm25Value);

        const pm10Grade = item.pm10Grade !== '-' && item.pm10Grade
          ? parseGrade(item.pm10Grade)
          : pm10 !== null ? calcPm10Grade(pm10) : 'good';

        const pm25Grade = item.pm25Grade !== '-' && item.pm25Grade
          ? parseGrade(item.pm25Grade)
          : pm25 !== null ? calcPm25Grade(pm25) : 'good';

        return {
          // dataTime 형식: "2024-01-01 14:00" → "14:00" 추출
          time: item.dataTime.slice(11, 16),
          pm10,
          pm25,
          pm10Grade,
          pm25Grade,
        };
      });
    },

    enabled: !!stationName,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
