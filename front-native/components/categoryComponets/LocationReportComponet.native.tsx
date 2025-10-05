import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useForm } from '@/app/context/FormContext';

type LocationMode = 'nearby' | 'manual';

type Coordinate = {
  latitude: number;
  longitude: number;
};

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type MapPressEvent = {
  nativeEvent: {
    coordinate: Coordinate;
  };
};

type MapModule = typeof import('react-native-maps');

type Props = {
  onContinue?: () => void;
};

const DEFAULT_REGION: Region = {
  latitude: 52.2297,
  longitude: 21.0122,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

export default function LocationReportComponent({ onContinue }: Props) {
  const { updateData } = useForm();
  const [manualMode, setManualMode] = useState(false);
  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinate | null>(
    null,
  );
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const mapComponents = useMemo(() => {
    if (Platform.OS === 'web') {
      return null;
    }
    const maps = require('react-native-maps') as MapModule;
    return {
      MapView: maps.default,
      Marker: maps.Marker,
      provider: maps.PROVIDER_GOOGLE,
    };
  }, []);

  const MapViewComponent = mapComponents?.MapView;
  const MarkerComponent = mapComponents?.Marker;
  const provider = mapComponents?.provider;

  const manualButtonClasses = useMemo(() => {
    const base =
      'rounded-2xl px-5 py-5 border border-[rgba(61,96,143,0.45)] bg-[rgba(13,32,61,0.92)]';
    return manualMode ? `${base} border-[#3C8CFF] bg-[rgba(13,32,61,0.98)]` : base;
  }, [manualMode]);

  const handleNearbySelect = useCallback(() => {
    updateData((previous) => ({
      data: {
        ...(previous.data || {}),
        locationMode: 'nearby' as LocationMode,
        locationCoordinates: null,
      },
    }));
    onContinue?.();
  }, [onContinue, updateData]);

  const handleManualToggle = useCallback(() => {
    setManualMode(true);
  }, []);

  const handleMapPress = useCallback((event: MapPressEvent) => {
    const { coordinate } = event.nativeEvent;
    setSelectedCoordinate({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });
  }, []);

  const updateCoordinateFromInput = useCallback(
    (latitudeValue: string, longitudeValue: string) => {
      const latitude = parseFloat(latitudeValue.replace(',', '.'));
      const longitude = parseFloat(longitudeValue.replace(',', '.'));

      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        setSelectedCoordinate({ latitude, longitude });
        setInputError(null);
      } else {
        setSelectedCoordinate(null);
      }
    },
    [],
  );

  const handleLatitudeChange = useCallback(
    (value: string) => {
      setLatInput(value);
      if (!MapViewComponent) {
        updateCoordinateFromInput(value, lngInput);
      }
    },
    [MapViewComponent, lngInput, updateCoordinateFromInput],
  );

  const handleLongitudeChange = useCallback(
    (value: string) => {
      setLngInput(value);
      if (!MapViewComponent) {
        updateCoordinateFromInput(latInput, value);
      }
    },
    [MapViewComponent, latInput, updateCoordinateFromInput],
  );

  const handleManualConfirm = useCallback(() => {
    if (!MapViewComponent) {
      if (!selectedCoordinate) {
        setInputError('Wprowadź poprawne współrzędne.');
        return;
      }
    } else if (!selectedCoordinate) {
      return;
    }

    updateData((previous) => ({
      data: {
        ...(previous.data || {}),
        locationMode: 'manual' as LocationMode,
        locationCoordinates: selectedCoordinate,
      },
    }));
    onContinue?.();
  }, [MapViewComponent, onContinue, selectedCoordinate, updateData]);

  const handleManualCancel = useCallback(() => {
    setManualMode(false);
    setSelectedCoordinate(null);
    setLatInput('');
    setLngInput('');
    setInputError(null);
  }, []);

  const handleOpenExternalMap = useCallback(() => {
    Linking.openURL('https://www.google.com/maps');
  }, []);

  const coordinateLabel = useMemo<string | null>(() => {
    if (!selectedCoordinate) return null;
    return `${selectedCoordinate.latitude.toFixed(5)}, ${selectedCoordinate.longitude.toFixed(5)}`;
  }, [selectedCoordinate]);

  const isConfirmDisabled = !selectedCoordinate;

  return (
    <View className="flex-1 items-stretch px-3 mt-10">
      <View className="items-center gap-3">
        <MaterialCommunityIcons name="map-marker-radius" size={54} color="#7AA7FF" />
        <Text className="text-2xl font-semibold text-[#F5F8FF]">Lokalizacja</Text>
        <Text className="text-center text-sm text-[#9EB2D0]">
          Twoja aktualna lokalizacja została automatycznie wykryta.
        </Text>
      </View>

      <View className="mt-10 gap-4">
        <TouchableOpacity
          activeOpacity={0.9}
          className="rounded-2xl bg-[#1E5BFF] px-5 py-5"
          onPress={handleNearbySelect}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.12)]">
                <MaterialCommunityIcons name="target" size={24} color="#F8FBFF" />
              </View>
              <View>
                <Text className="text-lg font-semibold text-white">Obok mnie</Text>
                <Text className="text-sm text-[rgba(230,237,255,0.8)]">
                  użyj lokalizacji w pobliżu mnie
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={28} color="#F8FBFF" />
          </View>
        </TouchableOpacity>

        <Text className="text-center text-sm uppercase tracking-[0.2em] text-[#556688]">
          lub
        </Text>

        <TouchableOpacity
          activeOpacity={0.9}
          className={manualButtonClasses}
          onPress={handleManualToggle}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[rgba(61,96,143,0.35)]">
                <MaterialCommunityIcons name="map-marker" size={22} color="#ACC7F7" />
              </View>
              <View>
                <Text className="text-lg font-semibold text-[#E1EBFF]">
                  Wskaż na mapie
                </Text>
                <Text className="text-sm text-[#8EA1C1]">
                  dotknij mapy, aby wskazać miejsce
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="map-plus" size={26} color="#ACC7F7" />
          </View>
        </TouchableOpacity>
      </View>

      {manualMode ? (
        <View className="mt-8 rounded-3xl border border-[rgba(61,96,143,0.42)] bg-[rgba(10,26,52,0.78)] px-4 py-5">
          <Text className="text-lg font-semibold text-[#F5F8FF]">
            Dodaj punkt na mapie
          </Text>
          <Text className="mt-1 text-sm text-[#8EA1C1]">
            Dotknij mapy, aby zaznaczyć lokalizację zdarzenia. Możesz ją zmienić
            ponownie, klikając w inne miejsce.
          </Text>

          {MapViewComponent ? (
            <View style={styles.mapWrapper} className="mt-4">
              <MapViewComponent
                style={styles.map}
                initialRegion={DEFAULT_REGION}
                provider={provider}
                onPress={handleMapPress}
                showsUserLocation
                showsMyLocationButton
              >
                {selectedCoordinate && MarkerComponent ? (
                  <MarkerComponent coordinate={selectedCoordinate} />
                ) : null}
              </MapViewComponent>
            </View>
          ) : (
            <View className="mt-4 rounded-2xl border border-[rgba(99,134,182,0.38)] bg-[rgba(4,16,35,0.85)] px-4 py-6">
              <Text className="text-sm text-[#C5D8FF]">
                Ta przeglądarka nie obsługuje natywnej mapy. Otwórz Google Maps,
                wskaż miejsce i wklej współrzędne poniżej.
              </Text>
              <TouchableOpacity
                activeOpacity={0.88}
                className="mt-4 items-center justify-center rounded-2xl bg-[rgba(30,91,255,0.18)] px-4 py-3"
                onPress={handleOpenExternalMap}
              >
                <Text className="text-sm font-semibold text-[#92B5FF]">
                  Otwórz Google Maps
                </Text>
              </TouchableOpacity>
              <View className="mt-4 gap-3">
                <TextInput
                  value={latInput}
                  onChangeText={handleLatitudeChange}
                  className="h-12 rounded-2xl border border-[rgba(102,134,187,0.45)] bg-[rgba(7,19,39,0.85)] px-4 text-sm text-[#E1EBFF]"
                  placeholder="Szerokość geograficzna (np. 52.2297)"
                  placeholderTextColor="rgba(225,235,255,0.45)"
                  keyboardType="decimal-pad"
                />
                <TextInput
                  value={lngInput}
                  onChangeText={handleLongitudeChange}
                  className="h-12 rounded-2xl border border-[rgba(102,134,187,0.45)] bg-[rgba(7,19,39,0.85)] px-4 text-sm text-[#E1EBFF]"
                  placeholder="Długość geograficzna (np. 21.0122)"
                  placeholderTextColor="rgba(225,235,255,0.45)"
                  keyboardType="decimal-pad"
                />
              </View>
              {inputError ? (
                <Text className="mt-2 text-center text-xs text-[#FF9E7C]">
                  {inputError}
                </Text>
              ) : null}
            </View>
          )}

          {coordinateLabel ? (
            <Text className="mt-3 text-center text-xs text-[#9EB2D0]">
              Wybrane współrzędne: {coordinateLabel}
            </Text>
          ) : null}

          <View className="mt-5 gap-3">
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={isConfirmDisabled}
              className={`items-center justify-center rounded-2xl bg-[#1E5BFF] px-5 py-4 ${
                isConfirmDisabled ? 'opacity-50' : ''
              }`}
              onPress={handleManualConfirm}
            >
              <Text className="text-base font-semibold text-white">
                Potwierdź lokalizację
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              className="items-center justify-center rounded-2xl border border-[rgba(86,110,148,0.6)] bg-[rgba(8,19,39,0.9)] px-5 py-4"
              onPress={handleManualCancel}
            >
              <Text className="text-base font-semibold text-[#C5D8FF]">
                Anuluj
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: 260,
  },
});
