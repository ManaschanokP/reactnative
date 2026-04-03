import React from 'react';
import { Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type GradientButtonProps = {
    onPress: () => void;
    text?: string; // Optional prop for button text
};

const GradientButton: Rect.FC<GradientButtonProps> = ({ onPress, text }) => {
    return (
        <TouchableOpacity onPress={onPress} style={styles.buttonContainer}>
            <LinearGradient
                colors={text == 'Driver' ? ['#CEF566', '#85A235'] : ['#F7C858', '#E47E11']} // ไล่สีตามลำดับ
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.gradient}
            >
                <Image source={require('../../assets/box_002.png')} style={styles.buttonImage} resizeMode="contain" />
                <Text style={styles.buttonText}>{text}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    buttonContainer: {
        width: '80%', // กว้าง 80% ของ parent
        height: '22%', // สูง 15% ของ parent
        borderRadius: 5,
        overflow: 'hidden',
        //margin: 10,
    },
    gradient: {
        flex: 1,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 25,
        fontWeight: 'bold',
    },
    buttonImage: {
        width: 80,
        height: 80,
        marginBottom: 10,
    },
});

export default GradientButton;
