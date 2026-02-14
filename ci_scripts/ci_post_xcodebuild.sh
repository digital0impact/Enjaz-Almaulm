#!/bin/bash

# Xcode Cloud Post-Xcodebuild Script
# This script runs after Xcode build completes

echo "🎉 Xcode build completed successfully!"

# Set up environment variables
export NODE_ENV=production
export EXPO_PUBLIC_APP_VERSION=1.1.2

# Ensure we're in the project directory
cd "$CI_WORKSPACE"

# Check if build was successful
if [ "$CI_XCODEBUILD_RESULT" = "0" ]; then
    echo "✅ Build completed successfully"
    
    # Optional: Upload to TestFlight or App Store
    if [ "$CI_XCODEBUILD_ACTION" = "archive" ]; then
        echo "📱 Preparing for App Store submission..."
        
        # You can add additional post-build steps here
        # For example, uploading to TestFlight or App Store Connect
        
        echo "🚀 App is ready for distribution!"
    fi
else
    echo "❌ Build failed with exit code: $CI_XCODEBUILD_RESULT"
    exit 1
fi

echo "✅ Post-xcodebuild script completed successfully" 