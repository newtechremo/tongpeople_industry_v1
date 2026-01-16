import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {MainStackParamList} from '@/types/navigation';
import {colors} from '@/constants/colors';

import {HomeScreen} from '@/screens/main';

const Stack = createNativeStackNavigator<MainStackParamList>();

const MainStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerTintColor: colors.textPrimary,
        headerStyle: {
          backgroundColor: colors.background,
        },
      }}>
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
};

export default MainStack;
