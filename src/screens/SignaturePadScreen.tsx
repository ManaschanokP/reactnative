import React, { useRef } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';

const SignatureScreenComponent: React.FC = () => {
  const ref = useRef<typeof SignatureScreen>(null);

  const handleClear = () => {
    ref.current?.clearSignature();
  };

  const handleSave = () => {
    ref.current?.readSignature();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ลายเซ็น:</Text>
      <SignatureScreen
        ref={ref}
        onOK={(signature) => console.log('Signature:', signature)}
        onEmpty={() => console.log('No signature detected')}
        descriptionText="เซ็นที่นี่"
        clearText="ลบ"
        confirmText="บันทึก"
        webStyle={'.m-signature-pad--footer {display: none; }'}
        style={styles.signaturePad}
      />
      <View style={styles.buttonContainer}>
        <Button title="ลบ" onPress={handleClear} color="#C0392B" />
        <Button title="บันทึก" onPress={handleSave} color="#1E8449" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  signaturePad: {
    flex: 1,
    borderColor: '#000',
    borderWidth: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
});

export default SignatureScreenComponent;
