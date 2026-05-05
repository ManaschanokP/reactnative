import React, {useContext} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigationTypes';
import {AuthContext} from '../context/AuthProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const {user} = useContext(AuthContext)!;
  console.log('User Home Screen:', user);
  console.log('User Status Home Screen:', user?.status);

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={[
            styles.button,
            {backgroundColor: user?.status === 'U03' ? '#a7cc43' : '#f8ac59'},
          ]}
          onPress={() => {
            console.log('Scan QR-Code Pressed');
            navigation.navigate('Scan'); //ไปหน้าสแกน
          }}>
          <Text style={styles.buttonText}>Scan QR-Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            {backgroundColor: user?.status === 'U03' ? '#a7cc43' : '#f8ac59'},
          ]}
          onPress={() => {
            console.log('น้ำมัน Pressed');
            navigation.navigate('FuelEntry');
          }}>
          <Text style={styles.buttonText}>น้ำมัน</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  button: {
    //backgroundColor: user.status === '04' ? '#a7cc43' : '#f8ac59',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    width: '40%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#a7cc43',
    padding: 10,
    justifyContent: 'space-around',
  },
  navButton: {
    padding: 10,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default HomeScreen;
