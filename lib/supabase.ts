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
    fecha_creacion: string;
}

// ── Registrar usuario completo ──────────────────────────────────────
/**
 * Inserta (o actualiza si ya existe por DNI) un usuario verificado.
 * Devuelve el objeto usuario con su UUID.
 */
export async function registrarUsuarioCompleto(
    dniNumero: string,
    nombreCompleto: string,
    faceToken: string | null,
): Promise<UsuarioRegistrado> {
    console.log('[Supabase] Registrando usuario…', { dniNumero, nombreCompleto });

    // Intentar insertar. Si ya existe (conflict en "dni"), actualiza.
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
        console.error('[Supabase] Error al registrar usuario:', error.message);
        throw error;
    }

    console.log('[Supabase] ✅ Usuario registrado/actualizado:', data.id);
    return data as UsuarioRegistrado;
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
