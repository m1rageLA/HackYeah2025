import { Stack, useLocalSearchParams } from 'expo-router';
import 'react-native-reanimated';
import { FormProvider } from '../context/FormContext';

export default function ReportLayout() {
  const params = useLocalSearchParams();

  return (
    <FormProvider
      initialState={JSON.parse(params.initialState as string) || undefined}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="summary" />
      </Stack>
    </FormProvider>
  );
}
