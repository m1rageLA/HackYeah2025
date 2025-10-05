import React, { useCallback } from 'react';
import {
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useForm } from '@/app/context/FormContext';
import { TIME_OPTIONS } from '@/components/categoryComponets/TimeReportComponent';
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';

type ProgressStep = 'completed' | 'current' | 'upcoming';

interface SummaryItem {
  label: string;
  value: string;
}

interface Props {
  reportTitle?: string;
  summaryTitle?: string;
  summarySubtitle?: string;
  summaryItems?: SummaryItem[];
  privacyNotice?: string;
  continueLabel?: string;
  progress?: ProgressStep[];
  onBack?: () => void;
  onContinue?: () => void;
}

const DEFAULT_SUMMARY_ITEMS: SummaryItem[] = [
  { label: 'Lokalizacja', value: 'obok mnie' },
  { label: 'Zdarzenie', value: 'ludzie uzbrojeni' },
  { label: 'Kiedy', value: 'teraz' },
  { label: 'Co widzia\u0142e\u015b', value: 'uzbrojeni \u017co\u0142nierze' },
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

const GradientBackground = cssInterop(LinearGradient, {
  className: 'style',
});

export default function ConfirmReportComponent() {
  const notice = DEFAULT_PRIVACY_NOTICE;
  const router = useRouter();

  const { data } = useForm();

  const hello = {
    hello: 'world',
  };

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
              value: dataValue ? 'Dodano zdjęcie' : 'Brak',
            };
          case 'locationMode':
            return { label: 'Lokacja', value: 'yes' };
          default:
            return { label: key, value: JSON.stringify(dataValue) };
        }
      },
    );
    return labelsValue;
  }, [data]);

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
                router.back();
              }}
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
            <View className="">
              <Text className="text-2xl font-semibold text-[#F5F8FF]">
                PlaceHolder Title
              </Text>
              <Text className="mt-2 text-base text-[#8EA1C1]">
                PlaceHolder SubTitle
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

            <View className="flex-1 " />
            <TouchableOpacity
              activeOpacity={0.88}
              className="h-14 items-center justify-center rounded-2xl bg-[#1E5BFF]"
              onPress={() => router.replace('/')}
            >
              <Text className="text-base font-semibold text-white">Zgłoś</Text>
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
    </GradientBackground>
  );
}
