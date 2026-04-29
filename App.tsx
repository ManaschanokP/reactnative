// app/App.tsx
import React, {useContext, useEffect, useRef, useState} from 'react';
import {Linking, StatusBar} from 'react-native';
import {
  NavigationContainer,
  NavigationContainerRef,
  useNavigation,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import MenuScreen from './src/screens/MenuScreen';
import LoginScreen from './src/screens/LoginScreen';
import SatisfactionScreen from './src/screens/SatisfactionScreen';
import FuelEntryScreen from './src/screens/FuelEntryScreen';
import HomeScreen from './src/screens/HomeScreen';
import JobListScreen from './src/screens/JobListScreen';
import RootTabs from './src/components/RootTabs';
import {RootStackParamList} from './src/types/navigationTypes';
import {AuthProvider, AuthContext} from './src/context/AuthProvider';
import messaging from '@react-native-firebase/messaging';
import {PermissionsAndroid} from 'react-native';
import NotificationDetailScreen from './src/screens/NotificationDetailScreen';
import NotificationListScreen from './src/screens/NotificationListScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScanScreen from './src/screens/ScanScreen'; //เพิ่มหน้าสแกน

const NAVIGATION_IDS = ['NotificationDetail'];

function buildDeepLinkFromNotificationData(data: any): string | null {
  const navigationId = data?.navigationId;
  if (!NAVIGATION_IDS.includes(navigationId)) {
    console.warn('Unverified navigationId', navigationId);
    return null;
  }
  if (navigationId === 'NotificationDetail') {
    return 'myapp://NotificationDetail';
  }
  // if (navigationId === 'JobList') {
  //   return 'myapp://settings';
  // }
  // const postId = data?.postId;
  // if (typeof postId === 'string') {
  //   return `myapp://post/${postId}`
  // }
  console.warn('Missing postId');
  return null;
}

const linking = {
  prefixes: ['myapp://'],
  config: {
    screens: {
      NotificationDetail: 'NotificationDetail',
      //   Post: 'post/:id',
      //   Settings: 'settings'
    },
  },
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (typeof url === 'string') {
      return url;
    }

    const message = await messaging().getInitialNotification();
    const deeplinkURL = buildDeepLinkFromNotificationData(message?.data);
    if (typeof deeplinkURL === 'string') {
      return deeplinkURL;
    }
  },
  subscribe(listener: (url: string) => void) {
    const onReceiveURL = ({url}: {url: string}) => listener(url);

    const linkingSubscription = Linking.addEventListener('url', onReceiveURL);

    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });

    const foreground = messaging().onMessage(async remoteMessage => {
      console.log('A new FCM message arrived!', remoteMessage);
    });

    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      const url = buildDeepLinkFromNotificationData(remoteMessage.data);
      if (typeof url === 'string') {
        listener(url);
      }
    });

    return () => {
      linkingSubscription.remove();
      unsubscribe();
      foreground();
    };
  },
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <NavigationHandler />
    </AuthProvider>
  );
}

function NavigationHandler() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null!);
  const {user} = useContext(AuthContext)!;
  const [statusBarColor, setStatusBarColor] = useState<string | null>(null);

  // 🔹 Update StatusBar Color When User Changes
  useEffect(() => {
    console.log('User changed:', user);
    if (user) {
      if (user.status === 'U04') {
        setStatusBarColor('#a7cc43'); // Color for U04 users
      } else {
        setStatusBarColor('#D7E9F7'); // Default for other users
      }
    } else {
      setStatusBarColor(null); // Default color if user is null
    }
  }, [user]);

  // 🔹 Request Notification Permission (One-Time)
  useEffect(() => {
    const requestUserPermission = async () => {
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      const authStatus = await messaging().requestPermission();
      if (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      ) {
        const token = await messaging().getToken();
        console.log('FCM token:', token);
        AsyncStorage.setItem('FCM_TOKEN', token);
      }
    };
    requestUserPermission();
  }, []);

  return (
    <>
      <StatusBar backgroundColor={statusBarColor} barStyle="light-content" />
      <NavigationContainer linking={linking} ref={navigationRef}>
        <MainApp
          navigationRef={
            navigationRef as React.RefObject<NavigationContainerRef<any>>
          }
        />
      </NavigationContainer>
    </>
  );
}

function MainApp({
  navigationRef,
}: {
  navigationRef?: React.RefObject<NavigationContainerRef<any>>;
}) {
  const {user} = useContext(AuthContext)!;
  console.log('User in MainApp:', user);
  useEffect(() => {
    if (user && navigationRef?.current) {
      if (user.first_login === 'Y') {
        navigationRef.current.navigate('Profile');
      } else if (user.first_login === 'N') {
        // Check user status and navigate accordingly
        // U04 = Driver, U05 = Messenger, U03 = User, U01 = Admin Driver, U07 = Manager
        if (user.status === 'U04' || user.status === 'U05') {
          navigationRef.current.navigate('Home');
        } else {
          navigationRef.current.navigate('Menu');
        }
      }
    }
  }, [user, navigationRef]);
  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: user?.status === '03' ? '#a7cc43' : '#f8ac59', // สีพื้นหลัง Top Bar
          },
          headerTintColor: '#fff', // สีตัวอักษร (เช่นชื่อหน้า, ปุ่ม back)
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        {user ? (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              // options={{
              //   headerStyle: {
              //     backgroundColor: '#3498db', // Set the top bar color
              //   },
              //   headerTintColor: '#fff', // Set text/icon color
              //   headerTitleStyle: {
              //     fontWeight: 'bold',
              //   },
              // }}
            />
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="Satisfaction" component={SatisfactionScreen} />
            <Stack.Screen name="FuelEntry" component={FuelEntryScreen} />
            <Stack.Screen name="JobList" component={JobListScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen
              name="NotificationList"
              component={NotificationListScreen}
            />
            <Stack.Screen
              name="NotificationDetail"
              component={NotificationDetailScreen}
            />
            <Stack.Screen name="Scan" component={ScanScreen} />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{headerShown: false}}
          />
        )}
      </Stack.Navigator>
      {user ? <RootTabs /> : null}
      <Toast />
    </>
  );
}

export default App;
