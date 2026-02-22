/**
 * Web 플랫폼 전용 API 진입점.
 *
 * 공통 비즈니스 로직은 @airmate/shared 패키지에 있으며,
 * 이 파일은 Web에서만 필요한 navigator.geolocation 래퍼를 제공한다.
 */

export { convertToTm, getNearbyStation, getAirQuality } from '@airmate/shared';

// ─────────────────────────────────────────────
// Web 전용: 브라우저 Geolocation
// ─────────────────────────────────────────────

/**
 * 브라우저 Geolocation API를 Promise 형태로 래핑한다.
 * React Native에서는 airmate-app/src/lib/location.ts 의 구현을 사용한다.
 */
export function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('이 브라우저는 위치 정보를 지원하지 않습니다.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(new Error('위치 접근 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.'));
            break;
          case err.POSITION_UNAVAILABLE:
            reject(new Error('위치 정보를 사용할 수 없습니다.'));
            break;
          case err.TIMEOUT:
            reject(new Error('위치 정보 요청이 시간 초과되었습니다.'));
            break;
          default:
            reject(new Error('알 수 없는 위치 오류가 발생했습니다.'));
        }
      },
      { timeout: 10_000, maximumAge: 60_000 }
    );
  });
}
