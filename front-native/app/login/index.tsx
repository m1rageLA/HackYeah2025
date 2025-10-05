import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { cssInterop } from 'nativewind';
import React, { use } from 'react';
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRootContext } from '../context/rootContext';

const GradientBackground = cssInterop(LinearGradient, {
  className: 'style',
});

export default function LoginScreen() {
  const router = useRouter();

  const { updateData } = useRootContext();

  const handleContinue = () => {
    updateData({ isLogged: true });
    router.push('/');
  };

  return (
    <GradientBackground
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
            <Text className="text-base text-[#C6D4E5] text-center">
              Bezpieczne Raporty Obywatelskie
            </Text>
          </View>

          <View className="w-full gap-4">
            <TouchableOpacity
              activeOpacity={0.85}
              className="h-14 justify-center rounded-[18px] bg-[rgba(3,31,78,0.9)]"
              onPress={handleContinue}
            >
              <View className="flex-row items-center justify-center gap-3">
                <View className="flex-row items-center justify-center gap-3">
                  <Image
                    source={require('./mobywatel_icon.png')}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      resizeMode: 'cover',
                    }}
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
              onPress={handleContinue}
            >
              <Text className="text-center text-lg font-semibold text-[#0F1C2E]">
                numer telefonu
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}
