import { useState } from "react";
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from "react-native";

const stats = [
  { id: "neighbors", label: "Neighbours", value: "47", icon: "👥" },
  { id: "shared", label: "Items Shared", value: "156", icon: "📈" },
  { id: "rating", label: "Avg Rating", value: "4.8", icon: "⭐" },
];

const neighbors = [
  {
    id: "1",
    name: "Sayed Shah",
    distance: "0.2 miles away",
    shared: "12 items shared",
    update: "Just lent out a cordless drill to Alex",
    rating: "4.9",
    initials: "SS",
  },
  {
    id: "2",
    name: "Maheen Rizwan",
    distance: "0.4 miles away",
    shared: "8 items shared",
    update: "Returned your lawn mower this morning",
    rating: "4.7",
    initials: "MR",
  },
  {
    id: "3",
    name: "Fahad Al Faysal",
    distance: "0.6 miles away",
    shared: "15 items shared",
    update: "Shared camping stove for weekend trip",
    rating: "4.8",
    initials: "FA",
  },
  {
    id: "4",
    name: "Mirza Ahmad",
    distance: "0.9 miles away",
    shared: "6 items shared",
    update: "Organizing a neighbourhood clean-up",
    rating: "4.6",
    initials: "MA",
  },
  {
    id: "5",
    name: "Isbah Rashid",
    distance: "1.1 miles away",
    shared: "10 items shared",
    update: "Offering ladder for roof repairs",
    rating: "4.9",
    initials: "IR",
  },
];

const navItems = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "loan", label: "My Loan", icon: "📦" },
  { id: "messages", label: "Messages", icon: "💬" },
  { id: "community", label: "Community", icon: "👥" },
  { id: "profile", label: "Profile", icon: "👤" },
];

export default function CommunityScreen({
  activeTab = "community",
  onNavigate,
}) {
  const [selectedNeighbor, setSelectedNeighbor] = useState(null);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={neighbors}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerSection}>
              <Text style={styles.headerTitle}>Community</Text>
              <Text style={styles.headerSubtitle}>
                Connect with neighbours in your area
              </Text>

              <View style={styles.statsRow}>
                {stats.map((stat) => (
                  <View key={stat.id} style={styles.statCard}>
                    <Text style={styles.statIcon}>{stat.icon}</Text>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Active Neighbours</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.neighborCard}>
              <View style={styles.neighborHeader}>
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatarInitials}>
                    {item.initials || item.name?.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.neighborInfo}>
                  <Text style={styles.neighborName}>{item.name}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>📍 {item.distance}</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.metaText}> {item.shared}</Text>
                  </View>
                </View>
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingStar}>⭐</Text>
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              </View>

              <Text style={styles.updateText}>{item.update}</Text>

              <TouchableOpacity
                style={styles.profileButton}
                activeOpacity={0.8}
                onPress={() => setSelectedNeighbor(item)}
              >
                <Text style={styles.profileButtonText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />

        <Modal
          visible={!!selectedNeighbor}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedNeighbor(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              {selectedNeighbor ? (
                <>
                  <View style={styles.modalAvatarWrap}>
                    <Text style={styles.modalAvatarInitials}>
                      {selectedNeighbor.initials ||
                        selectedNeighbor.name?.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>

                  <Text style={styles.modalName}>{selectedNeighbor.name}</Text>
                  <Text style={styles.modalSubtext}>
                    {selectedNeighbor.distance}
                  </Text>

                  <View style={styles.modalStatsRow}>
                    <View style={styles.modalStatChip}>
                      <Text style={styles.modalStatValue}>
                        {selectedNeighbor.shared}
                      </Text>
                      <Text style={styles.modalStatLabel}>Shared</Text>
                    </View>
                    <View style={styles.modalStatChip}>
                      <Text style={styles.modalStatValue}>
                        ⭐ {selectedNeighbor.rating}
                      </Text>
                      <Text style={styles.modalStatLabel}>Rating</Text>
                    </View>
                  </View>

                  <Text style={styles.modalSectionTitle}>Recent update</Text>
                  <Text style={styles.modalBodyText}>
                    {selectedNeighbor.update}
                  </Text>

                  <Text style={styles.modalSectionTitle}>About</Text>
                  <Text style={styles.modalBodyText}>
                    Active neighbour in your local community. You can message
                    them from the Messages tab.
                  </Text>

                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    activeOpacity={0.8}
                    onPress={() => setSelectedNeighbor(null)}
                  >
                    <Text style={styles.modalCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>
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
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },
  statsRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statIcon: {
    fontSize: 18,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  sectionTitle: {
    marginTop: 18,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  neighborCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  neighborHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E5EDFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontWeight: "700",
    color: "#1D4ED8",
  },
  neighborInfo: {
    flex: 1,
    marginLeft: 12,
  },
  neighborName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
  },
  metaDot: {
    marginHorizontal: 6,
    color: "#D1D5DB",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingStar: {
    color: "#FACC15",
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  updateText: {
    marginTop: 10,
    fontSize: 13,
    color: "#6B7280",
  },
  profileButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  profileButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
  },
  modalAvatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#E5EDFF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 14,
  },
  modalAvatarInitials: {
    color: "#1D4ED8",
    fontSize: 22,
    fontWeight: "700",
  },
  modalName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  modalSubtext: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  modalStatsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    marginBottom: 12,
  },
  modalStatChip: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalStatValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  modalStatLabel: {
    marginTop: 4,
    fontSize: 11,
    color: "#6B7280",
  },
  modalSectionTitle: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  modalBodyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: "#4B5563",
  },
  modalCloseButton: {
    marginTop: 18,
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
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
