import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function DescriptionReportComponent({
  onContinue,
}: {
  onContinue?: () => void;
}) {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-2xl font-semibold text-[#F5F8FF]">
        Szczegóły zdarzenia
      </Text>
      <Text className="mt-4 text-center text-base text-[#8EA1C1]">
        Placeholder: tutaj użytkownik uzupełni informacje opisowe.
      </Text>
      <TouchableOpacity
        className="mt-10 rounded-2xl bg-[#1E5BFF] px-6 py-4"
        activeOpacity={0.9}
        onPress={() =>
          onContinue &&
          requestAnimationFrame(() => {
            onContinue();
          })
        }
      >
        <Text className="text-base font-semibold text-white">Dalej</Text>
      </TouchableOpacity>
    </View>
  );
}
