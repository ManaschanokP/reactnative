import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const ViewDetailScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>วันที่ :</Text>
      <Text style={styles.text}>01/01/2024</Text>

      <Text style={styles.label}>เวลา :</Text>
      <Text style={styles.text}>12:00 PM</Text>

      <Text style={styles.label}>สถานะ :</Text>
      <Text style={styles.text}>กำลังดำเนินการ</Text>

      <Text style={styles.label}>รายละเอียด :</Text>
      <Text style={styles.text}>ส่งพัสดุไปยังปลายทาง</Text>

      <Image source={require('../assets/sample_image.png')} style={styles.image} />
      <Image source={require('../assets/sample_image.png')} style={styles.image} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  image: {
    width: 250,
    height: 240,
    resizeMode: 'contain',
    marginTop: 20,
  },
});

export default ViewDetailScreen;
