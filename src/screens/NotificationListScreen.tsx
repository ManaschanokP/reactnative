import React from 'react';
import { View, FlatList, Text,StyleSheet } from 'react-native';

const NotificationListScreen: React.FC = () => {
  const data = [
    { id: '1', name: 'Artist 1' },
    { id: '2', name: 'Artist 2' },
    { id: '3', name: 'Artist 3' },
  ];

  const renderItem = ({ item }: { item: { id: string; name: string } }) => (
    <View style={styles.listItem}>
      <Text style={styles.listText}>{item.name}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.listView}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listView: {
    flex: 1,
  },
  listItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  listText: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#a7cc43',
    paddingVertical: 10,
  },
  button: {
    flex: 1,
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    marginBottom: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default NotificationListScreen;
