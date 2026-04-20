import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";

const categories = [
  { id: "tools", label: "Tools", icon: "🛠️" },
  { id: "garden", label: "Garden", icon: "🌿" },
  { id: "electronic", label: "Electronic", icon: "⚡" },
];

const navItems = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "loan", label: "My Loan", icon: "📦" },
  { id: "messages", label: "Messages", icon: "💬" },
  { id: "community", label: "Community", icon: "👥" },
  { id: "profile", label: "Profile", icon: "👤" },
];

export default function HomeScreen({
  activeTab = "home",
  onNavigate,
  onMessageOwner,
  onSendBorrowRequest,
  listingsData,
  borrowRequestsData,
  savedItemsData,
  onToggleSaveItem,
  currentUser,
}) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const requestStatusByItemId = useMemo(() => {
    const map = new Map();
    (borrowRequestsData || []).forEach((request) => {
      const itemId = String(request?.item_id || request?.itemId || "");
      if (!itemId) {
        return;
      }
      const status = String(request?.status || "pending").toLowerCase();
      const createdAt = new Date(
        request?.created_at || request?.createdAt || 0,
      ).getTime();
      const existing = map.get(itemId);
      if (!existing || createdAt > existing.createdAt) {
        map.set(itemId, { status, createdAt });
      }
    });
    return map;
  }, [borrowRequestsData]);

  const filteredListings = useMemo(() => {
    const sourceListings = Array.isArray(listingsData) ? listingsData : [];

    const visibleListings = currentUser?.id
      ? sourceListings.filter(
          (item) => String(item?.ownerId || "") !== String(currentUser.id),
        )
      : sourceListings;

    if (!selectedCategory) {
      return visibleListings;
    }
    return visibleListings.filter((item) => item.category === selectedCategory);
  }, [selectedCategory, listingsData, currentUser?.id]);

  const handleCategoryPress = (categoryId) => {
    setSelectedCategory((current) =>
      current === categoryId ? null : categoryId,
    );
  };

  const handleListingPress = (item) => {
    setSelectedItem(item);
  };

  const handleMessageOwner = () => {
    if (!selectedItem?.threadId) {
      return;
    }
    onMessageOwner?.(selectedItem.threadId, {
      resetThread: true,
      contact: {
        name: selectedItem.owner,
        subject: selectedItem.title,
        userId: selectedItem.ownerId || null,
      },
    });
    setSelectedItem(null);
  };

  const getListingState = (item) => {
    const request = requestStatusByItemId.get(String(item?.id || ""));
    const availability = String(
      item?.availabilityStatus || "available",
    ).toLowerCase();

    if (availability === "on_loan") {
      return { label: "On loan", key: "on_loan", canRequest: false };
    }
    if (request?.status === "pending") {
      return { label: "Request sent", key: "pending", canRequest: false };
    }
    if (request?.status === "approved") {
      return { label: "On loan", key: "approved", canRequest: false };
    }

    return { label: "Available", key: "available", canRequest: true };
  };

  const isFavorited = (itemId) =>
    Array.isArray(savedItemsData) &&
    savedItemsData.some((item) => item.id === itemId);

  const handleRent = async () => {
    if (!selectedItem) {
      return;
    }

    const state = getListingState(selectedItem);
    if (!state.canRequest) {
      Alert.alert(
        "Not available",
        `This item is currently ${state.label.toLowerCase()}.`,
      );
      return;
    }

    try {
      await onSendBorrowRequest?.(selectedItem);
      Alert.alert(
        "Request sent",
        "Your borrow request has been sent to the owner.",
      );
    } catch (error) {
      Alert.alert(
        "Request failed",
        error?.message || "Unable to send request.",
      );
    }
  };

  const toggleFavorite = () => {
    if (!selectedItem) {
      return;
    }
    onToggleSaveItem?.(selectedItem);
  };

  const handleSeeAll = () => {
    setSelectedCategory(null);
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>NeighbourLink</Text>
            <TouchableOpacity style={styles.profileButton} activeOpacity={0.7}>
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Browse by category</Text>
          <View style={styles.categoryRow}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.categoryCardActive,
                ]}
                activeOpacity={0.8}
                onPress={() => handleCategoryPress(category.id)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Available nearby</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              activeOpacity={0.7}
              onPress={handleSeeAll}
            >
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={filteredListings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listingCard}
                activeOpacity={0.8}
                onPress={() => handleListingPress(item)}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.listingImage}
                />
                <View style={styles.listingText}>
                  <Text style={styles.listingTitle}>{item.title}</Text>
                  <Text style={styles.listingOwner}>{item.owner}</Text>
                  <Text style={styles.listingMeta}>
                    {item.price} • {item.distance}
                  </Text>
                </View>
                <View style={styles.listingRight}>
                  {(() => {
                    const state = getListingState(item);
                    const isAvailable = state.key === "available";
                    return (
                      <View
                        style={[
                          styles.statusBadge,
                          isAvailable
                            ? styles.statusAvailable
                            : styles.statusOnLoan,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            isAvailable
                              ? styles.statusTextAvailable
                              : styles.statusTextOnLoan,
                          ]}
                        >
                          {state.label}
                        </Text>
                      </View>
                    );
                  })()}
                  <Text style={styles.ratingText}>⭐ {item.rating}</Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listingList}
            showsVerticalScrollIndicator={false}
          />
        </View>

        <Modal
          visible={!!selectedItem}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedItem(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              {selectedItem ? (
                <>
                  <Image
                    source={{ uri: selectedItem.image }}
                    style={styles.modalImage}
                  />
                  <Text style={styles.modalTitle}>{selectedItem.title}</Text>
                  <Text style={styles.modalOwner}>
                    Shared by {selectedItem.owner}
                  </Text>
                  <Text style={styles.modalMeta}>
                    {selectedItem.price} • {selectedItem.distance} • ⭐
                    {selectedItem.rating}
                  </Text>

                  <View style={styles.modalActionsRow}>
                    <TouchableOpacity
                      style={styles.secondaryAction}
                      activeOpacity={0.8}
                      onPress={toggleFavorite}
                    >
                      <Text style={styles.secondaryActionText}>
                        {isFavorited(selectedItem.id) ? "★ Saved" : "☆ Save"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondaryAction}
                      activeOpacity={0.8}
                      onPress={() => Alert.alert("Shared", "Link copied.")}
                    >
                      <Text style={styles.secondaryActionText}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondaryAction}
                      activeOpacity={0.8}
                      onPress={handleMessageOwner}
                    >
                      <Text style={styles.secondaryActionText}>Message</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryAction,
                      !getListingState(selectedItem).canRequest &&
                        styles.primaryActionDisabled,
                    ]}
                    activeOpacity={0.8}
                    onPress={handleRent}
                    disabled={!getListingState(selectedItem).canRequest}
                  >
                    <Text style={styles.primaryActionText}>
                      {getListingState(selectedItem).canRequest
                        ? "Send borrow request"
                        : getListingState(selectedItem).label}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.closeButton}
                    activeOpacity={0.8}
                    onPress={() => setSelectedItem(null)}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFEFEF",
    alignItems: "center",
    justifyContent: "center",
  },
  profileIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  seeAllButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  seeAllText: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "600",
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  categoryCardActive: {
    borderWidth: 1,
    borderColor: "#2563EB",
  },
  categoryIcon: {
    fontSize: 22,
    marginBottom: 10,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  listingList: {
    paddingBottom: 20,
  },
  listingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  listingImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
  },
  listingText: {
    marginLeft: 12,
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  listingOwner: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  listingMeta: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
  },
  listingRight: {
    marginLeft: "auto",
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusAvailable: {
    backgroundColor: "#DFF5E1",
  },
  statusOnLoan: {
    backgroundColor: "#E5E7EB",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusTextAvailable: {
    color: "#2E7D32",
  },
  statusTextOnLoan: {
    color: "#6B7280",
  },
  ratingText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 6,
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
    height: 160,
    borderRadius: 14,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalOwner: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  modalMeta: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
  },
  modalActionsRow: {
    flexDirection: "row",
    marginTop: 14,
  },
  secondaryAction: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    marginRight: 8,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  primaryAction: {
    marginTop: 12,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryActionDisabled: {
    backgroundColor: "#9CA3AF",
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  closeButton: {
    marginTop: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
  },
});
