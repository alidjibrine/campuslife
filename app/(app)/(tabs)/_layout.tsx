import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

/**
 * Les cinq onglets de CampusLife.
 *
 * Mon QG et Etudes sont l'espace prive, Communaute et Messages forment
 * l'espace social.
 * L'ordre suit celui du diagramme de cadrage : ce que je garde d'abord,
 * ce que je partage ensuite.
 */
export default function OngletsLayout() {
  return (
    <Tabs
      initialRouteName="qg"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.prive.fonce,
        tabBarInactiveTintColor: Colors.neutre.discret,
        tabBarStyle: {
          backgroundColor: Colors.neutre.surface,
          borderTopColor: Colors.neutre.trait,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="qg"
        options={{
          title: "Mon QG",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="today-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="etudes"
        options={{
          title: "Études",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="communaute"
        options={{
          title: "Communauté",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
