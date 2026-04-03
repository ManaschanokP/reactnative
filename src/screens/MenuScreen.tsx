import React from 'react';
import { Alert, View, Text, TouchableOpacity, Image, StyleSheet, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigationTypes';

import LogoutButton from '../components/LogoutButton';
import SatisfactionButton from '../components/SatisfactionButton';
import GradientButton from '../components/GradientButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Menu'>;
const MenuScreen: React.FC<Props> = ({ navigation }) => {

  const handlePress = () => {
    Alert.alert('คุณกดปุ่ม Driver แล้ว!');
  };

  const handlePress2 = () => {
    Alert.alert('คุณกดปุ่ม Messenger แล้ว!');
  };

  return (
    <View style={styles.container}>
      <GradientButton onPress={handlePress} text={'Driver'} />
      <GradientButton onPress={handlePress2} text={'Messenger'} />
      {/* <TouchableOpacity style={styles.button}>
        <Image source={require('../../assets/box_002.png')} style={styles.buttonImage} resizeMode="contain" />
        <Text style={styles.buttonText}>Driver</Text>
      </TouchableOpacity> */}

      {/* <TouchableOpacity style={styles.button}>
        <Image source={require('../../assets/box_001.png')} style={styles.buttonImage} resizeMode="contain" />
        <Text style={styles.buttonText}>Messenger</Text>
      </TouchableOpacity> */}

      {/* <TouchableOpacity >
        <LogoutButton />
      </TouchableOpacity>
      <TouchableOpacity >
        <SatisfactionButton />
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red',
    //gap: 60,
    // },
    // button: {
    //   width: 300,
    //   height: 150,
    //   marginTop: 100,
    //   alignItems: 'center',
    //   justifyContent: 'center',
    // },
    // buttonImage: {
    //   width: 100,
    //   height: 100,
    //   marginBottom: 10,
    // },
    // buttonText: {
    //   fontSize: 30,
    //   fontWeight: 'bold',
    //   paddingTop: 10,
  },
});

export default MenuScreen;
