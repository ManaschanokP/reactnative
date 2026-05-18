//app/src/screens/LoginScreen.tsx
import React, {useContext, useEffect, useState} from 'react';
import {
  SafeAreaView,
  View,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';

import Toast from 'react-native-toast-message';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigationTypes';
import {AuthContext} from './../context/AuthProvider';
import {loginUser, checkLogin, updateToken} from '../services/apiService';
import {LoginRequest, UpdateTokenRequest} from '../types/authTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({navigation}) => {
  const {login} = useContext(AuthContext)!;
  const [credentials, setCredentials] = useState<LoginRequest>({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    loadRememberedUser();
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      e.preventDefault();
    });
    return unsubscribe;
  }, [navigation]);

  const loadRememberedUser = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem('rememberedUsername');
      const savedPassword = await AsyncStorage.getItem('rememberedPassword');
      if (savedUsername && savedPassword) {
        setCredentials({
          username: savedUsername,
          password: savedPassword,
        });
        setRememberMe(true);
      }
    } catch (error) {
      console.log('Load remember user error:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const responseUserCompany = await loginUser(credentials);
      if (responseUserCompany.error) {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: responseUserCompany.message,
          visibilityTime: 2000,
        });
        return;
      }

      const companyCode = responseUserCompany.User[0].company;

      await AsyncStorage.setItem('companyCode', companyCode);

      const responseLogin = await checkLogin(credentials);

      if (responseLogin.error) {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: responseLogin.message,
          visibilityTime: 2000,
        });
        return;
      }

      const userData = responseLogin.User[0];
      // Remember Me
      if (rememberMe) {
        await AsyncStorage.setItem('rememberedUsername', credentials.username);
        await AsyncStorage.setItem('rememberedPassword', credentials.password);
      } else {
        await AsyncStorage.removeItem('rememberedUsername');
        await AsyncStorage.removeItem('rememberedPassword');
      }

      // Update FCM Token
      const fcmToken = await AsyncStorage.getItem('FCM_TOKEN');

      const tokenPayload: UpdateTokenRequest = {
        token: fcmToken ?? '',
        id: userData.id,
      };
      await updateToken(tokenPayload);
      login(fcmToken ?? '', userData);
    } catch (error) {
      console.log('Login Error:', error);

      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: 'Invalid username or password',
        visibilityTime: 2000,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: '#F7F8FA'}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={{flex: 1, backgroundColor: '#F7F8FA'}}
          contentContainerStyle={{
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <SafeAreaView style={{flex: 1}}>
            <View style={styles.content}>
              {/* Logo */}
              <Image
                source={require('../../assets/isl_name.png')}
                style={styles.logoText}
                resizeMode="contain"
              />

              {/* Heading */}
              <View style={styles.headingContainer}>
                <Text style={styles.heading}>เข้าสู่ระบบ</Text>
              </View>

              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ชื่อผู้ใช้</Text>

                <View style={styles.inputContainer}>
                  <Icon
                    name="person-outline"
                    size={22}
                    color="#8A8A8A"
                    style={styles.leftIcon}
                  />

                  <TextInput
                    style={styles.textInput}
                    placeholder="Username"
                    keyboardType="default"
                    value={credentials.username}
                    onChangeText={text =>
                      setCredentials({
                        ...credentials,
                        username: text,
                      })
                    }
                    autoCapitalize="none"
                    placeholderTextColor="#B8B8B8"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>รหัสผ่าน</Text>

                <View style={styles.inputContainer}>
                  <Icon
                    name="lock-closed-outline"
                    size={22}
                    color="#8A8A8A"
                    style={styles.leftIcon}
                  />

                  <TextInput
                    style={styles.textInput}
                    placeholder="Password"
                    secureTextEntry={!showPassword}
                    value={credentials.password}
                    onChangeText={text =>
                      setCredentials({
                        ...credentials,
                        password: text,
                      })
                    }
                    autoCapitalize="none"
                    placeholderTextColor="#B8B8B8"
                  />

                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}>
                    <Icon
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={22}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember Me */}
              <TouchableOpacity
                style={styles.rememberContainer}
                activeOpacity={0.8}
                onPress={() => setRememberMe(!rememberMe)}>
                <View
                  style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxActive,
                  ]}>
                  {rememberMe && (
                    <Icon name="checkmark" size={13} color="#FFF" />
                  )}
                </View>

                <Text style={styles.rememberText}>จดจำฉัน</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.loginButton}
                onPress={handleLogin}>
                <Text style={styles.loginText}>ล็อคอิน</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const {width} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
  flex: 1,
},

  content: {
    flex: 1,
    justifyContent: 'center',

    paddingHorizontal: width * 0.08,
    paddingVertical: 40,
  },

  logoText: {
    width: width * 0.82,
    height: 60,

    alignSelf: 'center',

    marginBottom: 35,
  },

  headingContainer: {
    marginBottom: 36,
  },

  heading: {
    fontSize: width * 0.075,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    fontFamily: 'Quicksand-Bold',
  },

  inputGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    color: '#6C7278',
    marginBottom: 10,
    marginLeft: 4,
    fontWeight: '500',
    fontFamily: 'Quicksand-Medium',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',

    height: 58,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#ECECEC',

    borderRadius: 18,

    paddingHorizontal: 16,

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.03,
    shadowRadius: 6,

    elevation: 2,
  },

  leftIcon: {
    marginRight: 12,
  },

  textInput: {
    flex: 1,

    fontSize: 15,
    color: '#333333',

    paddingVertical: 0,
  },

  eyeButton: {
    marginLeft: 12,
  },

  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 4,
    marginBottom: 30,
  },

  checkbox: {
    width: 18,
    height: 18,

    borderRadius: 6,

    borderWidth: 1.5,
    borderColor: '#98CE00',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 10,

    backgroundColor: '#FFF',
  },

  checkboxActive: {
    backgroundColor: '#98CE00',
  },

  rememberText: {
    fontSize: 12,
    color: '#7D848D',
  },

  loginButton: {
    height: 58,

    backgroundColor: '#98CE00',

    borderRadius: 18,

    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#98CE00',

    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.25,
    shadowRadius: 10,

    elevation: 5,
  },

  loginText: {
    color: '#FFFFFF',

    fontSize: 17,
    fontWeight: '700',

    letterSpacing: 0.3,
  },
});

export default LoginScreen;
