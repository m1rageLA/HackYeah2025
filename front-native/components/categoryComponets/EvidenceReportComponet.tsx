import React, { useCallback, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
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

export default function EvidenceReportComponet({ onContinue }: Props) {
  const [selectedAsset, setSelectedAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, updateData } = useForm();

  const trigger = (callback?: () => void) => {
    if (!callback) return;
    requestAnimationFrame(callback);
  };

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

  return (
    <View className="flex-1 bg-transparent px-4 py-6">
      <View className="mt-10">
        <Text className="text-2xl font-semibold text-[#F5F8FF]">
          Zdj\u0119cie
        </Text>
        <Text className="mt-2 text-base text-[#8EA1C1]">
          Dodaj zdj\u0119cie, je\u015bli jest dost\u0119pne.
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

      <TouchableOpacity
        activeOpacity={0.88}
        className="mt-8 h-14 items-center justify-center rounded-2xl bg-[#1E5BFF]"
        onPress={() => trigger(handleContinue)}
      >
        <Text className="text-base font-semibold text-white">Continue</Text>
      </TouchableOpacity>
    </View>
  );
}
