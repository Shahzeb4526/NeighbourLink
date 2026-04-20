import { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  Modal,
  Image,
} from "react-native";
import EditProfileScreen from "./EditProfileScreen";
import SettingsScreen from "./SettingsScreen";

const stats = [
  { id: "shared", label: "items shared", value: "12" },
  { id: "borrowed", label: "items borrowed", value: "8" },
  { id: "rating", label: "rating", value: "4.8" },
];

const menuItems = [
  { id: "edit", label: "Edit profile", icon: "👤" },
  { id: "items", label: "My items", icon: "📦" },
  { id: "messages", label: "Messages", icon: "💬" },
  { id: "settings", label: "Settings", icon: "⚙️" },
  { id: "signout", label: "Sign Out", icon: "🚪", danger: true },
];

const navItems = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "loan", label: "My Loan", icon: "📦" },
  { id: "messages", label: "Messages", icon: "💬" },
  { id: "community", label: "Community", icon: "👥" },
  { id: "profile", label: "Profile", icon: "👤" },
];

export default function ProfileScreen({
  activeTab = "profile",
  onNavigate,
  onSignOut,
  currentUser,
  savedItemsData,
  onUpdateProfile,
}) {
  const [selectedSavedItem, setSelectedSavedItem] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  const displayName =
    currentUser?.user_metadata?.full_name ||
    currentUser?.user_metadata?.name ||
    currentUser?.email?.split("@")[0] ||
    "My Profile";
  const displayEmail = currentUser?.email || "";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={menuItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => {
                if (item.id === "signout") {
                  onSignOut?.();
                } else if (item.id === "edit") {
                  setActiveModal("edit");
                } else if (item.id === "items") {
                  onNavigate?.("loan");
                } else if (item.id === "messages") {
                  onNavigate?.("messages");
                } else if (item.id === "settings") {
                  setActiveModal("settings");
                }
              }}
            >
              <View
                style={[
                  styles.menuIconWrap,
                  item.danger && styles.menuIconDanger,
                ]}
              >
                <Text
                  style={[
                    styles.menuIcon,
                    item.danger && styles.menuIconTextDanger,
                  ]}
                >
                  {item.icon}
                </Text>
              </View>
              <Text
                style={[
                  styles.menuLabel,
                  item.danger && styles.menuLabelDanger,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          ListHeaderComponent={
            <View style={styles.headerSection}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials || "U"}</Text>
              </View>
              <Text style={styles.nameText}>{displayName}</Text>
              <Text style={styles.emailText}>{displayEmail}</Text>

              <View style={styles.statsRow}>
                {stats.map((stat) => (
                  <View key={stat.id} style={styles.statBlock}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.savedWrap}>
                <Text style={styles.savedTitle}>
                  Saved items ({savedItemsData?.length || 0})
                </Text>
                {Array.isArray(savedItemsData) && savedItemsData.length ? (
                  savedItemsData.slice(0, 5).map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.savedRow}
                      activeOpacity={0.8}
                      onPress={() => setSelectedSavedItem(item)}
                    >
                      <Text style={styles.savedName}>
                        {item.title || "Item"}
                      </Text>
                      <Text style={styles.savedMeta}>
                        {item.price || ""}
                        {item.distance ? ` • ${item.distance}` : ""}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.savedEmpty}>
                    Save items from Home to see them here.
                  </Text>
                )}
              </View>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
        />

        <Modal
          visible={!!selectedSavedItem}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedSavedItem(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              {selectedSavedItem ? (
                <>
                  {selectedSavedItem.image ? (
                    <Image
                      source={{ uri: selectedSavedItem.image }}
                      style={styles.modalImage}
                    />
                  ) : (
                    <View style={styles.modalImagePlaceholder}>
                      <Text style={styles.modalPlaceholderIcon}>🖼️</Text>
                    </View>
                  )}
                  <Text style={styles.modalTitle}>
                    {selectedSavedItem.title || "Item"}
                  </Text>
                  <Text style={styles.modalOwner}>
                    Shared by {selectedSavedItem.owner || "Neighbour"}
                  </Text>
                  <Text style={styles.modalMeta}>
                    {selectedSavedItem.price || "£0/day"}
                    {selectedSavedItem.distance
                      ? ` • ${selectedSavedItem.distance}`
                      : ""}
                    {selectedSavedItem.rating
                      ? ` • ⭐${selectedSavedItem.rating}`
                      : ""}
                  </Text>

                  <TouchableOpacity
                    style={styles.closeButton}
                    activeOpacity={0.8}
                    onPress={() => setSelectedSavedItem(null)}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>
        </Modal>

        <Modal
          visible={activeModal === "edit"}
          animationType="slide"
          onRequestClose={() => setActiveModal(null)}
        >
          <EditProfileScreen
            currentUser={currentUser}
            onClose={() => setActiveModal(null)}
            onUpdateProfile={onUpdateProfile}
          />
        </Modal>

        <Modal
          visible={activeModal === "settings"}
          animationType="slide"
          onRequestClose={() => setActiveModal(null)}
        >
          <SettingsScreen onClose={() => setActiveModal(null)} />
        </Modal>
      </SafeAreaView>

      <View style={styles.bottomBar}>
        {navItems.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.bottomItem}
              activeOpacity={0.7}
              onPress={() => onNavigate?.(item.id)}
            >
              <Text
                style={[styles.bottomIcon, isActive && styles.bottomIconActive]}
              >
                {item.icon}
              </Text>
              <Text
                style={[
                  styles.bottomLabel,
                  isActive && styles.bottomLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  listContent: {
    paddingBottom: 20,
  },
  headerSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#6CC15B",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  nameText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  emailText: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },
  statsRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  savedWrap: {
    marginTop: 18,
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
  },
  savedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  savedRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  savedName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  savedMeta: {
    marginTop: 2,
    fontSize: 12,
    color: "#6B7280",
  },
  savedEmpty: {
    fontSize: 12,
    color: "#6B7280",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
  },
  modalImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  modalImagePlaceholder: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalPlaceholderIcon: {
    fontSize: 28,
    color: "#9CA3AF",
  },
  modalTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalOwner: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },
  modalMeta: {
    marginTop: 6,
    fontSize: 13,
    color: "#111827",
  },
  closeButton: {
    marginTop: 14,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  statBlock: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 16,
  },
  menuIconDanger: {
    backgroundColor: "#FEE2E2",
  },
  menuIconTextDanger: {
    color: "#EF4444",
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  menuLabelDanger: {
    color: "#EF4444",
  },
  separator: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
    paddingBottom: Platform.select({ ios: 12, android: 22, default: 12 }),
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bottomItem: {
    flex: 1,
    alignItems: "center",
  },
  bottomIcon: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  bottomIconActive: {
    color: "#2563EB",
  },
  bottomLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
  },
  bottomLabelActive: {
    color: "#2563EB",
    fontWeight: "600",
  },
});
