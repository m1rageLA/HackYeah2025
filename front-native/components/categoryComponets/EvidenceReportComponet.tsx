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
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useForm } from '@/app/context/FormContext';

interface Props {
  onContinue?: () => void;
}

const WARNING_TEXT =
  'Za\u0142\u0105cz zdj\u0119cie tylko wtedy, gdy masz pewno\u015b\u0107, \u017ce jest to bezpieczne.';
const ADD_PHOTO_PLACEHOLDER = 'Dodaj zdj\u0119cie (opcjonalnie)';
const PERMISSION_WARNING =
  'Nadaj aplikacji uprawnienia do dost\u0119pu do galerii, aby kontynuowa\u0107.';
const PICK_ERROR =
  'Nie uda\u0142o si\u0119 wczyta\u0107 zdj\u0119cia. Spr\u00f3buj ponownie.';

const BUTTON_HEIGHT = 56;
const BUTTON_BOTTOM_INSET = 24;
const FADE_GAP = 12;
// const FADE_LENGTH = 30;
const DEFAULT_FADE_START = 0.7;
const FADE_LENGTH = 300;
const MASK_COLORS = ['rgba(0,0,0,1)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.0)'];

export default function EvidenceReportComponet({ onContinue }: Props) {
  const [selectedAsset, setSelectedAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  const { data, updateData } = useForm();

  const trigger = (callback?: () => void) => {
    if (!callback) return;
    requestAnimationFrame(callback);
  };

  const handleScrollViewLayout = useCallback((event: LayoutChangeEvent) => {
    setScrollViewHeight(event.nativeEvent.layout.height);
  }, []);

  const handleContentSizeChange = useCallback((_: number, height: number) => {
    setContentHeight(height);
  }, []);

  const handlePickImage = useCallback(async () => {
    try {
      setIsPicking(true);
      setErrorMessage(null);

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setErrorMessage(PERMISSION_WARNING);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const [asset] = result.assets;
      setSelectedAsset(asset);
    } catch (error) {
      console.warn('Failed to pick image', error);
      setErrorMessage(PICK_ERROR);
    } finally {
      setIsPicking(false);
    }
  }, []);

  const handleContinue = useCallback(() => {
    updateData({
      data: { ...(data.data || {}), evidence: selectedAsset || null },
    });
    onContinue?.();
  }, [data, onContinue, selectedAsset, updateData]);

  const primaryLabel = useMemo(() => {
    if (selectedAsset?.fileName) {
      return selectedAsset.fileName;
    }
    if (selectedAsset) {
      return 'Wybrano zdj\u0119cie';
    }
    return ADD_PHOTO_PLACEHOLDER;
  }, [selectedAsset]);

  const secondaryLabel = useMemo(() => {
    if (selectedAsset) {
      return 'Kliknij, aby wybra\u0107 inne zdj\u0119cie.';
    }
    return 'Obs\u0142ugiwane s\u0105 wy\u0142\u0105cznie pliki graficzne.';
  }, [selectedAsset]);

  const scrollBottomInset = BUTTON_HEIGHT + BUTTON_BOTTOM_INSET + FADE_GAP;
  const isOverflowing =
    contentHeight > scrollViewHeight && scrollViewHeight > 0;

  const fadeStartLocation = useMemo(() => {
    if (!isOverflowing || !scrollViewHeight) {
      return DEFAULT_FADE_START;
    }
    const fadeBottomOffset = BUTTON_HEIGHT + BUTTON_BOTTOM_INSET + FADE_GAP;
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
          PlaceHolder Title
        </Text>
        <Text className="mt-2 text-base text-[#8EA1C1]">
          PlaceHolder SubTitle
        </Text>
      </View>

      <View className="mt-6 rounded-2xl border border-[#A87B2A] bg-[rgba(255,193,77,0.12)] px-4 py-4">
        <View className="flex-row items-start gap-3">
          <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-xl bg-[rgba(255,208,113,0.16)]">
            <MaterialCommunityIcons
              name="alert-outline"
              size={22}
              color="#FBD18B"
            />
          </View>
          <Text className="flex-1 text-sm leading-5 text-[#FBD18B]">
            <Text className="font-semibold text-[#FFD271]">Uwaga: </Text>
            {WARNING_TEXT}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        className="mt-6 w-full items-center justify-center rounded-3xl border-2 border-dashed border-[#315CFF] bg-[rgba(10,26,58,0.65)] px-6 py-6"
        onPress={handlePickImage}
        disabled={isPicking}
      >
        {selectedAsset ? (
          <View className="w-full items-center">
            <Image
              source={{ uri: selectedAsset.uri }}
              className="w-full aspect-[3/2] rounded-2xl"
              contentFit="cover"
            />
          </View>
        ) : (
          <MaterialCommunityIcons
            name="camera-outline"
            size={30}
            color="#A8C5FF"
          />
        )}

        <Text className="mt-3 text-sm font-semibold text-[#C5D8FF]">
          {primaryLabel}
        </Text>
        <Text className="mt-1 text-xs text-[#8EA1C1]">{secondaryLabel}</Text>
      </TouchableOpacity>

      {errorMessage ? (
        <Text className="mt-3 text-center text-xs text-[#FF9E7C]">
          {errorMessage}
        </Text>
      ) : null}
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
    <View className="flex-1 bg-transparent px-3 mt-10">
      <View className="relative flex-1 bg-transparent">
        {renderScrollArea()}
        <TouchableOpacity
          activeOpacity={0.88}
          className="absolute left-0 right-0 bottom-0 h-14 items-center justify-center rounded-2xl bg-[#1E5BFF]"
          onPress={() => trigger(handleContinue)}
        >
          <Text className="text-base font-semibold text-white">Continue</Text>
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
    paddingTop: 0,
  },
  maskWrapper: {
    flex: 1,
  },
  maskGradient: {
    ...StyleSheet.absoluteFillObject,
  },
});
