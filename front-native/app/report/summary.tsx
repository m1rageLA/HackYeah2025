import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

export default function ReportSummaryPlaceholder() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#02050C]">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-semibold text-[#F5F8FF]">
          Podsumowanie
        </Text>
        <Text className="mt-4 text-center text-base text-[#8EA1C1]">
          Placeholder: tutaj użytkownik zweryfikuje dane przed wysłaniem.
        </Text>
        <TouchableOpacity
          className="mt-10 rounded-2xl bg-[#1E5BFF] px-6 py-4"
          activeOpacity={0.9}
          onPress={() => router.replace('/')}
        >
          <Text className="text-base font-semibold text-white">
            Wyślij zgłoszenie
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
