import Constants from 'expo-constants';

export function getAppVersion(): string {
  return Constants.nativeApplicationVersion?.trim() || Constants.expoConfig?.version?.trim() || '1.0.0';
}

export function getAppVersionLabel(): string {
  return `Version ${getAppVersion()}`;
}