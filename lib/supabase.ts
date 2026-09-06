import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase pour CampusLife.
 *
 * Lit l'URL du projet et la cle anon depuis le fichier .env (non versionne).
 * La session est stockee dans AsyncStorage : l'etudiant reste connecte
 * entre deux ouvertures de l'app.
 *
 * Ce fichier n'est importe qu'a partir du lot 1 (compte et etablissement).
 * Tant que le .env n'existe pas, ne l'importe pas, sinon l'app plante
 * au demarrage avec le message ci-dessous.
 */

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variables d'environnement Supabase manquantes. " +
      "Copie .env.example en .env, remplis les deux valeurs, " +
      "puis relance avec `npx expo start --clear`.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
