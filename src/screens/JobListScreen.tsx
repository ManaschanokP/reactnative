import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigationTypes';

type Props = NativeStackScreenProps<RootStackParamList, 'JobList'>;

const JobListScreen: React.FC<Props> = ({}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [jobs, setJobs] = useState([
    {id: '1', title: 'Job 1'},
    {id: '2', title: 'Job 2'},
    {id: '3', title: 'Job 3'},
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.dateContainer}>
        <Text style={styles.label}>วันที่เริ่ม :</Text>
        <TextInput
          style={styles.input}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="เลือกวันที่"
        />
        <Text style={styles.label}>วันที่สิ้นสุด :</Text>
        <TextInput
          style={styles.input}
          value={endDate}
          onChangeText={setEndDate}
          placeholder="เลือกวันที่"
        />
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.label}>สถานะ :</Text>
        <Picker
          selectedValue={status}
          onValueChange={itemValue => setStatus(itemValue)}
          style={styles.picker}>
          <Picker.Item label="ทั้งหมด" value="" />
          <Picker.Item label="กำลังดำเนินการ" value="in_progress" />
          <Picker.Item label="เสร็จสิ้น" value="completed" />
        </Picker>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <TouchableOpacity style={styles.jobItem}>
            <Text style={styles.jobText}>{item.title}</Text>
          </TouchableOpacity>
        )}
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
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  picker: {
    flex: 1,
    height: 40,
  },
  jobItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  jobText: {
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

export default JobListScreen;
