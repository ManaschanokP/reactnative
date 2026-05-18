// app/App.tsx
import './src/theme/globalStyles';
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
import ScanScreen from './src/screens/ScanScreen';
import ViewDetailScreen from './src/screens/ViewDetailScreen';
import {SafeAreaProvider} from 'react-native-safe-area-context'; //import อยู่แล้ว
import SignaturePadScreen from './src/screens/SignaturePadScreen';
import EvaluationScreen from './src/screens/EvaluationScreen';
import TrackingScreen from './src/screens/TrackingScreen';
import {startSyncListener} from './src/services/syncService';

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
  console.warn('Missing postId');
  return null;
}

const linking = {
  prefixes: ['myapp://'],
  config: {
    screens: {
      NotificationDetail: 'NotificationDetail',
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
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationHandler />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function NavigationHandler() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null!);
  const {user, companyColor} = useContext(AuthContext)!;
  const [statusBarColor, setStatusBarColor] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = startSyncListener();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log('User changed:', user);
    if (user) {
      if (user.status === 'U04') {
        setStatusBarColor('#93D500');
      } else {
        setStatusBarColor('#D7E9F7');
      }
    } else {
      setStatusBarColor(null);
    }
  }, [user]);

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
    
      <StatusBar
        backgroundColor={user ? companyColor : null}
        barStyle="dark-content"
      />
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
  const {user, companyColor} = useContext(AuthContext)!;
  console.log('User in MainApp:', user);

  useEffect(() => {
    if (user && navigationRef?.current) {
      if (user.first_login === 'Y') {
        navigationRef.current.navigate('Profile');
      } else if (user.first_login === 'N') {
        if (user.status === 'U04' || user.status === 'U05') {
          navigationRef.current.navigate('Home');
        } else {
          navigationRef.current.navigate('Home');
        }
      }
    }
  }, [user, navigationRef]);

  return (
    <>

     <StatusBar
      backgroundColor="#ffffff"
      barStyle="dark-content"
    />
      <Stack.Navigator
        screenOptions={{
        headerStyle: {
          backgroundColor: user ? companyColor : '#F5A800',
        },
        headerTintColor: '#fdfdfd',
        headerTitleStyle: {fontFamily: 'Quicksand-Bold'},
      }}>

        {user ? (
          <>
            <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{headerShown: false}}
          />
            <Stack.Screen name="ViewDetail" component={ViewDetailScreen} options={{ title: 'Jobs Detail' }}/>
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="Satisfaction" component={SatisfactionScreen} />
            <Stack.Screen name="FuelEntry" component={FuelEntryScreen} />
            <Stack.Screen name="JobList" component={JobListScreen} options={{headerShown: false}}/>
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="NotificationList"
              component={NotificationListScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="NotificationDetail"
              component={NotificationDetailScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen name="Scan" component={ScanScreen} options={{headerShown: false}}/>
            <Stack.Screen name="Signature" component={SignaturePadScreen} />
            <Stack.Screen name="Evaluation" component={EvaluationScreen} />
            <Stack.Screen name="Tracking" component={TrackingScreen} />
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
