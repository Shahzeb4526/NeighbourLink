import { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Switch,
} from "react-native";

const settingsSections = [
  {
    title: "Notifications",
    items: [
      { id: "push", label: "Push notifications", toggle: true },
      { id: "email", label: "Email notifications", toggle: true },
      { id: "messages", label: "Message alerts", toggle: true },
    ],
  },
  {
    title: "Privacy & Security",
    items: [
      { id: "profile", label: "Profile visibility", toggle: false },
      { id: "reviews", label: "Show my reviews", toggle: true },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "help", label: "Help & FAQ", action: true },
      { id: "terms", label: "Terms of Service", action: true },
      { id: "privacy", label: "Privacy Policy", action: true },
    ],
  },
];

export default function SettingsScreen({ onClose }) {
  const [toggles, setToggles] = useState({
    push: true,
    email: true,
    messages: true,
    profile: false,
    reviews: true,
  });

  const handleToggle = (id) => {
    setToggles((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const handleAction = (id) => {
    const messages = {
      help: "Help & FAQ page would load here.",
      terms: "Terms of Service page would load here.",
      privacy: "Privacy Policy page would load here.",
    };
    Alert.alert("Info", messages[id] || "Coming soon.");
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={onClose}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
            <View style={styles.backButton} />
          </View>

          {settingsSections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.settingRow,
                    index === section.items.length - 1 && styles.settingRowLast,
                  ]}
                  activeOpacity={item.action ? 0.7 : 1}
                  onPress={() => item.action && handleAction(item.id)}
                >
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  {item.toggle ? (
                    <Switch
                      value={toggles[item.id] || false}
                      onValueChange={() => handleToggle(item.id)}
                      trackColor={{ false: "#E5E7EB", true: "#A3D977" }}
                      thumbColor="#56A64B"
                    />
                  ) : item.action ? (
                    <Text style={styles.settingArrow}>›</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    paddingTop: Platform.select({ android: 12, ios: 0, default: 0 }),
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  backButton: {
    width: 60,
  },
  backText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  settingRowLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  settingArrow: {
    fontSize: 18,
    color: "#6B7280",
  },
});
