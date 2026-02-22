/**
 * 홈 스크린 - 현재 대기질 대시보드
 */
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { AirQualityData } from '@airmate/shared';

function PollutantCard({
  label,
  value,
  unit,
  gradeLabel,
}: {
  label: string;
  value: number | null;
  unit: string;
  gradeLabel: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <View style={styles.cardValueRow}>
        <Text style={styles.cardValue}>{value !== null ? value : '–'}</Text>
        <Text style={styles.cardUnit}> {unit}</Text>
      </View>
      <Text style={styles.cardGrade}>{gradeLabel}</Text>
    </View>
  );
}

interface HomeScreenProps {
  data: AirQualityData;
  onRefresh: () => void;
  isRefetching: boolean;
}

export function HomeScreen({ data, onRefresh, isRefetching }: HomeScreenProps) {
  const { theme, stationName, address, dataTime, pm10, pm25 } = data;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgColor }]}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor="rgba(255,255,255,0.8)"
          />
        }
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>💨 AirMate</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Text style={styles.refreshBtnText}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* 메인 등급 */}
        <View style={styles.mainSection}>
          <Text style={styles.gradeEmoji}>{theme.emoji}</Text>
          <Text style={styles.gradeLabel}>{theme.label}</Text>
        </View>

        {/* PM 카드 */}
        <View style={styles.cardRow}>
          <PollutantCard
            label="미세먼지 PM10"
            value={pm10.value}
            unit="㎍/㎥"
            gradeLabel={pm10.gradeLabel}
          />
          <PollutantCard
            label="초미세먼지 PM2.5"
            value={pm25.value}
            unit="㎍/㎥"
            gradeLabel={pm25.gradeLabel}
          />
        </View>

        {/* 측정소 정보 */}
        <View style={styles.stationBox}>
          <Text style={styles.stationName}>📍 {stationName} 측정소</Text>
          <Text style={styles.stationAddr}>{address}</Text>
          <Text style={styles.dataTime}>🕐 {dataTime} 기준</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },
  appTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  refreshBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtnText: { color: '#fff', fontSize: 20 },
  mainSection: { alignItems: 'center', paddingVertical: 40 },
  gradeEmoji: { fontSize: 80, marginBottom: 12 },
  gradeLabel: { color: '#fff', fontSize: 48, fontWeight: '900' },
  cardRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  cardValue: { color: '#fff', fontSize: 36, fontWeight: '900' },
  cardUnit: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  cardGrade: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  stationBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  stationName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  stationAddr: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  dataTime: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
});
