import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#141414',
    },

    // ── TOP BAR ──
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    titlePill: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    titlePillText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1.5,
    },

    // ── HERO TEXT ──
    heroSection: {
        alignItems: 'center',
        paddingTop: 32,
        paddingBottom: 24,
        paddingHorizontal: 40,
    },
    heroTitle: {
        color: '#ffffff',
        fontSize: 26,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 10,
    },
    heroSubtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        fontWeight: '400',
        textAlign: 'center',
        lineHeight: 20,
    },

    // ── VIEWFINDER ──
    viewfinderWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    viewfinder: {
        width: '100%',
        aspectRatio: 1.6,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraPreview: {
        ...StyleSheet.absoluteFillObject,
    },
    placeholderIcon: {
        opacity: 0.4,
    },

    // Esquinas del visor
    corner: {
        position: 'absolute',
        width: 28,
        height: 28,
        borderColor: '#ffffff',
        borderWidth: 3,
    },
    cornerTL: { top: -1, left: -1, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 10 },
    cornerTR: { top: -1, right: -1, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 10 },
    cornerBL: { bottom: -1, left: -1, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 10 },
    cornerBR: { bottom: -1, right: -1, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 10 },

    // ── STATUS PILL ──
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 30,
        marginTop: 20,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22c55e',
    },
    statusText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },

    // ── BOTTOM BAR ──
    bottomBar: {
        paddingBottom: 32,
        paddingTop: 16,
        alignItems: 'center',
    },
    bottomActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 48,
        marginBottom: 16,
    },
    bottomActionBtn: {
        alignItems: 'center',
        gap: 6,
    },
    bottomActionIcon: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomActionLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    captureButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#ffffff',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureInner: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#ffffff',
    },
    poweredBy: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 12,
        fontWeight: '400',
    },
});

export const permStyles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        gap: 16,
    },
    title: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 8,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    btn: {
        marginTop: 8,
        backgroundColor: '#ffffff',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 14,
        width: '100%',
        alignItems: 'center',
    },
    btnText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '700',
    },
    cancelText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        marginTop: 4,
    },
});
