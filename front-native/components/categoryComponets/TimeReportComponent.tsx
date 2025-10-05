import React, { useCallback, useMemo, useState } from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import {
  LayoutChangeEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

export const TIME_OPTIONS: TimeOption[] = [
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

const BUTTON_HEIGHT = 56;
const BUTTON_BOTTOM_INSET = 24;
const BUTTON_HORIZONTAL_INSET = 12;
const FADE_GAP = 12;
const DEFAULT_FADE_START = 0.7;
const FADE_LENGTH = 300;
const MASK_COLORS = ['rgba(0,0,0,1)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.0)'];

export default function TimeReportComponent({
  onContinue,
  initialValue = 'now',
}: Props) {
  const [selected, setSelected] = useState<TimeOptionValue>(initialValue);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  const { data, updateData } = useForm();

  const handleScrollViewLayout = useCallback((event: LayoutChangeEvent) => {
    setScrollViewHeight(event.nativeEvent.layout.height);
  }, []);

  const handleContentSizeChange = useCallback((_: number, height: number) => {
    setContentHeight(height);
  }, []);

  const handleContinue = useCallback(
    (time: TimeOptionValue) => {
      updateData({
        data: { ...(data.data || {}), time: time || null },
      });
      onContinue?.();
    },
    [data, updateData, onContinue],
  );

  const scrollBottomInset = BUTTON_HEIGHT + BUTTON_BOTTOM_INSET + FADE_GAP;
  const isOverflowing =
    contentHeight > scrollViewHeight && scrollViewHeight > 0;

  const fadeStartLocation = useMemo(() => {
    if (!isOverflowing || !scrollViewHeight) {
      return DEFAULT_FADE_START;
    }
    const fadeBottomOffset = BUTTON_BOTTOM_INSET + FADE_GAP;
    const available = scrollViewHeight - (fadeBottomOffset + FADE_LENGTH);
    if (available <= 0) {
      return DEFAULT_FADE_START;
    }
    const normalized = available / scrollViewHeight;
    if (!Number.isFinite(normalized)) {
      return DEFAULT_FADE_START;
    }
    const clamped = Math.min(0.92, Math.max(DEFAULT_FADE_START, normalized));
    return clamped;
  }, [isOverflowing, scrollViewHeight]);

  const maskLocations = useMemo(
    () => [0, fadeStartLocation, 1],
    [fadeStartLocation],
  );

  const webMaskStyle = useMemo<ViewStyle | undefined>(() => {
    if (!isOverflowing || Platform.OS !== 'web') {
      return undefined;
    }
    const fadeStartPercentage = Math.round(fadeStartLocation * 100);
    const gradient = `linear-gradient(to bottom, rgba(0,0,0,1) ${fadeStartPercentage}%, rgba(0,0,0,0) 100%)`;
    const style: ViewStyle = {};
    (style as any).maskImage = gradient;
    (style as any).WebkitMaskImage = gradient;
    return style;
  }, [fadeStartLocation, isOverflowing]);

  const renderScrollView = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: scrollBottomInset },
      ]}
      showsVerticalScrollIndicator={false}
      onLayout={handleScrollViewLayout}
      onContentSizeChange={handleContentSizeChange}
      keyboardShouldPersistTaps="handled"
    >
      <View className="">
        <Text className="text-2xl font-semibold text-[#F5F8FF]">
          Kiedy to się stało?
        </Text>
        <Text className="mt-2 text-base text-[#8EA1C1]">
          Opisz, ile czasu temu to się wydarzyło
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
    </ScrollView>
  );

  const renderScrollArea = () => {
    if (Platform.OS === 'web') {
      if (!isOverflowing) {
        return renderScrollView();
      }
      return (
        <View style={[styles.maskWrapper, webMaskStyle]}>
          {renderScrollView()}
        </View>
      );
    }

    if (!isOverflowing) {
      return renderScrollView();
    }

    return (
      <MaskedView
        style={styles.maskWrapper}
        maskElement={
          <LinearGradient
            colors={MASK_COLORS}
            locations={maskLocations}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.maskGradient}
          />
        }
      >
        {renderScrollView()}
      </MaskedView>
    );
  };

  return (
    <View className="flex-1 mt-10 px-3">
      <View
        className="relative flex-1 bg-transparent"
        style={styles.cardContainer}
      >
        {renderScrollArea()}
        <TouchableOpacity
          activeOpacity={0.88}
          className="absolute left-0 right-0 bottom-0 h-14 items-center justify-center rounded-2xl bg-[#1E5BFF]"
          onPress={() => trigger(() => handleContinue(selected))}
        >
          <Text className="text-base font-semibold text-white">Kontynuuj</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  maskWrapper: {
    flex: 1,
  },
  maskGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContainer: {
    overflow: 'hidden',
  },
});
