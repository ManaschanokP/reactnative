import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigationTypes';
import { AuthContext } from '../context/AuthProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RootTabs: React.FC = () => {
  const { user , companyColor }   = useContext(AuthContext)!;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets     = useSafeAreaInsets();

  const handleNavigation = (screen: keyof RootStackParamList) => {
    navigation.navigate(screen);
  };

  // ✅ U04 = Driver, U05 = Messenger — เห็นทุก tab
  // ✅ อื่นๆ (U03 ฯลฯ) — เห็นแค่ Home และ Profile
  const isDriverOrMessenger = user?.status === 'U04' || user?.status === 'U05';

  return (
    <View
      style={[
        styles.bottomNav,
        {
          backgroundColor: companyColor,
          paddingBottom: insets.bottom || 4,
        },
      ]}
    >
      {/* ── Home — แสดงทุก user ── */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => handleNavigation('Home')}
      >
        <Icon name="home" size={26} color="#fff" />
        <Text style={styles.navButtonText}>Home</Text>
      </TouchableOpacity>

      {/* ── Notifications — เฉพาะ Driver/Messenger ── */}
      {isDriverOrMessenger && (
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigation('NotificationList')}
        >

         <Icon name="notifications" size={26} color="#fff" />
          <Text style={styles.navButtonText}>Notifications</Text>
        </TouchableOpacity>
      )}

      {/* ── Jobs — เฉพาะ Driver/Messenger ── */}
      {isDriverOrMessenger && (
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigation('JobList')}
        >
          <Icon name="work" size={26} color="#fff" />
          <Text style={styles.navButtonText}>Jobs</Text>
        </TouchableOpacity>
      )}

      {/* ── Profile — แสดงทุก user ── */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => handleNavigation('Profile')}
      >
         <Icon name="person" size={26} color="#fff" />
        <Text style={styles.navButtonText}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection:  'row',
    position:       'absolute',
    bottom:         0,
    width:          '100%',
    padding:        6,
    justifyContent: 'space-around',
    alignItems:     'center',
  },
  navButton: {
    padding:    0,
    alignItems: 'center',
    minWidth:   60,
  },
  navButtonText: {
    color:     '#fff',
    fontSize:  13,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default RootTabs;