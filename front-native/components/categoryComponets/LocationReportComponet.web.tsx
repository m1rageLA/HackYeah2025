import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useForm } from '@/app/context/FormContext';

type LocationMode = 'nearby' | 'manual';

type Coordinate = { latitude: number; longitude: number };

type LeafletNamespace = typeof import('leaflet');

declare global {
  interface Window {
    L?: LeafletNamespace;
    __leafletLoader?: Promise<LeafletNamespace>;
  }
}

const FALLBACK_COORDINATE: Coordinate = {
  latitude: 52.2297,
  longitude: 21.0122,
};

async function loadLeaflet(): Promise<LeafletNamespace> {
  if (typeof window === 'undefined') {
    throw new Error('Leaflet can only load in browser context');
  }

  if (window.L) {
    return window.L;
  }
  if (window.__leafletLoader) {
    return window.__leafletLoader;
  }

  window.__leafletLoader = new Promise<LeafletNamespace>((resolve, reject) => {
    const leafletCssId = 'leaflet-css';
    if (!document.getElementById(leafletCssId)) {
      const link = document.createElement('link');
      link.id = leafletCssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.crossOrigin = '';
    script.onload = () => {
      if (window.L) {
        resolve(window.L);
      } else {
        reject(new Error('Leaflet failed to load.'));
      }
    };
    script.onerror = () => reject(new Error('Leaflet script failed to load.'));
    document.body.appendChild(script);
  });

  return window.__leafletLoader;
}

export default function LocationReportComponent({
  onContinue,
}: {
  onContinue?: () => void;
}) {
  const { updateData } = useForm();
  const [manualMode, setManualMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCoordinate, setSelectedCoordinate] =
    useState<Coordinate | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const initialiseMap = useCallback(async () => {
    if (!modalVisible || Platform.OS !== 'web') {
      return;
    }
    if (!mapContainerRef.current) {
      return;
    }

    try {
      const L = await loadLeaflet();
      setMapError(null);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const defaultPoint = selectedCoordinate || FALLBACK_COORDINATE;
      const map = L.map(mapContainerRef.current, {
        center: [defaultPoint.latitude, defaultPoint.longitude],
        zoom: 13,
      });
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const setMarker = (coords: Coordinate) => {
        const latLng: [number, number] = [coords.latitude, coords.longitude];
        if (markerRef.current) {
          markerRef.current.setLatLng(latLng);
        } else {
          markerRef.current = L.marker(latLng).addTo(map);
        }
      };

      if (selectedCoordinate) {
        setMarker(selectedCoordinate);
      }

      map.on('click', (event: any) => {
        const coords = {
          latitude: event.latlng.lat,
          longitude: event.latlng.lng,
        };
        setSelectedCoordinate(coords);
        setMarker(coords);
      });
    } catch (error) {
      console.error('Map initialisation failed', error);
      setMapError(
        'Nie udało się załadować mapy. Sprawdź połączenie internetowe.',
      );
    }
  }, [modalVisible, selectedCoordinate]);

  useEffect(() => {
    if (modalVisible) {
      initialiseMap();
    }
    return () => {
      if (!modalVisible && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [modalVisible, initialiseMap]);

  useEffect(() => {
    if (
      modalVisible &&
      mapInstanceRef.current &&
      selectedCoordinate &&
      Platform.OS === 'web'
    ) {
      const L = window.L;
      if (!L) return;
      const latLng: [number, number] = [
        selectedCoordinate.latitude,
        selectedCoordinate.longitude,
      ];
      if (markerRef.current) {
        markerRef.current.setLatLng(latLng);
      } else {
        markerRef.current = L.marker(latLng).addTo(mapInstanceRef.current);
      }
      mapInstanceRef.current.panTo(latLng);
    }
  }, [modalVisible, selectedCoordinate]);

  const handleNearbySelect = useCallback(async () => {
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
    } catch (error) {
      console.error('Failed to fetch GPS coordinates', error);
      Alert.alert('Błąd', 'Nie udało się pobrać lokalizacji GPS.');
    }
  }, [onContinue, updateData]);

  const handleManualSelect = useCallback(() => {
    setManualMode(true);
    setSelectedCoordinate((prev) => prev || FALLBACK_COORDINATE);
    setModalVisible(true);
  }, []);

  const handleConfirmManual = useCallback(() => {
    if (!selectedCoordinate) {
      return;
    }
    updateData((prev) => ({
      data: {
        ...(prev.data || {}),
        locationMode: 'manual',
        locationCoordinates: selectedCoordinate,
      },
    }));
    setModalVisible(false);
    onContinue?.();
  }, [onContinue, selectedCoordinate, updateData]);

  return (
    <View className="flex-1 items-stretch px-3 mt-10">
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

      <View className="mt-10 gap-4">
        <TouchableOpacity
          activeOpacity={0.9}
          className="rounded-2xl bg-[#1E5BFF] px-5 py-5"
          onPress={handleNearbySelect}
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

        <TouchableOpacity
          activeOpacity={0.9}
          className="rounded-2xl bg-[rgba(13,32,61,0.9)] px-5 py-5"
          onPress={handleManualSelect}
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

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View className="flex-1 justify-center items-center bg-[rgba(0,0,0,0.45)] px-3">
          <View className="w-full max-w-[640px] rounded-3xl bg-[#0C1B34] p-4 shadow-lg">
            <Text className="text-lg font-semibold text-[#F5F8FF] text-center">
              Dotknij mapy, aby wybrać lokalizację
            </Text>
            <Text className="mt-1 text-center text-xs text-[#8EA1C1]">
              {mapError
                ? mapError
                : 'Kliknij w punkt na mapie. Możesz przesuwać i przybliżać, aby ustawić dokładną lokalizację.'}
            </Text>

            <View
              ref={mapContainerRef}
              className="mt-4 h-[360px] w-full overflow-hidden rounded-2xl bg-[rgba(6,14,28,0.8)]"
            />

            {selectedCoordinate ? (
              <Text className="mt-3 text-center text-xs text-[#9EB2D0]">
                Wybrane: {selectedCoordinate.latitude.toFixed(5)},{' '}
                {selectedCoordinate.longitude.toFixed(5)}
              </Text>
            ) : null}

            <View className="mt-5 flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setMapError(null);
                }}
                className="rounded-xl px-5 py-3 bg-[rgba(255,255,255,0.08)]"
              >
                <Text className="text-[#E1EBFF]">Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.9}
                disabled={!selectedCoordinate || !!mapError}
                onPress={handleConfirmManual}
                className={`rounded-xl px-5 py-3 ${
                  selectedCoordinate && !mapError
                    ? 'bg-[#1E5BFF]'
                    : 'bg-[rgba(30,91,255,0.35)]'
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
