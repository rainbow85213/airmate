/**
 * 그래프 스크린 - 최근 24시간 PM10/PM2.5 추이 차트
 * react-native-chart-kit + react-native-svg 사용
 */
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { useHourlyAirQuality } from '@airmate/shared';
import type { AirQualityData } from '@airmate/shared';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface GraphScreenProps {
  data: AirQualityData;
  apiKey: string;
}

export function GraphScreen({ data, apiKey }: GraphScreenProps) {
  const { theme, stationName } = data;
  const { data: hourlyData, isLoading, isError } = useHourlyAirQuality({
    stationName,
    apiKey,
  });

  // X축 레이블: 4시간 간격으로만 표시
  const labels =
    hourlyData?.map((p, i) => (i % 4 === 0 ? p.time : '')) ?? [];

  // null 값을 0으로 대체 (차트 라이브러리가 null을 처리하지 못함)
  const pm10Data = hourlyData?.map((p) => p.pm10 ?? 0) ?? [];
  const pm25Data = hourlyData?.map((p) => p.pm25 ?? 0) ?? [];

  const chartConfig = {
    backgroundGradientFrom: 'rgba(0,0,0,0)',
    backgroundGradientTo: 'rgba(0,0,0,0)',
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(255,255,255,${opacity})`,
    labelColor: (opacity = 1) => `rgba(255,255,255,${opacity * 0.7})`,
    strokeWidth: 2,
    propsForDots: { r: '0' }, // 점 숨김
    propsForBackgroundLines: {
      stroke: 'rgba(255,255,255,0.15)',
    },
    decimalPlaces: 0,
    useShadowColorFromDataset: true,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 제목 */}
        <View style={styles.titleBox}>
          <Text style={styles.title}>24시간 추이</Text>
          <Text style={styles.subtitle}>{stationName} 측정소</Text>
        </View>

        {isLoading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="rgba(255,255,255,0.8)" />
            <Text style={styles.statusText}>그래프 데이터 불러오는 중...</Text>
          </View>
        )}

        {isError && (
          <View style={styles.centered}>
            <Text style={styles.errorText}>⚠️</Text>
            <Text style={styles.statusText}>그래프 데이터를 불러올 수 없습니다.</Text>
          </View>
        )}

        {hourlyData && hourlyData.length > 0 && (
          <>
            {/* PM10 차트 */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>
                <Text style={styles.pm10Dot}>● </Text>PM10 미세먼지 (㎍/㎥)
              </Text>
              <LineChart
                data={{ labels, datasets: [{ data: pm10Data, color: () => '#60a5fa', strokeWidth: 2 }] }}
                width={SCREEN_WIDTH - 32}
                height={180}
                chartConfig={chartConfig}
                bezier
                withInnerLines
                withOuterLines={false}
                style={styles.chart}
              />
            </View>

            {/* PM2.5 차트 */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>
                <Text style={styles.pm25Dot}>● </Text>PM2.5 초미세먼지 (㎍/㎥)
              </Text>
              <LineChart
                data={{ labels, datasets: [{ data: pm25Data, color: () => '#f87171', strokeWidth: 2 }] }}
                width={SCREEN_WIDTH - 32}
                height={180}
                chartConfig={chartConfig}
                bezier
                withInnerLines
                withOuterLines={false}
                style={styles.chart}
              />
            </View>

            {/* 등급 기준 안내 */}
            <View style={styles.legendBox}>
              <Text style={styles.legendTitle}>등급 기준</Text>
              <Text style={styles.legendItem}>PM10: 좋음 &lt;31 · 보통 &lt;81 · 나쁨 &lt;151 · 매우나쁨 ≥151</Text>
              <Text style={styles.legendItem}>PM2.5: 좋음 &lt;16 · 보통 &lt;36 · 나쁨 &lt;76 · 매우나쁨 ≥76</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  titleBox: { paddingTop: 24, paddingBottom: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },
  centered: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  statusText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  errorText: { fontSize: 36 },
  chartSection: {
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  chartTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  pm10Dot: { color: '#60a5fa' },
  pm25Dot: { color: '#f87171' },
  chart: { borderRadius: 8, marginLeft: -16 },
  legendBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  legendTitle: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  legendItem: { color: 'rgba(255,255,255,0.65)', fontSize: 11, lineHeight: 16 },
});
