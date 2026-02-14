#!/bin/bash

# Xcode Cloud Pre-Xcodebuild Script
# This script runs before Xcode build starts

echo "🔨 Preparing for Xcode build..."

# Set up environment variables
export NODE_ENV=production
export EXPO_PUBLIC_APP_VERSION=1.1.2

# Ensure we're in the project directory
cd "$CI_WORKSPACE"

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate iOS project if it doesn't exist
if [ ! -d "ios" ]; then
    echo "🏗️ Generating iOS project..."
    npx expo prebuild --platform ios --non-interactive
fi

# Update bundle version and build number
echo "📱 Updating app version and build number..."
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString 1.1.2" ios/teacher-performance-app/Info.plist
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion 4" ios/teacher-performance-app/Info.plist

echo "✅ Pre-xcodebuild script completed successfully" 