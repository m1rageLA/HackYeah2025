import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useForm } from '@/app/context/FormContext';

type TimeOptionValue =
  | 'now'
  | 'fiveToTenMinutes'
  | 'thirtyMinutes'
  | 'overHour';

interface TimeOption {
  value: TimeOptionValue;
  label: string;
  containerClass: string;
  iconTint: string;
  iconBackground: string;
  textColor?: string;
}

interface Props {
  onContinue?: () => void;
  initialValue?: TimeOptionValue;
}

const FADE_START_FRACTION = 0.55;
const FADE_SOFT_FRACTION = 0.82;
const CARD_GRADIENT_COLORS = [
  'rgba(12, 27, 57, 0.9)',
  'rgba(12, 27, 57, 0.9)',
  'rgba(12, 27, 57, 0.38)',
  'rgba(12, 27, 57, 0)',
];
const CARD_GRADIENT_LOCATIONS = [0, FADE_START_FRACTION, FADE_SOFT_FRACTION, 1];

const TIME_OPTIONS: TimeOption[] = [
  {
    value: 'now',
    label: 'Teraz',
    containerClass: 'border-[#632A36] bg-[rgba(108,35,48,0.95)]',
    iconTint: '#FF9A9A',
    iconBackground: 'bg-[rgba(255,154,154,0.18)]',
    textColor: '#FFE2E2',
  },
  {
    value: 'fiveToTenMinutes',
    label: '5-10 minut temu',
    containerClass: 'border-[#B8862F] bg-[rgba(63,35,22,0.92)]',
    iconTint: '#F8C876',
    iconBackground: 'bg-[rgba(243,188,113,0.16)]',
    textColor: '#FFE3B4',
  },
  {
    value: 'thirtyMinutes',
    label: '30 minut temu',
    containerClass: 'border-[#394A7D] bg-[rgba(26,40,74,0.92)]',
    iconTint: '#A8C1FF',
    iconBackground: 'bg-[rgba(120,150,220,0.18)]',
  },
  {
    value: 'overHour',
    label: 'ponad godzin\u0119 temu',
    containerClass: 'border-[#2C3D66] bg-[rgba(13,27,54,0.92)]',
    iconTint: '#7E9BDA',
    iconBackground: 'bg-[rgba(109,134,187,0.18)]',
  },
];

const trigger = (callback?: () => void) => {
  if (!callback) return;
  requestAnimationFrame(callback);
};

export default function ArmedPeopleTimeComponent({
  onContinue,
  initialValue = 'now',
}: Props) {
  const [selected, setSelected] = useState<TimeOptionValue>(initialValue);

  const { data, updateData } = useForm();

  const handleContinue = useCallback(
    (time: TimeOptionValue) => {
      updateData({
        data: { ...(data.data || {}), time: time || null },
      });
      onContinue?.();
    },
    [data, updateData, onContinue],
  );

  return (
    <View className="flex-1 px-5 py-6">
      <View className="relative flex-1 overflow-hidden rounded-[36px] border border-[rgba(46,74,120,0.45)]">
        <LinearGradient
          pointerEvents="none"
          colors={CARD_GRADIENT_COLORS}
          locations={CARD_GRADIENT_LOCATIONS}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradientBackground}
        />

        <View className="flex-1 px-5 py-6">
          <View className="mt-10">
            <Text className="text-2xl font-semibold text-[#F5F8FF]">
              Kiedy to si\u0119 sta\u0142o?
            </Text>
            <Text className="mt-2 text-base text-[#8EA1C1]">
              Dodaj zdj\u0119cie, je\u015bli jest dost\u0119pne
            </Text>
          </View>

          <View className="mt-8 gap-4">
            {TIME_OPTIONS.map(
              ({
                iconBackground,
                iconTint,
                label,
                value,
                containerClass,
                textColor,
              }) => {
                const isSelected = selected === value;

                return (
                  <TouchableOpacity
                    key={value}
                    activeOpacity={0.88}
                    className={`flex-row items-center justify-between rounded-2xl border px-5 py-4 ${containerClass} ${
                      isSelected ? 'opacity-100' : 'opacity-90'
                    }`}
                    onPress={() => setSelected(value)}
                  >
                    <View className="flex-row items-center gap-4">
                      <View
                        className={`h-10 w-10 items-center justify-center rounded-xl ${iconBackground}`}
                      >
                        <MaterialCommunityIcons
                          name="alert-outline"
                          size={22}
                          color={iconTint}
                        />
                      </View>
                      <Text
                        className="text-base font-semibold text-[#E7EEFF]"
                        style={textColor ? { color: textColor } : undefined}
                      >
                        {label}
                      </Text>
                    </View>

                    {isSelected ? (
                      <MaterialCommunityIcons
                        name="checkbox-marked-circle"
                        size={24}
                        color="#FFFFFF"
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name="checkbox-blank-circle-outline"
                        size={24}
                        color="#8EA1C1"
                      />
                    )}
                  </TouchableOpacity>
                );
              },
            )}
          </View>

          <View className="mt-auto pt-10">
            <TouchableOpacity
              activeOpacity={0.88}
              className="h-14 items-center justify-center rounded-2xl bg-[#1E5BFF]"
              onPress={() => trigger(() => handleContinue(selected))}
            >
              <Text className="text-base font-semibold text-white">Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
});
