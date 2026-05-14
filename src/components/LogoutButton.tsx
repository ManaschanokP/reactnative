import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ClearAsyncStorageButton: React.FC = () => {

  return (
      <View>
        <Text style={styles.navButtonText}>Logout</Text>
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
    backgroundColor: '#93D500',
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
export default ClearAsyncStorageButton;
