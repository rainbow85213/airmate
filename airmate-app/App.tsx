/**
 * AirMate App 루트.
 *
 * - React Navigation BottomTab으로 홈/그래프 탭 분리
 * - 앱 시작 시 백그라운드 fetch 태스크 등록
 * - 데이터 로드 후 측정소 이름 저장 + 알림 권한 요청
 */

// 백그라운드 태스크는 앱 초기화 전에 defineTask를 완료해야 하므로 최상단 import
import './src/tasks/backgroundAirQualityTask';
import { registerBackgroundFetch, saveStationName } from './src/tasks/backgroundAirQualityTask';

import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAirQuality } from './src/hooks/useAirQuality';
import { useNotifications } from './src/hooks/useNotifications';
import { HomeScreen } from './src/screens/HomeScreen';
import { GraphScreen } from './src/screens/GraphScreen';

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────

const API_KEY = process.env.EXPO_PUBLIC_DATA_GO_KR_API_KEY ?? '';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { gcTime: 10 * 60 * 1000, retry: false },
  },
});

const Tab = createBottomTabNavigator();

// ─────────────────────────────────────────────
// 로딩/에러 화면
// ─────────────────────────────────────────────

function LoadingScreen() {
  return (
    <View style={[styles.fullScreen, styles.darkBg]}>
      <ActivityIndicator size="large" color="#38bdf8" />
      <Text style={styles.loadingText}>위치 정보를 불러오는 중...</Text>
      <Text style={styles.loadingSubText}>GPS 및 API 데이터를 조회하고 있습니다.</Text>
    </View>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={[styles.fullScreen, styles.darkBg]}>
      <Text style={styles.errorEmoji}>⚠️</Text>
      <Text style={styles.errorTitle}>데이터를 불러올 수 없어요</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>다시 시도</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────
// 메인 앱 (데이터 로드 후 탭 네비게이션)
// ─────────────────────────────────────────────

function AirMateApp() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useAirQuality();

  // 알림 훅 (앱 시작 시 권한 요청 + 나쁨 등급 알림)
  useNotifications({
    pm10Grade: data?.pm10.grade,
    pm25Grade: data?.pm25.grade,
    stationName: data?.stationName,
    pm10Value: data?.pm10.value,
    pm25Value: data?.pm25.value,
  });

  // 측정소 이름을 AsyncStorage에 저장 (백그라운드 태스크용)
  useEffect(() => {
    if (data?.stationName) {
      saveStationName(data.stationName);
    }
  }, [data?.stationName]);

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
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: data.theme.bgColor,
            borderTopColor: 'rgba(255,255,255,0.2)',
          },
          tabBarActiveTintColor: '#ffffff',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        }}
      >
        <Tab.Screen
          name="홈"
          options={{ tabBarIcon: () => <Text style={styles.tabIcon}>🏠</Text> }}
        >
          {() => (
            <HomeScreen
              data={data}
              onRefresh={() => refetch()}
              isRefetching={isRefetching}
            />
          )}
        </Tab.Screen>

        <Tab.Screen
          name="그래프"
          options={{ tabBarIcon: () => <Text style={styles.tabIcon}>📊</Text> }}
        >
          {() => <GraphScreen data={data} apiKey={API_KEY} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ─────────────────────────────────────────────
// 앱 엔트리
// ─────────────────────────────────────────────

export default function App() {
  // 백그라운드 fetch 등록 (앱 마운트 시 1회)
  useEffect(() => {
    registerBackgroundFetch();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AirMateApp />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

// ─────────────────────────────────────────────
// 스타일
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  darkBg: {
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  loadingText: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16 },
  loadingSubText: { color: '#94a3b8', fontSize: 13, textAlign: 'center' },
  errorEmoji: { fontSize: 48 },
  errorTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 8 },
  errorMessage: {
    color: '#cbd5e1',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 280,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  tabIcon: { fontSize: 18 },
});
