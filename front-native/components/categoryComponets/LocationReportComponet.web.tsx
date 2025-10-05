import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useForm } from '@/app/context/FormContext';

type LocationMode = 'nearby' | 'manual';

interface Props {
  onContinue?: () => void;
}

type Coordinate = { latitude: number; longitude: number };

export default function LocationReportComponent({ onContinue }: Props) {
  const { updateData } = useForm();
  const [mode, setMode] = useState<LocationMode | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCoordinate, setSelectedCoordinate] =
    useState<Coordinate | null>(null);
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');

  // ✅ Handle nearby (GPS) mode
  const handleLocationUpdate = useCallback(
    async (mode: LocationMode) => {
      setMode(mode);

      if (mode === 'nearby') {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Błąd', 'Brak dostępu do lokalizacji.');
            return;
          }
          const location = await Location.getCurrentPositionAsync({});
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          updateData((prev) => ({
            data: {
              ...(prev.data || {}),
              locationMode: 'nearby',
              locationCoordinates: coords,
            },
          }));
          onContinue?.();
        } catch (err) {
          console.error(err);
          Alert.alert('Błąd', 'Nie udało się pobrać lokalizacji GPS.');
        }
      }

      if (mode === 'manual') {
        setModalVisible(true);
      }
    },
    [onContinue, updateData],
  );

  // ✅ Manual confirmation
  const handleConfirmManual = useCallback(() => {
    if (!selectedCoordinate) return;
    updateData((prev) => ({
      data: {
        ...(prev.data || {}),
        locationMode: 'manual',
        locationCoordinates: selectedCoordinate,
      },
    }));
    setModalVisible(false);
    onContinue?.();
  }, [selectedCoordinate, updateData, onContinue]);

  // ✅ Update coordinate when inputs change (for web)
  useEffect(() => {
    const lat = parseFloat(latInput.replace(',', '.'));
    const lng = parseFloat(lngInput.replace(',', '.'));
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setSelectedCoordinate({ latitude: lat, longitude: lng });
    } else {
      setSelectedCoordinate(null);
    }
  }, [latInput, lngInput]);

  return (
    <View className="flex-1 items-stretch px-3 mt-10">
      {/* Header */}
      <View className="items-center gap-3">
        <MaterialCommunityIcons
          name="map-marker-radius"
          size={54}
          color="#7AA7FF"
        />
        <Text className="text-2xl font-semibold text-[#F5F8FF]">
          Lokalizacja
        </Text>
        <Text className="text-center text-sm text-[#9EB2D0]">
          Wybierz sposób określenia lokalizacji.
        </Text>
      </View>

      {/* Options */}
      <View className="mt-10 gap-4">
        {/* Nearby */}
        <TouchableOpacity
          activeOpacity={0.9}
          className="rounded-2xl bg-[#1E5BFF] px-5 py-5"
          onPress={() => handleLocationUpdate('nearby')}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.12)]">
                <MaterialCommunityIcons
                  name="target"
                  size={24}
                  color="#F8FBFF"
                />
              </View>
              <View>
                <Text className="text-lg font-semibold text-white">
                  Obok mnie
                </Text>
                <Text className="text-sm text-[rgba(230,237,255,0.8)]">
                  Użyj mojej bieżącej lokalizacji
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={28}
              color="#F8FBFF"
            />
          </View>
        </TouchableOpacity>

        <Text className="text-center text-sm uppercase tracking-[0.2em] text-[#556688]">
          lub
        </Text>

        {/* Manual */}
        <TouchableOpacity
          activeOpacity={0.9}
          className="rounded-2xl bg-[rgba(13,32,61,0.9)] px-5 py-5"
          onPress={() => handleLocationUpdate('manual')}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[rgba(61,96,143,0.35)]">
                <MaterialCommunityIcons
                  name="map-marker"
                  size={22}
                  color="#ACC7F7"
                />
              </View>
              <View>
                <Text className="text-lg font-semibold text-[#E1EBFF]">
                  Inna lokalizacja
                </Text>
                <Text className="text-sm text-[#8EA1C1]">
                  Wskaż punkt na mapie
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={28}
              color="#ACC7F7"
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* ✅ Map modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-center items-center bg-[rgba(0,0,0,0.5)] px-3">
          <View className="w-full max-w-[600px] rounded-3xl bg-[#0C1B34] p-4">
            <Text className="text-lg font-semibold text-[#F5F8FF] text-center mb-3">
              Wybierz lokalizację
            </Text>

            {Platform.OS === 'web' ? (
              <>
                <iframe
                  src={`https://www.google.com/maps?q=${
                    selectedCoordinate?.latitude || 52.2297
                  },${
                    selectedCoordinate?.longitude || 21.0122
                  }&z=12&output=embed`}
                  width="100%"
                  height="300"
                  style={{ border: 0, borderRadius: 16 }}
                  loading="lazy"
                />
                <View className="mt-4 gap-3">
                  <TextInput
                    value={latInput}
                    onChangeText={setLatInput}
                    className="h-10 rounded-xl border border-[rgba(61,96,143,0.4)] bg-[rgba(8,22,44,0.9)] px-3 text-sm text-[#E1EBFF]"
                    placeholder="Szerokość geograficzna"
                    placeholderTextColor="rgba(225,235,255,0.45)"
                  />
                  <TextInput
                    value={lngInput}
                    onChangeText={setLngInput}
                    className="h-10 rounded-xl border border-[rgba(61,96,143,0.4)] bg-[rgba(8,22,44,0.9)] px-3 text-sm text-[#E1EBFF]"
                    placeholder="Długość geograficzna"
                    placeholderTextColor="rgba(225,235,255,0.45)"
                  />
                </View>
              </>
            ) : (
              // ✅ Native map picker
              <View className="h-[300px] w-full rounded-2xl overflow-hidden bg-black">
                {/** You can use react-native-maps here */}
              </View>
            )}

            {selectedCoordinate && (
              <Text className="mt-3 text-center text-xs text-[#9EB2D0]">
                Wybrane: {selectedCoordinate.latitude.toFixed(5)},{' '}
                {selectedCoordinate.longitude.toFixed(5)}
              </Text>
            )}

            <View className="flex-row justify-end mt-5 gap-3">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="rounded-xl px-5 py-3 bg-[rgba(255,255,255,0.1)]"
              >
                <Text className="text-[#E1EBFF]">Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!selectedCoordinate}
                onPress={handleConfirmManual}
                className={`rounded-xl px-5 py-3 ${
                  selectedCoordinate
                    ? 'bg-[#1E5BFF]'
                    : 'bg-[rgba(30,91,255,0.3)]'
                }`}
              >
                <Text className="text-white font-semibold">Zatwierdź</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
