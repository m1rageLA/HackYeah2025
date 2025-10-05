import { useRouter } from 'expo-router';
import React, { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ReportShellProps {
  categoryTitle: string;
  progressSteps?: readonly unknown[];
  currentStep?: number;
  introTitle?: string;
  introDescription?: string;
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
  showDivider?: boolean;
}

const DEFAULT_BACKGROUND = '#02102F';
const CARD_BORDER_COLOR = 'rgba(61,96,143,0.28)';
const CARD_BACKGROUND = 'rgba(6,19,44,0.95)';
const PROGRESS_ACTIVE = '#3C8CFF';
const PROGRESS_INACTIVE = 'rgba(95,124,168,0.4)';

export default function ReportShell({
  categoryTitle,
  progressSteps,
  currentStep = 0,
  introTitle,
  introDescription,
  children,
  footer,
  onBack,
  showDivider = true,
}: ReportShellProps) {
  const router = useRouter();
  const steps = progressSteps ?? [];

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    router.back();
  };

  return (
    <View className="flex-1 px-4 py-6" style={{ backgroundColor: DEFAULT_BACKGROUND }}>
      <View
        className="flex-1 rounded-[32px] px-5 py-6"
        style={{
          borderWidth: 1,
          borderColor: CARD_BORDER_COLOR,
          backgroundColor: CARD_BACKGROUND,
        }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Wróć"
            activeOpacity={0.85}
            className="h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(122,167,255,0.25)] bg-[rgba(13,30,64,0.7)]"
            onPress={handleBack}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#F5F8FF" />
          </TouchableOpacity>

          <View className="ml-4 flex-1">
            <Text className="text-lg font-semibold text-[#F5F8FF]">
              {categoryTitle}
            </Text>
            {steps.length ? (
              <View className="mt-2 flex-row items-center gap-2">
                {steps.map((_, index) => (
                  <View
                    key={index}
                    className="h-1 flex-1 rounded-full"
                    style={{
                      backgroundColor: index <= currentStep ? PROGRESS_ACTIVE : PROGRESS_INACTIVE,
                    }}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </View>

        {showDivider ? (
          <View className="mt-6 h-px bg-[rgba(61,96,143,0.35)]" />
        ) : null}

        {introTitle ? (
          <View className="mt-8">
            <Text className="text-2xl font-semibold text-[#F5F8FF]">
              {introTitle}
            </Text>
            {introDescription ? (
              <Text className="mt-2 text-base text-[#8EA1C1]">
                {introDescription}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View className={introTitle ? 'mt-6 flex-1' : 'mt-8 flex-1'}>{children}</View>

        {footer}
      </View>
    </View>
  );
}
