import React from 'react';
import { View, Button } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigationTypes';

const SatisfactionButton: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
    <View>
      <Button title="ให้คะแนน" onPress={()=>navigation.navigate('Satisfaction')} />
    </View>
  );
};

export default SatisfactionButton;
