import React from 'react';
import { StyleSheet, View } from 'react-native';

const RINGS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110];

export function FingerprintIllustration() {
    return (
        <View style={styles.wrapper}>
            {RINGS.map((size, i) => (
                <View
                    key={i}
                    style={{
                        width: size * 1.8,
                        height: size * 2.2,
                        borderRadius: size * 1.1,
                        borderColor: 'rgba(0,0,0,0.45)',
                        borderWidth: 1.4,
                        backgroundColor: 'transparent',
                        position: 'absolute',
                    }}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: 220,
        height: 260,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
