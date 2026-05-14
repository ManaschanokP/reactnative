import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigationTypes';

type Props = NativeStackScreenProps<RootStackParamList, 'Satisfaction'>;

const SatisfactionScreen: React.FC<Props> = ({navigation}) => {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);

  const handleScoreSelection = (score: number) => {
    setSelectedScore(score);
  };

  const handleSubmit = () => {
    if (selectedScore !== null) {
      Alert.alert('Success', `You selected a score of ${selectedScore}.`);
      navigation.navigate('Home');
    } else {
      Alert.alert('Error', 'Please select a score.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Please rate your satisfaction:</Text>
      <View style={styles.scoreContainer}>
        {[1, 2, 3, 4, 5].map(score => (
          <TouchableOpacity
            key={score}
            style={[
              styles.scoreButton,
              selectedScore === score && styles.selectedScoreButton,
            ]}
            onPress={() => handleScoreSelection(score)}>
            <Text style={styles.scoreText}>{score}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  scoreContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  scoreButton: {
    padding: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderRadius: 5,
  },
  selectedScoreButton: {
    backgroundColor: 'lightblue',
  },
  scoreText: {
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: 'blue',
    padding: 15,
    borderRadius: 5,
  },
  submitText: {
    color: 'white',
    fontSize: 16,
  },
});

export default SatisfactionScreen;
