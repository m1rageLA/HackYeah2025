import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { cssInterop } from 'nativewind';
import React from 'react';
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const StyledYourComponent = cssInterop(LinearGradient, {
  className: 'style',
});

export default function WelcomeScreen() {
  return (
    <LinearGradient
      colors={['#002861', '#050B16']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center gap-12 px-8">
          <View className="items-center gap-5">
            <View className="h-[120px] w-[120px] items-center justify-center rounded-[30px] bg-[rgba(24,48,96,0.7)]">
              <MaterialCommunityIcons
                name="shield-outline"
                size={56}
                color="#E7F1FF"
              />
            </View>
            <Text className="text-4xl font-bold text-[#F8FBFF]">CiviSafe</Text>
            <Text className="text-base text-[#C6D4E5]">
              Bezpieczne Raporty Obywatelskie
            </Text>
          </View>

          <View className="w-[90%] gap-[20px]">
            <TouchableOpacity
              activeOpacity={0.85}
              className="h-14 justify-center rounded-[18px] bg-[rgba(3,31,78,0.9)]"
            >
              <View className="flex-row items-center justify-center gap-3">
                <View className="h-[34px] w-[34px] items-center justify-center rounded-[8px] bg-[#D71920]">
                  <Image
                    source={require('../assets/images/mobywatel_icon.png')}
                    style={{ width: 28, height: 28, borderRadius: 6 }}
                  />
                </View>
                <Text className="text-lg font-semibold text-[#F5F8FF]">
                  mObywatel
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              className="h-14 justify-center rounded-[18px] bg-[#F0F3FA]"
            >
              <Text className="text-center text-lg font-semibold text-[#0F1C2E]">
                numer telefonu
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
