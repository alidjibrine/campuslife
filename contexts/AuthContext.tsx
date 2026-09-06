import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/**
 * Contexte d'authentification de CampusLife.
 *
 * Garde l'etat de session au meme endroit et l'expose partout via useAuth().
 * S'abonne aux changements d'authentification de Supabase pour rester a jour
 * en cas de connexion, de deconnexion ou de rafraichissement de jeton.
 */

type ValeurAuth = {
  session: Session | null;
  utilisateur: User | null;
  chargement: boolean;
  deconnexion: () => Promise<void>;
};

const AuthContext = createContext<ValeurAuth | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let monte = true;

    // Session existante au demarrage : l'etudiant qui rouvre l'app
    // ne doit pas avoir a se reconnecter.
    supabase.auth.getSession().then(({ data }) => {
      if (!monte) return;
      setSession(data.session);
      setChargement(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evenement, nouvelleSession) => {
      setSession(nouvelleSession);
      setChargement(false);
    });

    return () => {
      monte = false;
      subscription.unsubscribe();
    };
  }, []);

  const deconnexion = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        utilisateur: session?.user ?? null,
        chargement,
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
    throw new Error("useAuth doit etre utilise a l'interieur d'un AuthProvider");
  }
  return contexte;
}
