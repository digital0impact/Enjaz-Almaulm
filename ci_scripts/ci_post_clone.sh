#!/bin/bash

# Xcode Cloud Post-Clone Script
# This script runs after the repository is cloned

echo "🚀 Starting Xcode Cloud build for Enjaz Al-Mualim"

# Set environment variables
export NODE_ENV=production
export EXPO_PUBLIC_APP_VERSION=1.1.2

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Install Expo CLI globally
echo "🔧 Installing Expo CLI..."
npm install -g @expo/cli

# Install EAS CLI
echo "🔧 Installing EAS CLI..."
npm install -g eas-cli

# Configure EAS
echo "⚙️ Configuring EAS..."
eas build:configure --platform ios --non-interactive

# Prebuild the project
echo "🏗️ Prebuilding iOS project..."
npx expo prebuild --platform ios --non-interactive

echo "✅ Post-clone script completed successfully" 