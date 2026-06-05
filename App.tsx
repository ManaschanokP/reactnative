// app/App.tsx
import './src/theme/globalStyles';
import React, {useContext, useEffect, useRef, useState} from 'react';
import {Linking, StatusBar} from 'react-native';
import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import {PermissionsAndroid} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';

// Screens & Navigators
import MenuScreen from './src/screens/MenuScreen';
import LoginScreen from './src/screens/LoginScreen';
import SatisfactionScreen from './src/screens/SatisfactionScreen';
import FuelEntryScreen from './src/screens/FuelEntryScreen';
import HomeScreen from './src/screens/HomeScreen';
import JobListScreen from './src/screens/JobListScreen';
import NotificationDetailScreen from './src/screens/NotificationDetailScreen';
import NotificationListScreen from './src/screens/NotificationListScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ScanScreen from './src/screens/ScanScreen';
import ViewDetailScreen from './src/screens/ViewDetailScreen';
import SignaturePadScreen from './src/screens/SignaturePadScreen';
import EvaluationScreen from './src/screens/EvaluationScreen';
import TrackingScreen from './src/screens/TrackingScreen';
import RootTabs from './src/components/RootTabs';

// Context & Services
import {RootStackParamList} from './src/types/navigationTypes';
import {AuthProvider, AuthContext} from './src/context/AuthProvider';
import {startSyncListener} from './src/services/syncService';
import {
  isTrackingActive,
  startLocationTracking,
} from './src/services/locationService';

const NAVIGATION_IDS = ['NotificationDetail'];
const Stack = createNativeStackNavigator<RootStackParamList>();

// ฟังก์ชันแปลงข้อมูลแจ้งเตือน (FCM Data) ให้เป็น URL สำหรับ Deep Link
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

// การตั้งค่า Deep Linking ของแอปพลิเคชันและการจัดการกับข้อความแจ้งเตือน (FCM)
const linking = {
  prefixes: ['myapp://'],
  config: {
    screens: {
      NotificationDetail: 'NotificationDetail',
    },
  },
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (typeof url === 'string') return url;

    const message = await messaging().getInitialNotification();
    const deeplinkURL = buildDeepLinkFromNotificationData(message?.data);
    if (typeof deeplinkURL === 'string') return deeplinkURL;
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

// คอมโพเนนต์หลักของแอปพลิเคชัน ทำหน้าที่ห่อหุ้มด้วย SafeAreaProvider และ AuthProvider
function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationHandler />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// ส่วนจัดการระบบเนวิเกชันหลัก ขอสิทธิ์แจ้งเตือน และจัดการแถบสถานะ (StatusBar)
function NavigationHandler() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null!);
  const {user, companyColor} = useContext(AuthContext)!;
  const [statusBarColor, setStatusBarColor] = useState<string | null>(null);

  // เริ่มต้นทำงานตัวดักจับการซิงค์ข้อมูล
  useEffect(() => {
    const unsubscribe = startSyncListener();
    return () => unsubscribe();
  }, []);

  // เปลี่ยนสีสถานะแอปพลิเคชันตามสถานะผู้ใช้งาน
  useEffect(() => {
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

  // ขอสิทธิ์การแจ้งเตือนจากผู้ใช้งานและบันทึกรหัสลงทะเบียนเครื่อง (FCM Token)
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
        backgroundColor={user ? statusBarColor || companyColor : '#ffffff'}
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

// คอมโพเนนต์จัดการกองสกรีน (Stack Screen) และเส้นทางการนำทางตามสถานะของผู้ใช้
function MainApp({
  navigationRef,
}: {
  navigationRef?: React.RefObject<NavigationContainerRef<any>>;
}) {
  const {user, companyColor} = useContext(AuthContext)!;

  // ตรวจสอบและกู้คืนการทำงานของ GPS เผื่อกรณีที่ผู้ใช้เปิดแอปขึ้นมาใหม่ (Cold Start)
  useEffect(() => {
    const resumeTrackingIfNeeded = async () => {
      if (!user) return;

      try {
        const isActive = await isTrackingActive();
        if (isActive) {
          console.log('[Cold Start] Tracking active. Resuming GPS tracking...');
          const reqId = await AsyncStorage.getItem('track_request_id');
          const statusId = await AsyncStorage.getItem('track_status_id');
          const userId = await AsyncStorage.getItem('track_user_id');

          if (reqId && statusId && userId) {
            await startLocationTracking(reqId, statusId, userId);
            console.log('GPS tracking resumed successfully.');
          }
        }
      } catch (error) {
        console.error('Error resuming tracking:', error);
      }
    };

    resumeTrackingIfNeeded();
  }, [user]);

  // จัดการเปลี่ยนเส้นทางหน้าจอเมื่อเปิดแอปพลิเคชันครั้งแรกตามเงื่อนไขผู้ใช้
  useEffect(() => {
    if (user && navigationRef?.current) {
      if (user.first_login === 'Y') {
        navigationRef.current.navigate('Profile');
      } else if (user.first_login === 'N') {
        navigationRef.current.navigate('Home');
      }
    }
  }, [user, navigationRef]);

  return (
    <>
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
            <Stack.Screen
              name="ViewDetail"
              component={ViewDetailScreen}
              options={{title: 'Jobs Detail'}}
            />
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="Satisfaction" component={SatisfactionScreen} />
            <Stack.Screen
              name="FuelEntry"
              component={FuelEntryScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="JobList"
              component={JobListScreen}
              options={{headerShown: false}}
            />
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
            <Stack.Screen
              name="Scan"
              component={ScanScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen name="Signature" component={SignaturePadScreen} />
            <Stack.Screen name="Evaluation" component={EvaluationScreen} />
            <Stack.Screen
              name="Tracking"
              component={TrackingScreen}
              options={{headerShown: false}}
            />
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
