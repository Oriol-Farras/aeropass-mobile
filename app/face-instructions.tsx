import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FaceInstructionsScreen() {
    const router = useRouter();

    const InfoRow = ({ icon, title, subtitle }: { icon: keyof typeof MaterialIcons.glyphMap, title: string, subtitle: string }) => (
        <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
                <MaterialIcons name={icon} size={28} color="#111" />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.infoTitle}>{title}</Text>
                <Text style={styles.infoSubtitle}>{subtitle}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AEROPASS</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.scrollContent}>
                {/* Titles */}
                <Text style={styles.mainTitle}>Prepárate para{'\n'}el escaneo</Text>
                <Text style={styles.mainSubtitle}>
                    Sigue estas recomendaciones para una{'\n'}verificación rápida.
                </Text>

                {/* List Items */}
                <View style={styles.listContainer}>
                    <InfoRow
                        icon="wb-sunny"
                        title="Busca un lugar con buena luz"
                        subtitle="Asegúrate de que tu rostro esté bien iluminado y sin sombras fuertes."
                    />
                    <View style={styles.separator} />
                    <InfoRow
                        icon="visibility-off"
                        title="Quítate accesorios"
                        subtitle="Retira gafas de sol, mascarilla o gorras para que podamos identificarte."
                    />
                    <View style={styles.separator} />
                    <InfoRow
                        icon="smartphone"
                        title="Móvil a la altura de los ojos"
                        subtitle="Mantén el dispositivo estable y centrado frente a ti."
                    />
                    <View style={styles.separator} />
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                        // For now we end the flow here, or redirect to a face-scan route when created.
                        router.dismissAll();
                        router.replace('/(tabs)');
                    }}
                >
                    <Text style={styles.buttonText}>Comenzar escaneo</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <MaterialIcons name="lock" size={12} color="#d1d5db" />
                    <Text style={{ fontSize: 11, color: '#d1d5db', letterSpacing: 0.5 }}>ENCRYPTED & ON-DEVICE</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
    },
    backButton: {
        padding: 4,
        marginLeft: -4,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111',
        letterSpacing: 2,
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 12,
        paddingBottom: 40,
    },
    mainTitle: {
        fontSize: 34,
        fontWeight: '900',
        color: '#111',
        lineHeight: 40,
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    mainSubtitle: {
        fontSize: 17,
        color: '#64748b',
        lineHeight: 26,
        marginBottom: 44,
    },
    listContainer: {
        gap: 0,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 24,
    },
    iconContainer: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 20,
    },
    textContainer: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111',
        marginBottom: 8,
    },
    infoSubtitle: {
        fontSize: 15,
        color: '#64748b',
        lineHeight: 22,
    },
    separator: {
        height: 1,
        backgroundColor: '#f1f5f9',
        width: '100%',
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 32,
        paddingTop: 16,
        gap: 12,
        backgroundColor: '#ffffff',
    },
    button: {
        backgroundColor: '#111',
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});
