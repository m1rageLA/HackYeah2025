import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

export default function ReportEvidencePlaceholder() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#030915]">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-semibold text-[#F5F8FF]">
          Materiały dowodowe
        </Text>
        <Text className="mt-4 text-center text-base text-[#8EA1C1]">
          Placeholder: tutaj pojawi się możliwość dodania zdjęć, filmów lub audio.
        </Text>
        <TouchableOpacity
          className="mt-10 rounded-2xl bg-[#1E5BFF] px-6 py-4"
          activeOpacity={0.9}
          onPress={() => router.push('/report/summary')}>
          <Text className="text-base font-semibold text-white">Przejdź do podsumowania</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
