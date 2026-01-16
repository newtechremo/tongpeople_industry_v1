import React from 'react';
import {StatusBar} from 'react-native';
import {RecoilRoot} from 'recoil';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import {RootNavigator} from './src/navigation';
import {colors} from './src/constants/colors';

const App: React.FC = () => {
  return (
    <RecoilRoot>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{flex: 1}}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={colors.background}
          />
          <RootNavigator />
          <Toast />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </RecoilRoot>
  );
};

export default App;
