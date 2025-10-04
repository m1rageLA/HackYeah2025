import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

const categories = ['Ludzie uzbrojeni', 'Wypadek', 'Awarie infrastruktury', 'Inne'];

export default function SelectCategoryScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#050B16]">
      <View className="flex-1 px-6 pt-12">
        <Text className="text-3xl font-bold text-[#F8FBFF]">Wybierz kategorię</Text>
        <Text className="mt-2 text-base text-[#B7C6D8]">
          Dopasuj zgłoszenie do odpowiedniej kategorii.
        </Text>

        <View className="mt-10 gap-4">
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              activeOpacity={0.9}
              className="rounded-2xl bg-[#0B1F3A] px-5 py-6"
              onPress={() => router.push('/report')}>
              <Text className="text-lg font-semibold text-[#EBF3FF]">{category}</Text>
              <Text className="mt-2 text-sm text-[#7D90A7]">
                Placeholder opis dla tej kategorii.
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
