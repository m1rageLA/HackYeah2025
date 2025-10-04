import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { cssInterop } from 'nativewind';
import React, { useEffect } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRootContext } from './context/rootContext';
import LoadingIndicator from '@/components/LoadingIndicator';
import { FormData } from './context/FormContext';

const GradientBackground = cssInterop(LinearGradient, {
  className: 'style',
});

export const LOCATION_COMPONENT = 'location_comp';
export const EVIDENCE_COMPONENT = 'evidence_comp';
export const DESCRIPTION_COMPONENT = 'description_comp';

export const ARMED_SOLIDERS = 'armed_soldiers';

const categoryReportMap: Record<string, FormData> = {
  [ARMED_SOLIDERS]: {
    data: {},
    componentsIdentifiers: [
      LOCATION_COMPONENT,
      LOCATION_COMPONENT,
      EVIDENCE_COMPONENT,
    ],
    componentIndex: 0,
  },
};

export default function MainScreen() {
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  const categories = [
    'Ludzie uzbrojeni',
    'Wypadek',
    'Awarie infrastruktury',
    'Inne',
  ];

  const handleContinue = () => {
    router.push('/select-category');
  };

  const { data } = useRootContext();

  useEffect(() => {
    console.log('isLogged', data);
    if (!data.isLogged) {
      const timeout = setTimeout(() => {
        router.push('/login');
      }, 2000);
      return () => clearTimeout(timeout);
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#050B16]">
      <GradientBackground
        colors={['#011636', '#050B16']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        {isLoading ? (
          <LoadingIndicator />
        ) : (
          <View className="flex-1 px-6 pt-12">
            <Text className="text-3xl font-bold text-[#F8FBFF]">
              Wybierz kategorię
            </Text>
            <Text className="mt-2 text-base text-[#B7C6D8]">
              Dopasuj zgłoszenie do odpowiedniej kategorii.
            </Text>

            <View className="mt-10 gap-4">
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  activeOpacity={0.9}
                  className="rounded-2xl bg-[#0B1F3A] px-5 py-6"
                  onPress={() =>
                    router.push({
                      pathname: '/report',
                      params: {
                        initialState: JSON.stringify(
                          categoryReportMap[ARMED_SOLIDERS],
                        ),
                      },
                    })
                  }
                >
                  <Text className="text-lg font-semibold text-[#EBF3FF]">
                    {category}
                  </Text>
                  <Text className="mt-2 text-sm text-[#7D90A7]">
                    Placeholder opis dla tej kategorii.
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </GradientBackground>
    </SafeAreaView>
  );
}
