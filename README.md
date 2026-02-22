# AirMate 💨

실시간 미세먼지(PM10/PM2.5) 조회 및 알림 서비스.
Web(React)과 App(React Native/Expo)이 **100% 비즈니스 로직을 공유**하는 모노레포 구조.

---

## 주요 기능

| 기능 | Web | App |
|------|-----|-----|
| 현재 위치 기반 대기질 조회 | ✅ | ✅ |
| PM10 / PM2.5 등급 표시 | ✅ | ✅ |
| 24시간 추이 그래프 | ✅ recharts | ✅ react-native-chart-kit |
| 나쁨 이상 시 알림 | ✅ Browser Notification | ✅ expo-notifications |
| 백그라운드 자동 알림 | ❌ | ✅ expo-background-fetch |
| 홈 / 그래프 탭 전환 | ✅ | ✅ React Navigation |

---

## 화면

| 좋음 | 보통 | 나쁨 | 매우나쁨 |
|------|------|------|---------|
| 😊 파랑 | 🙂 초록 | 😷 주황 | 🚫 빨강 |

---

## 기술 스택

### 공통
- TypeScript
- Axios
- @tanstack/react-query v5

### Web (`airmate-web`)
- React 19 + Vite
- Tailwind CSS
- recharts

### App (`airmate-app`)
- React Native 0.81 + Expo SDK 54
- React Navigation (Bottom Tabs)
- react-native-chart-kit
- expo-notifications / expo-background-fetch

### 공유 패키지 (`packages/shared`)
- WGS84 → TM 좌표 변환 (GRS80 타원체 수학 공식, 외부 API 없음)
- 에어코리아 API 래퍼 (이중 인코딩 방지 paramsSerializer)
- `useAirQuality` / `useHourlyAirQuality` 훅

---

## API

[공공데이터포털](https://www.data.go.kr) 에어코리아 API 사용.

- **측정소 조회**: `B552584/MsrstnInfoInqireSvc/getNearbyMsrstnList`
- **실시간 대기오염**: `B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty`

---

## 프로젝트 구조

```
airmate-workspace/
├── packages/
│   └── shared/              # 공통 비즈니스 로직
│       └── src/
│           ├── types/       # AirGrade, HourlyDataPoint 등 공통 타입
│           ├── lib/         # API 함수, 좌표 변환, 등급 유틸
│           └── hooks/       # useAirQuality, useHourlyAirQuality
├── airmate-web/             # React + Vite 웹 앱
│   └── src/
│       ├── components/      # HourlyChart (recharts)
│       ├── hooks/           # Web 전용 래퍼 훅, 브라우저 알림
│       └── App.tsx          # 홈/그래프 탭 UI
└── airmate-app/             # React Native + Expo 앱
    └── src/
        ├── screens/         # HomeScreen, GraphScreen
        ├── hooks/           # App 전용 래퍼 훅, 알림 권한
        └── tasks/           # 백그라운드 fetch 태스크
```

---

## 시작하기

### 사전 준비

1. [공공데이터포털](https://www.data.go.kr) 회원가입 후 아래 두 API 신청 (보통 1~2일 승인 소요)
   - 한국환경공단_에어코리아_측정소정보
   - 한국환경공단_에어코리아_대기오염정보

2. 발급받은 **Encoding 키** 복사

### 설치

```bash
git clone https://github.com/rainbow85213/airmate.git
cd airmate
npm install
```

### 환경변수 설정

```bash
# airmate-web/.env
cp airmate-web/.env.example airmate-web/.env
# VITE_DATA_GO_KR_API_KEY=발급받은_Encoding_키

# airmate-app/.env
echo "EXPO_PUBLIC_DATA_GO_KR_API_KEY=발급받은_Encoding_키" > airmate-app/.env
```

### 실행

```bash
# 웹
npm run dev --workspace=airmate-web

# 앱 (Expo Go 필요)
cd airmate-app && npx expo start
```

---

## 주요 구현 노트

### WGS84 → TM 좌표 변환
에어코리아 측정소 조회 API는 TM 좌표를 요구한다. Kakao Map API(유료) 대신 GRS80 타원체 기반 TM 투영 공식을 직접 구현해 외부 의존성 없이 변환한다 (`packages/shared/src/lib/airQualityUtils.ts`).

### serviceKey 이중 인코딩 방지
공공데이터포털 Encoding 키(`%2B`, `%3D` 등 포함)를 Axios params에 그대로 전달하면 이중 인코딩(`%25` 등)이 발생해 403 에러가 난다. `paramsSerializer`로 `serviceKey`만 인코딩 없이 삽입해 해결한다.

### 모노레포 React 중복 방지
Vite alias로 `@airmate/shared`를 직접 소스에 연결하면 React 인스턴스가 두 개 로드될 수 있다. `vite.config.ts`의 `resolve.dedupe`로 단일 인스턴스를 강제한다.
