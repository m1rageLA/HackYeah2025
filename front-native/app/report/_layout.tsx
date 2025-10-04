import { Stack } from 'expo-router';


// Stack navigator for all report flow screens; keeps headers off for custom UI.
export default function ReportLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="details" />
      <Stack.Screen name="evidence" />
      <Stack.Screen name="summary" />
    </Stack>
  );
}
