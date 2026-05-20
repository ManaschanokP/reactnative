import React, {useContext, useState} from 'react'; //เพิ่ม useState
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
} from 'react-native'; // เพิ่ม TextInput, Alert
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigationTypes';
import {AuthContext, getCompanyColor} from '../context/AuthProvider';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {SafeAreaView} from 'react-native-safe-area-context';
import IonIcon from 'react-native-vector-icons/Ionicons';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const {user, companyColor} = useContext(AuthContext)!;

  //เพิ่ม state สำหรับค้นหา
  const [searchId, setSearchId] = useState('');
  console.log('User Home Screen:', user);
  console.log('User Status Home Screen:', user?.status);

  //เพิ่ม function ค้นหา
  const handleSearch = () => {
    if (!searchId.trim()) {
      setShowWarning(true);
      return;
    }
    navigation.navigate('Tracking', {
      requestId: searchId,
    });
  };

  const [showWarning, setShowWarning] = useState(false);

  const isDriverOrMessenger = user?.status === 'U04' || user?.status === 'U05';
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={{flex: 1}}>
          <View style={styles.hello1}>
            <Text style={styles.hello}>
              สวัสดี , {user?.name?.split(' ')[0]}
            </Text>
          </View>
          <View style={styles.container}>
            <Image
              source={require('../../assets/Delivery3.png')}
              style={styles.delivery}
              resizeMode="contain"
            />
            <View style={styles.searchBox}>
              <TextInput
                placeholder="ป้อนหมายเลขติดตาม"
                value={searchId}
                onChangeText={text => {
                  const formatted = formatRequestId(text);
                  setSearchId(formatted);
                }}
                style={styles.input}
                onSubmitEditing={handleSearch}
              />

              <TouchableOpacity
                style={[styles.searchButton, {backgroundColor: companyColor}]}
                onPress={handleSearch}>
                <Icon name="search" size={26} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.orContainer}>
              <View style={styles.line} />

              <Text style={styles.orText}>Or</Text>

              <View style={styles.line} />
            </View>

            <TouchableOpacity
              style={[styles.button]}
              onPress={() => {
                console.log('Scan QR-Code Pressed');
                navigation.navigate('Scan');
              }}>
              <Icon
                name="qr-code-scanner"
                size={28}
                color="#373737"
                style={styles.leftIcon}
              />
              <Text style={styles.buttonText}>Scan QR-Code</Text>
            </TouchableOpacity>

            {isDriverOrMessenger && (
              <TouchableOpacity
                style={[styles.button]}
                onPress={() => navigation.navigate('FuelEntry')}>
                <Image
                  source={require('../../assets/fuel.png')}
                  style={styles.vectoricon}
                  resizeMode="contain"
                />
                <Text style={styles.buttonText}>น้ำมัน</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>

      {/* WARNING MODAL */}
      <Modal transparent visible={showWarning} animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.box}>
            <View
              style={[modalStyles.iconCircle, {backgroundColor: '#F5A800'}]}>
              <Text style={modalStyles.iconText}>!</Text>
            </View>

            <Text style={modalStyles.title}>แจ้งเตือน</Text>

            <Text style={modalStyles.message}>กรุณาป้อนหมายเลขติดตาม</Text>

            <TouchableOpacity
              style={[
                modalStyles.singleButton,
                {backgroundColor: companyColor},
              ]}
              onPress={() => setShowWarning(false)}>
              <Text style={modalStyles.confirmText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const {width, height} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    paddingBottom: '15%',
  },

  //เพิ่ม style search
  searchBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
    width: '80%',
    marginBottom: 20,
    backgroundColor: '#fff',
  },

  input: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 16,
    fontFamily: 'Quicksand-Medium',
  },

  searchButton: {
    justifyContent: 'center',
    paddingHorizontal: 15,
  },

  leftIcon: {
    marginRight: 12,
  },

  vectoricon: {
    width: 25,
    height: 25,
    paddingRight: 50,
  },

  //ของเดิม
  button: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    Height: 60,
    width: '80%',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },
  bottomNav: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 2,
    justifyContent: 'space-around',
  },
  navButton: {
    padding: 2,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  delivery: {
    width: width * 0.82,
    height: 182,
    alignSelf: 'center',
    marginBottom: 35,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },

  line: {
    height: 1,
    backgroundColor: '#CFCFCF',
    width: 95,
  },

  orText: {
    marginHorizontal: 15,
    fontSize: 12,
    color: '#6C7278',
  },

  hello: {
    fontSize: 24,
    fontFamily: 'Quicksand-Bold',
    color: '#373737',
    justifyContent: 'flex-end',
  },
  hello1: {
    //flex: 1,
    justifyContent: 'flex-start',
    //alignItems: 'center',
    backgroundColor: '#F9F9F9',
    paddingLeft: '8%',
    paddingTop: '10%',
    paddingBottom: 0,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  box: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },

  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  iconText: {
    fontSize: 38,
    color: '#fff',
    fontFamily: 'Quicksand-Bold',
  },

  title: {
    fontSize: 28,
    color: '#222',
    fontFamily: 'Quicksand-Bold',
    marginBottom: 10,
  },

  message: {
    fontSize: 14,
    color: '#373737',
    textAlign: 'center',
    fontFamily: 'Quicksand-Medium',
    marginBottom: 24,
  },

  singleButton: {
    width: '70%',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  confirmText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
  },
});

export default HomeScreen;
