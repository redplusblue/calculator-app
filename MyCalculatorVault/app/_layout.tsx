// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
    return (
        <Stack>
            {/* Remove the top bar by setting headerShown to false */}
            <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
    );
}