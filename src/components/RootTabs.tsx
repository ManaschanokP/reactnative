import React, {useContext, useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Keyboard} from 'react-native';
import {
  NavigationProp,
  useNavigation,
  useNavigationState,
} from '@react-navigation/native';
import {RootStackParamList} from '../types/navigationTypes';
import {AuthContext} from '../context/AuthProvider';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import OctiIcon from 'react-native-vector-icons/Octicons';
import IonIcon from 'react-native-vector-icons/Ionicons';
import FoundationIcon from 'react-native-vector-icons/Foundation';

const ICON_COLOR = '#6C7278';


const RootTabs: React.FC = () => {
  const {user, companyColor, hasUnreadNoti} = useContext(AuthContext)!;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // ✅ ใช้ useNavigationState แทน useRoute
  const currentRoute = useNavigationState(state => {
    if (!state) return '';
    const route = state.routes[state.index];
    return route?.name ?? '';
  });

  const handleNavigation = (screen: keyof RootStackParamList) => {
    navigation.navigate(screen);
  };

  const isActive = (screen: string) => currentRoute === screen;
  const isDriverOrMessenger = user?.status === 'U04' || user?.status === 'U05';

  const getIconColor = (screen: string) =>
    isActive(screen) ? companyColor : ICON_COLOR;
  const getTextColor = (screen: string) =>
    isActive(screen) ? companyColor : ICON_COLOR;

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    !keyboardVisible && (
      <View style={[styles.bottomNav, {paddingBottom: insets.bottom || 10}]}>
        {/* ── Home ── */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigation('Home')}>
          {isActive('Home') ? (
            // ✅ กดแล้ว —
            <FoundationIcon
              name="home"
              size={28}
              color={getIconColor('Home')}
            />
          ) : (
            // ✅ ยังไม่กด —
            <OctiIcon name="home" size={26} color={getIconColor('Home')} />
          )}
          <Text style={[styles.navButtonText, {color: getTextColor('Home')}]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* ── Notifications ── */}
        {isDriverOrMessenger && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => handleNavigation('NotificationList')}>
            <View>
              <OctiIcon
                name={isActive('NotificationList') ? 'bell-fill' : 'bell'}
                size={26}
                color={getIconColor('NotificationList')}
              />
              {hasUnreadNoti && <View style={styles.badge} />}
            </View>
            <Text
              style={[
                styles.navButtonText,
                {color: getTextColor('NotificationList')},
              ]}>
              Notifications
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Jobs ── */}
        {isDriverOrMessenger && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => handleNavigation('JobList')}>
            <IonIcon
              name={isActive('JobList') ? 'grid' : 'grid-outline'}
              size={26}
              color={getIconColor('JobList')}
            />
            <Text
              style={[styles.navButtonText, {color: getTextColor('JobList')}]}>
              Jobs
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Profile ── */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigation('Profile')}>
          <Icon
            name={isActive('Profile') ? 'person' : 'person-outline'}
            size={26}
            color={getIconColor('Profile')}
          />
          <Text
            style={[styles.navButtonText, {color: getTextColor('Profile')}]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    )
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    paddingTop: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  navButton: {
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 3,
  },
  navButtonText: {
    fontSize: 11,
    fontFamily: 'Quicksand-Bold',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#e74c3c',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
});

export default RootTabs;
