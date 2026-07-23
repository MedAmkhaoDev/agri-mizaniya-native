#!/bin/bash
# Run the app on a real device

case "${1:-ios}" in
  ios)
    echo "Running on iOS device..."
    npx expo run:ios --device
    ;;
  android)
    echo "Running on Android device..."
    npx expo run:android --device
    ;;
  ios-list)
    npx expo run:ios --device --list-devices
    ;;
  android-list)
    npx expo run:android --device --list-devices
    ;;
  *)
    echo "Usage: ./run-device.sh [ios|android|ios-list|android-list]"
    ;;
esac
