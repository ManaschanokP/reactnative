import React, {useContext} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../types/navigationTypes';
import {AuthContext} from '../context/AuthProvider';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
 
const RootTabs: React.FC = () => {
  const {user} = useContext(AuthContext)!;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets(); // ดึงค่า insets
 
  const handleNavigation = async (screen: keyof RootStackParamList) => {
    navigation.navigate(screen);
  };
 
  return (
    <View
      style={[
        styles.bottomNav,
        {
          backgroundColor: user.status === 'U03' ? '#a7cc43' : '#f8ac59',
          paddingBottom: insets.bottom || 10, // ✅ เพิ่มตรงนี้
        },
      ]}>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => handleNavigation('Home')}>
        <Text style={styles.navButtonText}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => handleNavigation('NotificationList')}>
        <Text style={styles.navButtonText}>Notifications</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => handleNavigation('JobList')}>
        <Text style={styles.navButtonText}>Jobs</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => handleNavigation('Profile')}>
        <Text style={styles.navButtonText}>Profile</Text>
      </TouchableOpacity>
    </View>
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
    backgroundColor: '#1E8449',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
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
 
export default RootTabs;