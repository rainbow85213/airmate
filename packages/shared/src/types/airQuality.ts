// ─────────────────────────────────────────────
// 미세먼지 등급 타입
// ─────────────────────────────────────────────

/** 미세먼지 4단계 등급 */
export type AirGrade = 'good' | 'normal' | 'bad' | 'very-bad';

/** 각 등급에 대응하는 UI 테마 정보 */
export interface GradeTheme {
  label: string;
  /** Tailwind / NativeWind gradient start color */
  bgFrom: string;
  /** Tailwind / NativeWind gradient end color */
  bgTo: string;
  /** hex color code for React Native fallback */
  bgColor: string;
  textColor: string;
  emoji: string;
}

// ─────────────────────────────────────────────
// API 응답 타입
// ─────────────────────────────────────────────

/** 측정소 정보 조회 API 응답 아이템 */
export interface NearbyStationItem {
  stationName: string;
  addr: string;
  tm: number;
}

/** 공공데이터포털 공통 응답 래퍼 */
export interface DataGoKrResponse<T> {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      items: T[];
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

/** 실시간 대기오염 측정 데이터 아이템 */
export interface AirQualityItem {
  stationName: string;
  dataTime: string;
  pm10Value: string;
  pm25Value: string;
  pm10Grade: string;
  pm25Grade: string;
  o3Value: string;
  no2Value: string;
  coValue: string;
  so2Value: string;
  khaiValue: string;
  khaiGrade: string;
}

// ─────────────────────────────────────────────
// 훅 반환 타입
// ─────────────────────────────────────────────

/** 시간별 대기오염 데이터 포인트 (그래프용) */
export interface HourlyDataPoint {
  /** "HH:MM" 형식의 시각 */
  time: string;
  pm10: number | null;
  pm25: number | null;
  pm10Grade: AirGrade;
  pm25Grade: AirGrade;
}

/** useAirQuality 훅이 최종적으로 반환하는 정제된 데이터 */
export interface AirQualityData {
  stationName: string;
  address: string;
  dataTime: string;
  pm10: {
    value: number | null;
    grade: AirGrade;
    gradeLabel: string;
  };
  pm25: {
    value: number | null;
    grade: AirGrade;
    gradeLabel: string;
  };
  theme: GradeTheme;
}
