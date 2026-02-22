/**
 * React Native 전용 useAirQuality 래퍼.
 *
 * 공유 훅(@airmate/shared)에 React Native 플랫폼 의존성을 주입한다:
 *   - apiKey:      Expo 환경변수 (EXPO_PUBLIC_DATA_GO_KR_API_KEY)
 *   - getPosition: expo-location (iOS/Android 권한 처리 포함)
 */
import { useAirQuality as useAirQualityShared } from '@airmate/shared';
import * as Location from 'expo-location';

/**
 * expo-location을 사용해 현재 GPS 좌표를 반환한다.
 * 권한이 거부되면 에러를 throw하여 useAirQuality의 에러 상태로 전달된다.
 */
async function getPosition(): Promise<{ lat: number; lng: number }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('위치 접근 권한이 거부되었습니다. 설정에서 허용해 주세요.');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
  };
}

/** React Native용 미세먼지 데이터 훅 */
export function useAirQuality() {
  return useAirQualityShared({
    apiKey:      process.env.EXPO_PUBLIC_DATA_GO_KR_API_KEY ?? '',
    getPosition,
  });
}
