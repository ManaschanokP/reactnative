import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {Button} from 'react-native-elements';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import DatePicker, {DateType} from 'react-native-ui-datepicker';
import {RootStackParamList} from '../types/navigationTypes';

type Props = NativeStackScreenProps<RootStackParamList, 'FuelEntry'>;

const FuelEntryScreen: React.FC<Props> = ({navigation}) => {
  const [license, setLicense] = useState('');
  const [date, setDate] = useState(new Date());
  const [mile, setMile] = useState('');
  const [lit, setLit] = useState('');
  const [bath, setBath] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (params: {date: DateType}) => {
    if (params.date instanceof Date) {
      setDate(params.date);
      setShowDatePicker(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>วันที่ :</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={date.toDateString()}
            editable={false}
          />
          <MaterialIcons
            name="date-range"
            size={30}
            color="#a7cc43"
            style={styles.iconButton}
          />
        </View>
      </TouchableOpacity>

      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <DatePicker mode="single" date={date} onChange={handleDateChange} />
            <Button title="ปิด" onPress={() => setShowDatePicker(false)} />
          </View>
        </View>
      </Modal>

      <Text style={styles.label}>ทะเบียน :</Text>
      <Picker
        selectedValue={license}
        onValueChange={itemValue => setLicense(itemValue)}
        style={styles.picker}>
        <Picker.Item label="เลือกทะเบียน" value="" />
        <Picker.Item label="ABC-1234" value="ABC-1234" />
        <Picker.Item label="XYZ-5678" value="XYZ-5678" />
      </Picker>

      <Text style={styles.label}>เลขไมล์ :</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={mile}
        onChangeText={setMile}
      />

      <Text style={styles.label}>จำนวน (ลิตร) :</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={lit}
        onChangeText={setLit}
      />

      <Text style={styles.label}>จำนวน (บาท) :</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={bath}
        onChangeText={setBath}
      />
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
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 10,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
  },
  navButton: {
    backgroundColor: '#a7cc43',
    padding: 10,
    borderRadius: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
});

export default FuelEntryScreen;
