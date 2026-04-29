//app/src/screens/LoginScreen.tsx
import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, View, TextInput, Button, Image, StyleSheet, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigationTypes';
import { AuthContext } from './../context/AuthProvider';
import { loginUser, checkLogin, updateToken } from '../services/apiService';
import { LoginRequest, UpdateTokenRequest } from '../types/authTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {

  const [credentials, setCredentials] = useState<LoginRequest>({
    username: '',
    password: '',
  });

  const [dataUpdateToken, setUpdateToken] = useState<UpdateTokenRequest>({
    token: '',
    id: '',
  });

  const { login } = useContext(AuthContext)!;

  const handleLogin = async () => {
    try {
      const responseUserCompany = await loginUser(credentials);
      console.log('responseUserCompany : ',responseUserCompany);
      const companyCode = responseUserCompany.User[0].company;
      console.log('CompanyCode : ',companyCode);

      await AsyncStorage.setItem('companyCode', companyCode);

      if (!responseUserCompany.error) {
        const responseLogin = await checkLogin(credentials);
        const userData = responseLogin.User[0];

        if (!responseLogin.error) {
          const fcmToken = await AsyncStorage.getItem('FCM_TOKEN');
          setUpdateToken({ ...updateToken, token: fcmToken ?? '', id: userData.id });
          const responseUpdateToken = await updateToken(dataUpdateToken);
          login(fcmToken ?? '', userData);
          Alert.alert('Login Successful', `Welcome, ${responseUserCompany.User[0].name}`);

        } else {
          Toast.show({ type: 'error', text1: 'Login Failed', text2: responseLogin.message, visibilityTime: 2000 });
        }
      } else {
        Toast.show({ type: 'error', text1: 'Login Failed', text2: responseUserCompany.message, visibilityTime: 2000 });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Login Failed', text2: 'Invalid username or password', visibilityTime: 2000 });
    }
  };


  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
    });

    return unsubscribe;

  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Image
          source={require('../../assets/isl_name.png')}
          style={styles.logoText}
          resizeMode="contain"
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          keyboardType="default"
          value={credentials.username}
          onChangeText={text => setCredentials({ ...credentials, username: text })}
          autoCapitalize="none"
          placeholderTextColor="lightgray"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={credentials.password}
          onChangeText={text => setCredentials({ ...credentials, password: text })}
          autoCapitalize="none"
          placeholderTextColor="lightgray"

        />
        <Button title="Login" onPress={handleLogin} />
        <Image
          source={require('../../assets/isl_logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  logoText: {
    width: '100%',
    height: 100,
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    width: '80%',
    alignSelf: 'center', color: 'black',
  },
  logoImage: {
    width: 350,
    height: 350,
    marginTop: 32,
  },
});

export default LoginScreen;
