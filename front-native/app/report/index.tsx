import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { cssInterop } from 'nativewind';
import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const GradientBackground = cssInterop(LinearGradient, {
  className: 'style',
});

const steps = [1, 2, 3, 4];

export default function ReportLocationScreen() {
  const router = useRouter();

  return (
    <GradientBackground
      colors={['#051230', '#020713']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 pb-10">
          <View className="flex-row items-center justify-between pt-4">
            <TouchableOpacity
              accessibilityLabel="Powrót"
              className="h-10 w-10 items-center justify-center rounded-xl bg-[rgba(9,24,46,0.75)]"
              activeOpacity={0.85}
              onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#F3F7FF" />
            </TouchableOpacity>
            <View className="flex-1 pl-4">
              <Text className="text-xl font-semibold text-[#F5F8FF]">
                Ludzie uzbrojeni
              </Text>
              <View className="mt-2 flex-row items-center gap-2">
                {steps.map((step, index) => (
                  <View
                    key={step}
                    className={`h-1 flex-1 rounded-full ${index === 0 ? 'bg-[#3C8CFF]' : 'bg-[rgba(95,124,168,0.4)]'}`}
                  />
                ))}
              </View>
            </View>
          </View>

          <View className="mt-12 flex-1 items-stretch rounded-[28px] bg-[rgba(6,19,44,0.85)] px-6 py-10">
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
                onPress={() => router.push('/report/details')}>
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
                className="rounded-2xl bg-[rgba(13,32,61,0.9)] px-5 py-5"
                onPress={() => router.push('/report/details')}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-[rgba(61,96,143,0.35)]">
                      <MaterialCommunityIcons name="map-marker" size={22} color="#ACC7F7" />
                    </View>
                    <View>
                      <Text className="text-lg font-semibold text-[#E1EBFF]">
                        Inna lokalizacja
                      </Text>
                      <Text className="text-sm text-[#8EA1C1]">
                        wskaż adres ręcznie
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={28} color="#ACC7F7" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}
