// app/index.tsx
// This is the main entry point for your specific page in Expo Router.

import React from 'react';
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    useColorScheme,
    View,
    Platform, // Import Platform here as well for specific web styling
} from 'react-native';

import Calculator from '../components/Calculator'; // Correct path to components/Calculator.tsx

/**
 * The main page component for the calculator application.
 * It sets up the safe area view, status bar, and renders the Calculator component.
 * In Expo Router, this 'index.tsx' file represents the default route ('/').
 */
export default function App() {
    // Determine the current color scheme (light/dark) for status bar styling.
    const isDarkMode = useColorScheme() === 'dark';

    // Define background colors directly.
    const backgroundColors = {
        dark: 'black',  // Consistent with calculator's black background
        light: '#F2F2F7', // A light gray for iOS light mode feel
    };

    // Set the background style based on the color scheme.
    const backgroundStyle = {
        backgroundColor: isDarkMode ? backgroundColors.dark : backgroundColors.light,
        flex: 1, // Ensure the background fills the entire screen
    };

    return (
        <SafeAreaView style={[backgroundStyle, webSafeAreaStyle]}>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={backgroundStyle.backgroundColor}
            />
            <View style={[styles.container, webContainerStyle]}>
                <Calculator />
            </View>
        </SafeAreaView>
    );
}

// Styles for the App component
const styles = StyleSheet.create({
    container: {
        flex: 1, // Make the container fill the available space
        backgroundColor: 'black', // Set a dark background for the calculator area
    },
});

// Define web-specific styles separately
const webSafeAreaStyle = Platform.OS === 'web'
    ? {
        height: '100vh', // Use viewport height for web
    }
    : {};

// Apply conditional styles separately
const webContainerStyle = Platform.OS === 'web'
    ? {
        maxWidth: 450, // Max width for the calculator on web
        alignSelf: 'center', // Center the calculator horizontally
        width: '100%', // Take full width up to maxWidth
    }
    : {};