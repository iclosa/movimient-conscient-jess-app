jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('expo-audio', () => ({ createAudioPlayer: jest.fn(() => ({ seekTo: jest.fn(), play: jest.fn(), remove: jest.fn() })) }));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));
