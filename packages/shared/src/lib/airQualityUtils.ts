import type { AirGrade, GradeTheme } from '../types/airQuality';

// ─────────────────────────────────────────────
// 좌표 변환 (WGS84 → TM 중부원점)
// ─────────────────────────────────────────────

/**
 * WGS84 위경도를 TM(Transverse Mercator) 중부원점 좌표로 변환한다.
 * 에어코리아 측정소 조회 API가 요구하는 TM 좌표계 기준.
 * 외부 API 없이 GRS80 타원체 기반 표준 TM 투영 공식을 직접 계산하므로
 * Web / React Native 양쪽에서 동일하게 동작한다.
 *
 * 투영 파라미터 (EPSG:2097 기준):
 *   - 중앙 자오선: 127° E
 *   - 원점 위도:   38° N
 *   - 축척 계수:   1.0
 *   - 가산 동:     200,000 m
 *   - 가산 북:     500,000 m
 */
export function wgs84ToTm(lat: number, lng: number): { x: number; y: number } {
  const D2R = Math.PI / 180;

  const a   = 6378137.0;
  const f   = 1 / 298.257222101;
  const b   = a * (1 - f);
  const e2  = (a * a - b * b) / (a * a);
  const ep2 = (a * a - b * b) / (b * b);

  const k0   = 1.0;
  const lat0 = 38  * D2R;
  const lon0 = 127 * D2R;
  const dx   = 200_000;
  const dy   = 500_000;

  const latR   = lat * D2R;
  const lonR   = lng * D2R;
  const sinLat = Math.sin(latR);
  const cosLat = Math.cos(latR);
  const tanLat = Math.tan(latR);

  const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
  const T = tanLat * tanLat;
  const C = ep2 * cosLat * cosLat;
  const A = cosLat * (lonR - lon0);

  const e4 = e2 * e2;
  const e6 = e4 * e2;

  const calcM = (φ: number) =>
    a * (
      (1 - e2/4 - 3*e4/64 - 5*e6/256)     * φ
      - (3*e2/8  + 3*e4/32  + 45*e6/1024) * Math.sin(2*φ)
      + (15*e4/256 + 45*e6/1024)           * Math.sin(4*φ)
      - (35*e6/3072)                        * Math.sin(6*φ)
    );

  const M  = calcM(latR);
  const M0 = calcM(lat0);

  const A2 = A*A, A3 = A2*A, A4 = A3*A, A5 = A4*A, A6 = A5*A;

  const x = dx + k0 * N * (
    A
    + (1 - T + C)                         * A3 / 6
    + (5 - 18*T + T*T + 72*C - 58*ep2)   * A5 / 120
  );

  const y = dy + k0 * (
    M - M0
    + N * tanLat * (
        A2 / 2
      + (5 - T + 9*C + 4*C*C)             * A4 / 24
      + (61 - 58*T + T*T + 600*C - 330*ep2) * A6 / 720
    )
  );

  return { x, y };
}

// ─────────────────────────────────────────────
// 등급 변환 유틸리티
// ─────────────────────────────────────────────

/** 공공데이터포털 숫자 등급 코드(1~4)를 AirGrade 타입으로 변환한다. */
export function parseGrade(gradeCode: string): AirGrade {
  switch (gradeCode) {
    case '1': return 'good';
    case '2': return 'normal';
    case '3': return 'bad';
    case '4': return 'very-bad';
    default:  return 'good';
  }
}

/** PM10 수치(㎍/㎥)로 등급을 직접 계산한다. */
export function calcPm10Grade(value: number): AirGrade {
  if (value <= 30)  return 'good';
  if (value <= 80)  return 'normal';
  if (value <= 150) return 'bad';
  return 'very-bad';
}

/** PM2.5 수치(㎍/㎥)로 등급을 직접 계산한다. */
export function calcPm25Grade(value: number): AirGrade {
  if (value <= 15) return 'good';
  if (value <= 35) return 'normal';
  if (value <= 75) return 'bad';
  return 'very-bad';
}

/** AirGrade를 한국어 레이블로 변환한다. */
export function gradeToLabel(grade: AirGrade): string {
  const map: Record<AirGrade, string> = {
    'good':     '좋음',
    'normal':   '보통',
    'bad':      '나쁨',
    'very-bad': '매우나쁨',
  };
  return map[grade];
}

/** 수치 문자열을 숫자로 변환한다. 유효하지 않은 값("-" 등)은 null을 반환한다. */
export function parseValue(raw: string): number | null {
  const n = Number(raw);
  return isNaN(n) ? null : n;
}

// ─────────────────────────────────────────────
// UI 테마 (Web: Tailwind 클래스 / App: hex color)
// ─────────────────────────────────────────────

/** 등급별 UI 테마. bgColor는 React Native StyleSheet용 hex 값이다. */
export const GRADE_THEMES: Record<AirGrade, GradeTheme> = {
  'good': {
    label:     '좋음',
    bgFrom:    'from-sky-400',
    bgTo:      'to-blue-500',
    bgColor:   '#38bdf8',
    textColor: 'text-white',
    emoji:     '😊',
  },
  'normal': {
    label:     '보통',
    bgFrom:    'from-emerald-400',
    bgTo:      'to-green-500',
    bgColor:   '#34d399',
    textColor: 'text-white',
    emoji:     '🙂',
  },
  'bad': {
    label:     '나쁨',
    bgFrom:    'from-orange-400',
    bgTo:      'to-orange-600',
    bgColor:   '#ea580c',
    textColor: 'text-white',
    emoji:     '😷',
  },
  'very-bad': {
    label:     '매우나쁨',
    bgFrom:    'from-red-400',
    bgTo:      'to-rose-600',
    bgColor:   '#f87171',
    textColor: 'text-white',
    emoji:     '🚫',
  },
};
