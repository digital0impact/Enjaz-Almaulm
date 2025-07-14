module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // دعم reanimated
      'react-native-reanimated/plugin',
      // دعم مسارات الاستيراد المختصرة
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': '.',
          },
        },
      ],
    ],
  };
}; 