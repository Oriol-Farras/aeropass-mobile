import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },

    top: {
        backgroundColor: '#ffffff',
    },
    header: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    logoCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroText: {
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: 32,
        paddingBottom: 8,
    },
    title: {
        fontSize: 42,
        lineHeight: 46,
        fontWeight: '700',
        letterSpacing: -0.5,
        textAlign: 'center',
        color: '#000000',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 24,
        textAlign: 'center',
        color: '#6b7280',
    },

    middle: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    bottom: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 36,
        gap: 16,
    },
    primaryButton: {
        backgroundColor: '#000000',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        elevation: 4,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    buttonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#ffffff',
    },
    disclaimer: {
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '500',
        color: '#9ca3af',
    },
});
