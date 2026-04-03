import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigationTypes';
// import {AuthContext} from '../context/AuthContext';
import { AuthContext } from '../context/AuthProvider';

const RootTabs: React.FC = () => {
  const { user } = useContext(AuthContext)!;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { logout } = useContext(AuthContext)!;
  const handleNavigation = async (screen: keyof RootStackParamList) => {
    navigation.navigate(screen);
  };

  const confirmLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout },
      ],
      { cancelable: true },
    );
  };

  return (
    <View style={[styles.bottomNav, { backgroundColor: user.status === '03' ? '#a7cc43' : '#f8ac59' }]}>
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
      <TouchableOpacity style={styles.navButton} onPress={confirmLogout}>
        <Text style={styles.navButtonText}>Logout</Text>
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
    //backgroundColor: '#a7cc43',
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
