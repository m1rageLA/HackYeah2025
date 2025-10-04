import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export default function LoadingIndicator() {
  return (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color="#bbbbbb" />
      <Text className="mt-4 text-white font-bold">Ładowanie...</Text>
    </View>
  );
}
