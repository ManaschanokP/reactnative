import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const NotificationDetailScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Request ID :</Text>
      <Text style={styles.text}>12345</Text>

      <Text style={styles.label}>สถานะ :</Text>
      <Text style={styles.text}>รอดำเนินการ</Text>

      <Text style={styles.label}>ปลายทาง :</Text>
      <Text style={styles.text}>กรุงเทพ</Text>

      <Text style={styles.label}>รายละเอียด :</Text>
      <Text style={styles.text}>ส่งพัสดุ</Text>

      <Text style={styles.label}>ข้อมูลเพิ่มเติม :</Text>
      <Text style={styles.text}>ติดต่อก่อนถึงปลายทาง</Text>

      <Button title="ปิด" color="#C0392B" onPress={() => {}} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
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
});

export default NotificationDetailScreen;
