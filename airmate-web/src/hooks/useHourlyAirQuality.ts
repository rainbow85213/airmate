/**
 * Web 전용 useHourlyAirQuality 래퍼.
 *
 * 공유 훅(@airmate/shared)에 apiKey를 주입한다.
 * stationName은 useAirQuality() 결과에서 받아서 전달한다.
 */
import { useHourlyAirQuality as useHourlyShared } from '@airmate/shared';

export function useHourlyAirQuality(stationName: string | undefined) {
  return useHourlyShared({
    stationName,
    apiKey: import.meta.env.VITE_DATA_GO_KR_API_KEY,
  });
}
