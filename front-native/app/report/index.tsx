import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { cssInterop } from 'nativewind';
import React, { useCallback, useEffect } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useForm } from '../context/FormContext';
import {
  DESCRIPTION_COMPONENT,
  EVIDENCE_COMPONENT,
  LOCATION_COMPONENT,
  TIME_COMPONENT,
} from '../index';
import LocationReportComponet from '@/components/categoryComponets/LocationReportComponet';
import EvidenceReportComponent from '@/components/categoryComponets/EvidenceReportComponet';
import DescriptionReportComponent from '@/components/categoryComponets/DescriptionReportComponent';
import TimeReportComponent from '@/components/categoryComponets/TimeReportComponent';

const GradientBackground = cssInterop(LinearGradient, {
  className: 'style',
});

const steps = [1, 2, 3, 4];

export default function ReportLocationScreen() {
  const router = useRouter();

  const { data, updateData } = useForm();
  const handleContinue = useCallback(() => {
    if (data.componentIndex >= data.componentsIdentifiers.length - 1) {
      router.push('/report/summary');
      return;
    }
    updateData((previous) => ({ componentIndex: previous.componentIndex + 1 }));
    // router.push('/report');
  }, [data, router, updateData]);
  const getComponetsReportMap = useCallback((): Record<
    string,
    React.JSX.Element
  > => {
    return {
      [LOCATION_COMPONENT]: (
        <LocationReportComponet onContinue={handleContinue} />
      ),
      [EVIDENCE_COMPONENT]: (
        <EvidenceReportComponent onContinue={handleContinue} />
      ),
      [DESCRIPTION_COMPONENT]: (
        <DescriptionReportComponent onContinue={handleContinue} />
      ),
      [TIME_COMPONENT]: <TimeReportComponent onContinue={handleContinue} />,
    };
  }, [handleContinue]);

  useEffect(() => {
    console.log('data', data);
  }, [data]);

  return (
    <GradientBackground
      colors={['#051230', '#020713']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-5 py-6">
          <View className="rounded-xl border border-[rgba(61,96,143,0.28)] bg-[rgba(6,19,44,0.95)] px-3 py-4 flex-row items-center">
            <TouchableOpacity
              activeOpacity={0.85}
              className="h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(122,167,255,0.25)] bg-[rgba(13,30,64,0.7)]"
              onPress={() => {
                if (data.componentIndex === 0) {
                  router.back();
                } else {
                  updateData((previous) => ({
                    componentIndex: previous.componentIndex - 1,
                  }));
                }
              }}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color="#F5F8FF"
              />
            </TouchableOpacity>

            <View className="ml-4 flex-1">
              <Text className="text-lg font-semibold text-[#F5F8FF]">
                {data.category}
              </Text>
              <View className="mt-2 flex-row items-center gap-2">
                {data.componentsIdentifiers.map((indentifier, index) => (
                  <View
                    key={index}
                    className={`h-1 flex-1 rounded-full ${
                      index <= data.componentIndex
                        ? 'bg-[#3C8CFF]'
                        : 'bg-[rgba(95,124,168,0.4)]'
                    }`}
                  />
                ))}
              </View>
            </View>
          </View>
          {
            getComponetsReportMap()[
              data.componentsIdentifiers[data.componentIndex]
            ]
          }
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}
