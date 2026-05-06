import React, {useContext, useState} from 'react'; // 🔍 เพิ่ม useState
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native'; // 🔍 เพิ่ม TextInput, Alert
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigationTypes';
import {AuthContext} from '../context/AuthProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const {user} = useContext(AuthContext)!;
  // 🔍 เพิ่ม state สำหรับค้นหา
  const [searchId, setSearchId] = useState('');
  console.log('User Home Screen:', user);
  console.log('User Status Home Screen:', user?.status);

  // เพิ่ม function ค้นหา
  const handleSearch = () => {
    if (!searchId.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอก Request ID');
      return;
    }
    navigation.navigate('Tracking', {
      requestId: searchId,
    });
  };

  //format function
  const formatRequestId = (value: string) => {
    let cleaned = value.toUpperCase().replace(/-/g, '');
    cleaned = cleaned.replace(/[^A-Z0-9]/g, '');
    cleaned = cleaned.slice(0, 9);
    let result = '';
    if (cleaned.length <= 2) {
      result = cleaned;
    } else if (cleaned.length <= 4) {
      result = `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    } else {
      result = `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(
        4,
      )}`;
    }
    return result;
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search ID..."
            value={searchId}
            onChangeText={text => {
              const formatted = formatRequestId(text);
              setSearchId(formatted);
            }}
            style={styles.input}
            onSubmitEditing={handleSearch}
          />

          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.buttonText}>🔍</Text>
          </TouchableOpacity>
        </View>


        <TouchableOpacity
          style={[
            styles.button,
            {backgroundColor: user?.status === 'U03' ? '#a7cc43' : '#f8ac59'},
          ]}
          onPress={() => {
            console.log('Scan QR-Code Pressed');
            navigation.navigate('Scan');
          }}>
          <Text style={styles.buttonText}>Scan QR-Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            {backgroundColor: user?.status === 'U03' ? '#a7cc43' : '#f8ac59'},
          ]}
          onPress={() => {
            console.log('น้ำมัน Pressed');
            navigation.navigate('FuelEntry');
          }}>
          <Text style={styles.buttonText}>น้ำมัน</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  // 🔍 🔥 เพิ่ม style search
  searchBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    overflow: 'hidden',
    width: '80%',
    marginBottom: 20,
  },

  input: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 16,
  },

  searchButton: {
    backgroundColor: '#f8ac59',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },

  // 🔽 ของเดิม
  button: {
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    width: '40%',
    alignItems: 'center',
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
    backgroundColor: '#a7cc43',
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

export default HomeScreen;
