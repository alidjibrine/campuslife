import { useCallback, useEffect, useState } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import { listerConversations } from "@/lib/messages";
import { Colors, Polices } from "@/constants/theme";

/**
 * Les cinq onglets.
 *
 * La couleur active change d'un onglet à l'autre, et ce n'est pas une
 * fantaisie : bleu pour ce qui m'appartient, vert pour ce que je partage.
 * L'étudiant apprend la règle du produit rien qu'en naviguant.
 *
 * Le compteur de messages non lus se rafraîchit tout seul : on écoute les
 * insertions dans la table des messages, les règles d'accès de la base ne
 * laissant passer que les conversations dont on fait partie.
 */
export default function OngletsLayout() {
  const [nonLus, setNonLus] = useState(0);

  const compter = useCallback(async () => {
    try {
      const liste = await listerConversations();
      setNonLus(liste.reduce((somme, c) => somme + c.nonLus, 0));
    } catch {
      // Un compteur absent vaut mieux qu'un écran en erreur.
    }
  }, []);

  useEffect(() => {
    compter();
    const canal = supabase
      .channel("compteur-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        compter();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [compter]);

  return (
    <Tabs
      initialRouteName="qg"
      screenOptions={{
        headerShown: false,
        tabBarInactiveTintColor: Colors.neutre.discret,
        tabBarStyle: {
          backgroundColor: Colors.neutre.surface,
          borderTopColor: Colors.neutre.traitDoux,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: Polices.corpsFort,
          fontSize: 10.5,
          letterSpacing: 0.1,
          marginTop: 2,
        },
        tabBarBadgeStyle: {
          backgroundColor: Colors.etat.erreur,
          fontFamily: Polices.corpsGras,
          fontSize: 10.5,
          minWidth: 18,
          height: 18,
          lineHeight: 14,
        },
      }}
    >
      <Tabs.Screen
        name="qg"
        options={{
          title: "Mon QG",
          tabBarActiveTintColor: Colors.prive.base,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "today" : "today-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="etudes"
        options={{
          title: "Études",
          tabBarActiveTintColor: Colors.prive.base,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "book" : "book-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="communaute"
        options={{
          title: "Communauté",
          tabBarActiveTintColor: Colors.social.base,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarActiveTintColor: Colors.social.base,
          tabBarBadge: nonLus > 0 ? (nonLus > 99 ? "99+" : nonLus) : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "chatbubble" : "chatbubble-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarActiveTintColor: Colors.prive.base,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
