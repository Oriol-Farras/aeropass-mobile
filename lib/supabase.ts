import { createClient } from '@supabase/supabase-js';

// ── Supabase client ──────────────────────────────────────────────────
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] ⚠️  EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY no están configuradas en .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Tipos ────────────────────────────────────────────────────────────
export interface UsuarioRegistrado {
    id: string;
    dni: string;
    nombre_completo: string;
    face_token: string | null;
    estado_verificado: boolean;
    created_at: string;
}

export interface PaseCreado {
    id_pase: string;
    usuario_id: string;
    referencia_vuelo: string;
    usado: boolean;
    biometria_activada: boolean;
    fecha_creacion: string;
}

// ── Resultado del registro ───────────────────────────────────────────
export interface ResultadoRegistro {
    usuario: UsuarioRegistrado;
    esNuevo: boolean;
}

// ── Registrar usuario completo ──────────────────────────────────────
/**
 * Inserta (o actualiza si ya existe por DNI) un usuario verificado.
 * Devuelve el objeto usuario y un flag `esNuevo` que indica si es
 * un registro nuevo o un usuario recurrente.
 */
export async function registrarUsuarioCompleto(
    dniNumero: string,
    nombreCompleto: string,
    faceToken: string | null,
): Promise<ResultadoRegistro> {
    console.log('[Supabase] Registrando usuario…', { dniNumero, nombreCompleto });

    // 1. Comprobar si el usuario ya existe
    const { data: existente, error: selectError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('dni', dniNumero)
        .maybeSingle();

    if (selectError) {
        console.error('[Supabase] Error al buscar usuario existente:', selectError.code, selectError.message);
        throw selectError;
    }

    const esNuevo = !existente;

    // 2. Upsert: insertar si es nuevo, actualizar si ya existe
    const { data, error } = await supabase
        .from('usuarios')
        .upsert(
            {
                dni: dniNumero,
                nombre_completo: nombreCompleto,
                face_token: faceToken,
                estado_verificado: true,
            },
            { onConflict: 'dni' },
        )
        .select()
        .single();

    if (error) {
        console.error('[Supabase] Error al registrar usuario:', error.code, error.message);
        throw error;
    }

    if (esNuevo) {
        console.log('[Supabase] 🆕 Nuevo usuario registrado:', data.id);
    } else {
        console.log('[Supabase] 🔄 Usuario recurrente actualizado:', data.id);
    }

    return { usuario: data as UsuarioRegistrado, esNuevo };
}

// ── Crear pase de abordaje ──────────────────────────────────────────
/**
 * Crea un nuevo pase de abordaje para un usuario existente.
 */
export async function crearPaseAbordaje(
    usuarioId: string,
    referenciaVuelo: string,
): Promise<PaseCreado> {
    console.log('[Supabase] Creando pase de abordaje…', { usuarioId, referenciaVuelo });

    const { data, error } = await supabase
        .from('pases')
        .insert({
            usuario_id: usuarioId,
            referencia_vuelo: referenciaVuelo,
            usado: false,
        })
        .select()
        .single();

    if (error) {
        console.error('[Supabase] Error al crear pase:', error.message);
        throw error;
    }

    console.log('[Supabase] ✅ Pase creado:', data.id_pase);
    return data as PaseCreado;
}

// ── Obtener último pase del usuario ─────────────────────────────────
export interface PaseConUsuario {
    id_pase: string;
    usuario_id: string;
    referencia_vuelo: string;
    usado: boolean;
    biometria_activada: boolean;
    fecha_creacion: string;
    usuarios: {
        id: string;
        dni: string;
        nombre_completo: string;
    };
}

export async function obtenerUltimoPase(usuarioId: string): Promise<PaseConUsuario | null> {
    const { data, error } = await supabase
        .from('pases')
        .select('*, usuarios(id, dni, nombre_completo)')
        .eq('usuario_id', usuarioId)
        .order('fecha_creacion', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('[Supabase] Error al obtener pase:', error.code, error.message);
        return null;
    }

    return data as PaseConUsuario | null;
}

// ── Toggle biometría activada ───────────────────────────────────────
export async function toggleBiometriaActivada(
    paseId: string,
    valor: boolean,
): Promise<boolean> {
    console.log(`[Supabase] Toggle biometría: ${valor} para pase ${paseId}`);

    const { error } = await supabase
        .from('pases')
        .update({ biometria_activada: valor })
        .eq('id_pase', paseId);

    if (error) {
        console.error('[Supabase] Error al actualizar biometría:', error.code, error.message);
        return false;
    }

    console.log('[Supabase] ✅ Biometría actualizada:', valor);
    return true;
}
