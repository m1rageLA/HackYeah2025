import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

const DEFAULT_PROGRESS: ProgressStep[] = ['completed', 'current', 'upcoming', 'upcoming'];

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

export default function ConfirmReportComponent({
  reportTitle = 'Ludzie uzbrojeni',
  summaryTitle = 'Potwierd\u017a zg\u0142oszenie',
  summarySubtitle = 'Dodaj zdj\u0119cie, je\u015bli jest dost\u0119pne',
  summaryItems,
  privacyNotice,
  continueLabel = 'Continue',
  progress,
  onBack,
  onContinue,
}: Props) {
  const progressItems = progress && progress.length > 0 ? progress : DEFAULT_PROGRESS;
  const items = summaryItems && summaryItems.length > 0 ? summaryItems : DEFAULT_SUMMARY_ITEMS;
  const notice = privacyNotice || DEFAULT_PRIVACY_NOTICE;

  return (
    <View className="flex-1 bg-[#02102F] px-4 py-6">
      <View className="flex-1 rounded-[32px] border border-[rgba(61,96,143,0.28)] bg-[rgba(6,19,44,0.95)] px-5 py-6">
        <View className="flex-row items-center">
          <TouchableOpacity
            activeOpacity={0.85}
            className="h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(122,167,255,0.25)] bg-[rgba(13,30,64,0.7)]"
            onPress={() => trigger(onBack)}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#F5F8FF" />
          </TouchableOpacity>

          <View className="ml-4 flex-1">
            <Text className="text-lg font-semibold text-[#F5F8FF]">{reportTitle}</Text>
            <View className="mt-2 flex-row items-center gap-1">
              {progressItems.map((step, index) => {
                const widthClass = index === 0 ? 'flex-1' : 'w-10';
                return (
                  <View
                    key={`${step}-${index}`}
                    className={`h-1 rounded-full ${widthClass} ${getBarColor(step)}`}
                  />
                );
              })}
            </View>
          </View>
        </View>

        <View className="mt-6 h-px bg-[rgba(61,96,143,0.35)]" />

        <View className="mt-8">
          <Text className="text-2xl font-semibold text-[#F5F8FF]">{summaryTitle}</Text>
          <Text className="mt-2 text-base text-[#8EA1C1]">{summarySubtitle}</Text>
        </View>

        <View className="mt-6 rounded-2xl border border-[rgba(126,149,190,0.35)] bg-[rgba(16,31,65,0.85)] px-5 py-5">
          {items.map((item, index) => (
            <View key={`${item.label}-${index}`} className={index > 0 ? 'mt-4' : undefined}>
              <Text className="text-[11px] uppercase tracking-[0.25em] text-[#6D7BA0]">
                {item.label}
              </Text>
              <Text className="mt-1 text-base text-[#D5E2FF]">{item.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          className="mt-8 h-14 items-center justify-center rounded-2xl bg-[#1E5BFF] shadow-[0px_12px_24px_rgba(30,91,255,0.35)]"
          onPress={() => trigger(onContinue)}
        >
          <Text className="text-base font-semibold text-white">{continueLabel}</Text>
        </TouchableOpacity>

        <View className="mt-6 flex-row items-start gap-3 rounded-2xl border border-[rgba(88,108,156,0.45)] bg-[rgba(11,26,65,0.85)] px-5 py-4">
          <View className="mt-1 h-10 w-10 items-center justify-center rounded-full bg-[rgba(26,52,102,0.85)]">
            <MaterialCommunityIcons name="shield-check" size={22} color="#8CB4FF" />
          </View>
          <Text className="flex-1 text-sm leading-5 text-[#9EB2D0]">{notice}</Text>
        </View>
      </View>
    </View>
  );
}
