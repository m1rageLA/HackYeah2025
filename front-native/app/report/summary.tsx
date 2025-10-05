import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useForm } from '@/app/context/FormContext';
import { TIME_OPTIONS } from '@/components/categoryComponets/TimeReportComponent';
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';
import * as FileSystem from 'expo-file-system';

const SUBMIT_REDIRECT_DELAY_MS = 1800;
const FETCH_TIMEOUT_MS = 12000;

const GradientBackground = cssInterop(LinearGradient, {
  className: 'style',
});
const AnimatedView = cssInterop(Animated.View, {
  className: 'style',
});

type ProgressStep = 'completed' | 'current' | 'upcoming';

type SummaryItem = {
  label: string;
  value: string;
};

type SubmissionState = 'idle' | 'loading' | 'success' | 'error';

type Coordinate = {
  latitude: number;
  longitude: number;
};

const DEFAULT_SUMMARY_ITEMS: SummaryItem[] = [
  { label: 'Lokalizacja', value: 'obok mnie' },
  { label: 'Zdarzenie', value: 'ludzie uzbrojeni' },
  { label: 'Kiedy', value: 'teraz' },
  { label: 'Co widziales', value: 'uzbrojeni zolnierze' },
];

const DEFAULT_PRIVACY_NOTICE =
  'Privacy Notice: Report data is NOT stored on your phone. It is only available to authorized personnel.';

const trigger = (callback?: () => void) => {
  if (!callback) return;
  requestAnimationFrame(callback);
};

const getBarColor = (step: ProgressStep) => {
  switch (step) {
    case 'completed':
      return 'bg-[#F5F8FF]';
    case 'current':
      return 'bg-[#9EB2D0]';
    default:
      return 'bg-[rgba(119,139,178,0.45)]';
  }
};

export async function convertFileToBase64(file: {
  uri: string;
  mimeType: string;
  fileName: string;
}) {
  try {
    let localUri = file.uri;

    if (file.uri.startsWith('blob:')) {
      const response = await fetch(file.uri);
      const blob = await response.blob();

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onerror = reject;
        reader.onload = () => resolve(reader.result as string);
      });

      reader.readAsDataURL(blob);
      const dataUrl = await base64Promise;
      const base64 = dataUrl.split(',')[1];

      return {
        name: file.fileName,
        type: file.mimeType,
        base64: `data:${file.mimeType};base64,${base64}`,
      };
    }

    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: 'base64',
    });

    return {
      name: file.fileName,
      type: file.mimeType,
      base64: `data:${file.mimeType};base64,${base64}`,
    };
  } catch (error) {
    console.error('Error converting file to base64:', error);
    throw error;
  }
}

export default function ConfirmReportComponent() {
  const notice = DEFAULT_PRIVACY_NOTICE;
  const router = useRouter();

  const { data } = useForm();

  const [submissionState, setSubmissionState] =
    useState<SubmissionState>('idle');
  const [overlayVisible, setOverlayVisible] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const statusScale = useRef(new Animated.Value(0)).current;
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const makeSummaryItems = useCallback((): SummaryItem[] => {
    const labelsValue = Object.entries(data.data || {}).map(
      ([key, dataValue]) => {
        switch (key) {
          case 'time':
            return {
              label: 'Czas',
              value:
                TIME_OPTIONS.find((option) => option.value === dataValue)
                  ?.label || 'Now',
            };

          case 'evidence':
            return {
              label: 'Dowody',
              value: dataValue ? 'Dodano zdjecie' : 'Brak',
            };
          case 'locationMode':
            return {
              label: 'Lokacja',
              value: dataValue === 'manual' ? 'Wybrana recznie' : 'Obok mnie',
            };
          case 'locationCoordinates':
            if (!dataValue) {
              return { label: 'Koordynaty', value: 'Brak' };
            }
            try {
              const point = dataValue as Coordinate;
              return {
                label: 'Koordynaty',
                value: `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(
                  5,
                )}`,
              };
            } catch {
              return { label: 'Koordynaty', value: 'Brak' };
            }
          default:
            return { label: key, value: JSON.stringify(dataValue) };
        }
      },
    );
    return labelsValue.length ? labelsValue : DEFAULT_SUMMARY_ITEMS;
  }, [data]);

  const statusMeta = useMemo(
    () => ({
      loading: {
        title: 'Wysylamy zgloszenie�',
        subtitle: 'To potrwa tylko chwile.',
        icon: 'cloud-upload',
        iconColor: '#9EB2D0',
      },
      success: {
        title: 'Dziekujemy! Zgloszenie wyslane',
        subtitle: 'Za moment wrocisz na ekran glowny.',
        icon: 'check-circle',
        iconColor: '#85E6B0',
      },
      error: {
        title: 'Ups! Nie udalo sie wyslac',
        subtitle: 'Sprobuj ponownie po powrocie.',
        icon: 'close-circle',
        iconColor: '#FF9E7C',
      },
    }),
    [],
  );

  const activeStatus =
    submissionState === 'idle' ? null : statusMeta[submissionState];

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const animateOverlayIn = useCallback(() => {
    overlayOpacity.setValue(0);
    statusScale.setValue(0.85);
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [overlayOpacity, statusScale]);

  const animateStatusPop = useCallback(() => {
    Animated.spring(statusScale, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [statusScale]);

  const scheduleRedirect = useCallback(() => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }
    redirectTimeoutRef.current = setTimeout(() => {
      router.replace('/');
    }, SUBMIT_REDIRECT_DELAY_MS);
  }, [router]);

  const handleSubmit = useCallback(async () => {
    if (submissionState === 'loading') {
      return;
    }

    setOverlayVisible(true);
    setSubmissionState('loading');
    animateOverlayIn();

    let image = null;
    try {
      image = data.data
        ? await convertFileToBase64(data.data.evidence as any)
        : null;
    } catch (error) {
      console.warn('Failed to convert evidence image', error);
    }

    const payload = {
      type:
        data.category === 'Ludzie uzbrojeni'
          ? 'red'
          : data.category === 'Drony'
          ? 'orange'
          : data.category === 'Other'
          ? 'gray'
          : 'yellow',
      data: {
        ...data.data,
        evidence: image,
      },
      geo_point: data.data?.locationCoordinates,
    };

    try {
      const response = await Promise.race([
        fetch('https://civisafe.online/reports/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Request timed out')),
            FETCH_TIMEOUT_MS,
          ),
        ),
      ]);

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      setSubmissionState('success');
    } catch (error) {
      console.warn('Report submission failed', error);
      setSubmissionState('error');
    } finally {
      animateStatusPop();
      scheduleRedirect();
    }
  }, [
    animateOverlayIn,
    animateStatusPop,
    data,
    scheduleRedirect,
    submissionState,
  ]);

  return (
    <GradientBackground
      colors={['#051230', '#020713']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-5 py-6">
          <View className="rounded-xl border border-[rgba(61,96,143,0.28)] bg-[rgba(6,19,44,0.95)] px-3 py-4 flex-row items-center">
            <TouchableOpacity
              activeOpacity={0.85}
              className="h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(122,167,255,0.25)] bg-[rgba(13,30,64,0.7)]"
              onPress={() => {
                trigger(() => router.back());
              }}
              disabled={submissionState === 'loading'}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color="#F5F8FF"
              />
            </TouchableOpacity>

            <View className="ml-4 flex-1">
              <Text className="text-lg font-semibold text-[#F5F8FF]">
                Report Title
              </Text>
              <View className="mt-2 flex-row items-center gap-2">
                {data.componentsIdentifiers.map((indentifier, index) => (
                  <View
                    key={index}
                    className={`h-1 flex-1 rounded-full ${
                      index <= data.componentIndex
                        ? 'bg-[#3C8CFF]'
                        : 'bg-[rgba(95,124,168,0.4)]'
                    }`}
                  />
                ))}
              </View>
            </View>
          </View>
          <View className="px-3 flex flex-1 mt-10">
            <View>
              <Text className="text-2xl font-semibold text-[#F5F8FF]">
                Potwierdź zgłoszenie
              </Text>
              <Text className="mt-2 text-base text-[#8EA1C1]">
                Potwierdź aktywne zgłoszenie
              </Text>
            </View>

            <View className="mt-6 rounded-2xl border border-[rgba(126,149,190,0.35)] bg-[rgba(16,31,65,0.85)] px-5 py-5">
              {makeSummaryItems().map((item, index) => (
                <View
                  key={`${item.label}-${index}`}
                  className={index > 0 ? 'mt-4' : undefined}
                >
                  <Text className="text-[11px] uppercase tracking-[0.25em] text-[#6D7BA0]">
                    {item.label}
                  </Text>
                  <Text className="mt-1 text-[12px] text-base text-[#D5E2FF]">
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>

            <View className="flex-1" />
            <TouchableOpacity
              activeOpacity={0.88}
              className={`h-14 items-center justify-center rounded-2xl ${
                submissionState === 'loading'
                  ? 'bg-[rgba(30,91,255,0.4)]'
                  : 'bg-[#1E5BFF]'
              }`}
              disabled={submissionState === 'loading'}
              onPress={() => handleSubmit()}
            >
              <Text className="text-base font-semibold text-white">Zgloś</Text>
            </TouchableOpacity>

            <View className="mt-6 flex-row items-start gap-3 rounded-2xl border border-[rgba(88,108,156,0.45)] bg-[rgba(11,26,65,0.85)] px-3 py-2">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-[rgba(26,52,102,0.85)]">
                <MaterialCommunityIcons
                  name="shield-check"
                  size={22}
                  color="#8CB4FF"
                />
              </View>
              <Text className="flex-1 text-[10px] leading-5 text-[#9EB2D0]">
                {notice}
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {overlayVisible && activeStatus ? (
        <AnimatedView
          pointerEvents="none"
          style={[styles.overlay, { opacity: overlayOpacity }]}
        >
          <View className="absolute inset-0 border-r-indigo-900/80" />
          <View className="flex-1 items-center justify-center px-8">
            <AnimatedView
              style={{
                transform: [{ scale: statusScale }],
              }}
              className="w-full items-center rounded-3xl border border-[rgba(80,110,168,0.45)] bg-cyan-950/90 px-6 py-10"
            >
              {submissionState === 'loading' ? (
                <ActivityIndicator size="large" color="#A8C5FF" />
              ) : (
                <MaterialCommunityIcons
                  name={activeStatus.icon as any}
                  size={66}
                  color={activeStatus.iconColor}
                />
              )}

              <Text className="mt-6 text-center text-xl font-semibold text-[#F5F8FF]">
                {activeStatus.title}
              </Text>
              <Text className="mt-2 text-center text-sm text-[#A1B6D8]">
                {submissionState === 'loading'
                  ? activeStatus.subtitle
                  : `${activeStatus.subtitle}\nTrwa przekierowanie`}
              </Text>
            </AnimatedView>
          </View>
        </AnimatedView>
      ) : null}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
