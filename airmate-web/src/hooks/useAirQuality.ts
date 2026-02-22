/**
 * Web 전용 useAirQuality 래퍼.
 *
 * 공유 훅(@airmate/shared)에 Web 플랫폼 의존성을 주입한다:
 *   - apiKey: Vite 환경변수 (VITE_DATA_GO_KR_API_KEY)
 *   - getPosition: 브라우저 navigator.geolocation
 */
import { useAirQuality as useAirQualityShared } from '@airmate/shared';
import { getCurrentPosition } from '../lib/api';


export function useAirQuality() {
  return useAirQualityShared({
    apiKey:      import.meta.env.VITE_DATA_GO_KR_API_KEY,
    getPosition: getCurrentPosition,
  });
}
