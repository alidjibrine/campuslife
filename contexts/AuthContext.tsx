import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import * as Linking from "expo-linking";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/**
 * Contexte d'authentification de CampusLife.
 *
 * Garde l'état de session au même endroit et l'expose partout via useAuth().
 * S'abonne aux changements d'authentification de Supabase pour rester à jour
 * en cas de connexion, de déconnexion ou de rafraîchissement de jeton.
 *
 * Il gère aussi les liens reçus par courriel. Sur mobile, la bibliothèque
 * Supabase ne lit pas l'adresse toute seule : c'est à l'app d'attraper le lien,
 * d'en extraire les jetons et d'ouvrir la session. Sans ce bout de code, le
 * lien de réinitialisation ouvre l'app et il ne se passe rien.
 */

type ValeurAuth = {
  session: Session | null;
  utilisateur: User | null;
  chargement: boolean;
  /** Vrai entre le clic sur le lien de réinitialisation et le nouveau mot de passe. */
  modeRecuperation: boolean;
  finirRecuperation: () => void;
  deconnexion: () => Promise<void>;
};

const AuthContext = createContext<ValeurAuth | undefined>(undefined);

/** Lit les paramètres d'une adresse, qu'ils soient après ? ou après #. */
function parametres(url: string): Record<string, string> {
  const table: Record<string, string> = {};
  for (const separateur of ["#", "?"]) {
    const index = url.indexOf(separateur);
    if (index < 0) continue;
    for (const couple of url.slice(index + 1).split("&")) {
      const [cle, valeur] = couple.split("=");
      if (cle && valeur) table[decodeURIComponent(cle)] = decodeURIComponent(valeur);
    }
  }
  return table;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [chargement, setChargement] = useState(true);
  const [modeRecuperation, setModeRecuperation] = useState(false);

  const traiterLien = useCallback(async (url: string | null) => {
    if (!url) return;
    const p = parametres(url);

    try {
      if (p.access_token && p.refresh_token) {
        await supabase.auth.setSession({
          access_token: p.access_token,
          refresh_token: p.refresh_token,
        });
      } else if (p.code) {
        await supabase.auth.exchangeCodeForSession(p.code);
      } else {
        return;
      }
      if (p.type === "recovery") setModeRecuperation(true);
    } catch {
      // Un lien expiré ou déjà utilisé ne doit pas faire planter l'app :
      // l'étudiant reste sur l'écran de connexion et peut en redemander un.
    }
  }, []);

  useEffect(() => {
    let monte = true;

    // Session existante au démarrage : l'étudiant qui rouvre l'app
    // ne doit pas avoir à se reconnecter.
    supabase.auth.getSession().then(({ data }) => {
      if (!monte) return;
      setSession(data.session);
      setChargement(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evenement, nouvelleSession) => {
      setSession(nouvelleSession);
      setChargement(false);
      if (evenement === "PASSWORD_RECOVERY") setModeRecuperation(true);
      if (evenement === "SIGNED_OUT") setModeRecuperation(false);
    });

    // Le lien qui a ouvert l'app, puis ceux reçus pendant qu'elle tourne.
    Linking.getInitialURL().then(traiterLien);
    const ecoute = Linking.addEventListener("url", ({ url }) => traiterLien(url));

    return () => {
      monte = false;
      subscription.unsubscribe();
      ecoute.remove();
    };
  }, [traiterLien]);

  const deconnexion = async () => {
    setModeRecuperation(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        utilisateur: session?.user ?? null,
        chargement,
        modeRecuperation,
        finirRecuperation: () => setModeRecuperation(false),
        deconnexion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexte = useContext(AuthContext);
  if (contexte === undefined) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return contexte;
}
