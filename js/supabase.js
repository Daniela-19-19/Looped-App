/* ==========================================================
   Looped · Conexión con Supabase
   Crea la conexión que usan todas las pantallas: `baseDatos`.

   Cómo usarlo en una pantalla (antes de app.js):
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js"></script>
   <script src="../js/supabase.js"></script>

   Ejemplo: const { data, error } = await baseDatos.from('artistas').select('*');

   La clave de abajo es la PÚBLICA: está hecha para verse en el
   navegador. Lo que protege los datos son las reglas RLS de
   supabase/esquema.sql. La clave secreta nunca va aquí.
   ========================================================== */
const SUPABASE_URL = 'https://vxmhoimuiytxicbhqdge.supabase.co';
const SUPABASE_CLAVE_PUBLICA = 'sb_publishable_lKpJrMVxVu0c5W94xTxIYw_JCpGVMOf';

// La librería se llama `supabase`; nuestra conexión se llama `baseDatos`.
const baseDatos = supabase.createClient(SUPABASE_URL, SUPABASE_CLAVE_PUBLICA);
