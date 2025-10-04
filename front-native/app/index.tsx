import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { cssInterop } from 'nativewind';
import React, { useEffect } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const GradientBackground = cssInterop(LinearGradient, {
  className: 'style',
});

export default function LoginScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/select-category');
  };

  const [isLogged, setIsLogged] = React.useState(false);

  useEffect(() => {
    if (!isLogged) {
      const timeout = setTimeout(() => {
        router.push('/login');
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isLogged, router]);

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
          Root Categories Choose screens
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}
