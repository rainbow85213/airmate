import axios from 'axios';
import type {
  NearbyStationItem,
  DataGoKrResponse,
  AirQualityItem,
} from '../types/airQuality';
import { wgs84ToTm } from './airQualityUtils';

// ─────────────────────────────────────────────
// Axios 인스턴스
// ─────────────────────────────────────────────

/**
 * 공공데이터포털 API 호출용 Axios 인스턴스.
 *
 * [serviceKey 인코딩 정책]
 * data.go.kr에서 발급하는 Encoding 키(%2B, %3D 등 포함)를
 * Axios params에 그대로 넣으면 이중 인코딩(%25 등)이 발생하여 403 에러가 난다.
 * paramsSerializer로 serviceKey만 재인코딩 없이 삽입하여 이 문제를 해결한다.
 * Web(Vite), React Native(Metro) 양쪽에서 동일하게 동작한다.
 */
const dataGoKrApi = axios.create({
  baseURL: 'https://apis.data.go.kr',
  paramsSerializer: (params: Record<string, unknown>) => {
    return Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) =>
        k === 'serviceKey'
          ? `serviceKey=${v}`
          : `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
      )
      .join('&');
  },
});

// ─────────────────────────────────────────────
// Step 1: WGS84 → TM 좌표 변환
// ─────────────────────────────────────────────

/**
 * WGS84 좌표를 TM 중부원점 좌표로 변환한다.
 * 수학 공식으로 직접 계산하므로 외부 API 의존성이 없다.
 */
export function convertToTm(
  lat: number,
  lng: number
): { x: number; y: number } {
  return wgs84ToTm(lat, lng);
}

// ─────────────────────────────────────────────
// Step 2: TM 좌표 → 근처 측정소 조회
// ─────────────────────────────────────────────

/**
 * 공공데이터포털 측정소정보 조회 API를 통해 가장 가까운 측정소를 조회한다.
 *
 * @param tmX   TM 좌표 X
 * @param tmY   TM 좌표 Y
 * @param apiKey 공공데이터포털 Encoding 서비스 키
 */
export async function getNearbyStation(
  tmX: number,
  tmY: number,
  apiKey: string,
): Promise<NearbyStationItem> {
  const { data } = await dataGoKrApi.get<DataGoKrResponse<NearbyStationItem>>(
    '/B552584/MsrstnInfoInqireSvc/getNearbyMsrstnList',
    {
      params: {
        serviceKey: apiKey,
        returnType: 'json',
        tmX,
        tmY,
        ver: '1.1',
      },
    }
  );

  const items = data?.response?.body?.items;
  if (!items?.length) {
    throw new Error('근처 측정소를 찾을 수 없습니다.');
  }

  return items[0];
}

// ─────────────────────────────────────────────
// Step 3: 측정소명 → 실시간 대기오염 데이터
// ─────────────────────────────────────────────

/**
 * 공공데이터포털 대기오염정보 조회 API를 통해 실시간 PM 데이터를 가져온다.
 *
 * @param stationName 측정소 이름
 * @param apiKey      공공데이터포털 Encoding 서비스 키
 */
export async function getAirQuality(
  stationName: string,
  apiKey: string,
): Promise<AirQualityItem> {
  const { data } = await dataGoKrApi.get<DataGoKrResponse<AirQualityItem>>(
    '/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty',
    {
      params: {
        serviceKey: apiKey,
        returnType: 'json',
        numOfRows: 1,
        pageNo: 1,
        stationName,
        dataTerm: 'DAILY',
        ver: '1.3',
      },
    }
  );

  const items = data?.response?.body?.items;
  if (!items?.length) {
    throw new Error(`'${stationName}' 측정소의 데이터를 찾을 수 없습니다.`);
  }

  return items[0];
}

// ─────────────────────────────────────────────
// 시간별 대기오염 데이터 (그래프용)
// ─────────────────────────────────────────────

/**
 * 최근 24시간의 시간별 대기오염 데이터를 가져온다.
 * getAirQuality()와 동일한 엔드포인트지만 numOfRows=24로 요청한다.
 *
 * @param stationName 측정소 이름
 * @param apiKey      공공데이터포털 Encoding 서비스 키
 */
export async function getHourlyAirQuality(
  stationName: string,
  apiKey: string,
): Promise<AirQualityItem[]> {
  const { data } = await dataGoKrApi.get<DataGoKrResponse<AirQualityItem>>(
    '/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty',
    {
      params: {
        serviceKey: apiKey,
        returnType: 'json',
        numOfRows: 24,
        pageNo: 1,
        stationName,
        dataTerm: 'DAILY',
        ver: '1.3',
      },
    }
  );

  const items = data?.response?.body?.items;
  if (!items?.length) {
    throw new Error(`'${stationName}' 측정소의 시간별 데이터를 찾을 수 없습니다.`);
  }

  return items;
}
