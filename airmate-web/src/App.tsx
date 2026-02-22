import { useState } from 'react';
import { Wind, MapPin, Clock, RefreshCw, AlertCircle, Loader2, BarChart2, Home } from 'lucide-react';
import { useAirQuality } from './hooks/useAirQuality';
import { useHourlyAirQuality } from './hooks/useHourlyAirQuality';
import { useWebNotifications } from './hooks/useWebNotifications';
import { HourlyChart } from './components/HourlyChart';
import type { AirQualityData } from './types/airQuality';

// ─────────────────────────────────────────────
// 하위 컴포넌트
// ─────────────────────────────────────────────

/** 로딩 중 상태를 보여주는 전체 화면 컴포넌트 */
function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-800 text-white gap-4">
      <Loader2 size={48} className="animate-spin text-sky-400" />
      <p className="text-lg font-semibold">위치 정보를 불러오는 중...</p>
      <p className="text-sm text-slate-400">GPS 및 API 데이터를 순서대로 조회하고 있습니다.</p>
    </div>
  );
}

/** 에러 상태를 보여주는 전체 화면 컴포넌트 */
function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-800 text-white gap-6 px-6">
      <AlertCircle size={48} className="text-red-400" />
      <div className="text-center">
        <p className="text-xl font-bold mb-2">데이터를 불러올 수 없어요</p>
        <p className="text-sm text-slate-300 max-w-xs leading-relaxed">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-full font-semibold transition-colors"
      >
        <RefreshCw size={16} />
        다시 시도
      </button>
    </div>
  );
}

/** PM 수치 카드 - 개별 오염물질 정보를 보여준다 */
function PollutantCard({
  label,
  value,
  unit,
  gradeLabel,
  textColor,
}: {
  label: string;
  value: number | null;
  unit: string;
  gradeLabel: string;
  textColor: string;
}) {
  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 flex flex-col gap-1 flex-1">
      <span className={`text-xs font-bold uppercase tracking-widest opacity-70 ${textColor}`}>
        {label}
      </span>
      <div className={`flex items-baseline gap-1 ${textColor}`}>
        <span className="text-4xl font-black">
          {value !== null ? value : '–'}
        </span>
        <span className="text-sm opacity-70">{unit}</span>
      </div>
      <span className={`text-sm font-semibold ${textColor} opacity-90`}>{gradeLabel}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// 홈 탭
// ─────────────────────────────────────────────

function HomeTab({ data, onRefresh, isRefetching }: {
  data: AirQualityData;
  onRefresh: () => void;
  isRefetching: boolean;
}) {
  const { theme, stationName, address, dataTime, pm10, pm25 } = data;

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 pt-8 pb-4">
        <div className="flex items-center gap-2">
          <Wind size={24} className={`${theme.textColor} opacity-90`} />
          <h1 className={`text-xl font-extrabold tracking-tight ${theme.textColor}`}>
            AirMate
          </h1>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefetching}
          aria-label="데이터 새로고침"
          className={`
            p-2 rounded-full bg-white/20 hover:bg-white/30
            transition-colors disabled:opacity-50
            ${theme.textColor}
          `}
        >
          <RefreshCw size={18} className={isRefetching ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex flex-col items-center justify-center flex-1 px-6 gap-6">
        <div className="text-center">
          <div className="text-8xl mb-3 drop-shadow-lg select-none">
            {theme.emoji}
          </div>
          <h2 className={`text-5xl font-black ${theme.textColor} drop-shadow`}>
            {theme.label}
          </h2>
        </div>

        <div className="flex gap-4 w-full max-w-sm">
          <PollutantCard
            label="미세먼지"
            value={pm10.value}
            unit="㎍/㎥"
            gradeLabel={`PM10 · ${pm10.gradeLabel}`}
            textColor={theme.textColor}
          />
          <PollutantCard
            label="초미세먼지"
            value={pm25.value}
            unit="㎍/㎥"
            gradeLabel={`PM2.5 · ${pm25.gradeLabel}`}
            textColor={theme.textColor}
          />
        </div>
      </main>

      {/* 푸터: 측정소 정보 */}
      <footer className={`px-6 pb-6 ${theme.textColor}`}>
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-4 space-y-2">
          <div className="flex items-center gap-2 opacity-90">
            <MapPin size={14} />
            <span className="text-sm font-semibold">{stationName} 측정소</span>
          </div>
          <p className="text-xs opacity-60 pl-5">{address}</p>
          <div className="flex items-center gap-2 opacity-60">
            <Clock size={12} />
            <span className="text-xs">{dataTime} 기준</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────
// 그래프 탭
// ─────────────────────────────────────────────

function GraphTab({ data }: { data: AirQualityData }) {
  const { theme, stationName } = data;
  const { data: hourlyData, isLoading, isError } = useHourlyAirQuality(stationName);

  return (
    <div className="flex flex-col flex-1 overflow-auto px-6 py-8 gap-6">
      <div>
        <h2 className={`text-xl font-extrabold ${theme.textColor}`}>
          24시간 추이
        </h2>
        <p className={`text-sm opacity-60 mt-0.5 ${theme.textColor}`}>
          {stationName} 측정소
        </p>
      </div>

      {isLoading && (
        <div className={`flex items-center justify-center h-64 gap-3 ${theme.textColor}`}>
          <Loader2 size={24} className="animate-spin" />
          <span className="text-sm">그래프 데이터 불러오는 중...</span>
        </div>
      )}

      {isError && (
        <div className={`flex items-center justify-center h-64 gap-3 ${theme.textColor} opacity-70`}>
          <AlertCircle size={24} />
          <span className="text-sm">그래프 데이터를 불러올 수 없습니다.</span>
        </div>
      )}

      {hourlyData && (
        <>
          <HourlyChart data={hourlyData} />

          {/* 범례 설명 */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-0.5 bg-blue-400 rounded" />
              <span className={`text-sm ${theme.textColor}`}>
                PM10 미세먼지 (기준: 나쁨 ≥ 81㎍/㎥)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-0.5 bg-red-400 rounded" />
              <span className={`text-sm ${theme.textColor}`}>
                PM2.5 초미세먼지 (기준: 나쁨 ≥ 36㎍/㎥)
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 탭바
// ─────────────────────────────────────────────

type TabKey = 'home' | 'graph';

function TabBar({
  active,
  onChange,
  textColor,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  textColor: string;
}) {
  return (
    <nav className="flex border-t border-white/20">
      {([
        { key: 'home', label: '홈', Icon: Home },
        { key: 'graph', label: '그래프', Icon: BarChart2 },
      ] as { key: TabKey; label: string; Icon: React.ElementType }[]).map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`
            flex-1 flex flex-col items-center gap-1 py-3 transition-opacity
            ${active === key ? 'opacity-100' : 'opacity-40'}
            ${textColor}
          `}
        >
          <Icon size={20} />
          <span className="text-xs font-semibold">{label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─────────────────────────────────────────────
// 루트 컴포넌트
// ─────────────────────────────────────────────

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const { data, isLoading, isError, error, refetch, isRefetching } = useAirQuality();

  // 웹 알림 훅 (데이터 있을 때만 동작)
  useWebNotifications({
    pm10Grade: data?.pm10.grade,
    pm25Grade: data?.pm25.grade,
    stationName: data?.stationName,
    pm10Value: data?.pm10.value,
    pm25Value: data?.pm25.value,
  });

  if (isLoading) return <LoadingScreen />;

  if (isError || !data) {
    return (
      <ErrorScreen
        message={error?.message ?? '알 수 없는 오류가 발생했습니다.'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div
      className={`
        flex flex-col h-full w-full
        bg-gradient-to-b ${data.theme.bgFrom} ${data.theme.bgTo}
        transition-all duration-700 ease-in-out
      `}
    >
      {/* 탭 콘텐츠 */}
      {activeTab === 'home' ? (
        <HomeTab data={data} onRefresh={() => refetch()} isRefetching={isRefetching} />
      ) : (
        <GraphTab data={data} />
      )}

      {/* 하단 탭바 */}
      <TabBar active={activeTab} onChange={setActiveTab} textColor={data.theme.textColor} />
    </div>
  );
}

export default App;
