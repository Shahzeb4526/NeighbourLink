import { useEffect, useMemo, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import {
  Alert,
  Modal,
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Platform,
  TextInput,
} from "react-native";

const initialBorrowedItems = [];

const navItems = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "loan", label: "My Loan", icon: "📦" },
  { id: "messages", label: "Messages", icon: "💬" },
  { id: "community", label: "Community", icon: "👥" },
  { id: "profile", label: "Profile", icon: "👤" },
];

const categoryOptions = ["Tools", "Garden", "Electronic", "Other"];

export default function MyItemsScreen({
  activeTab = "loan",
  onNavigate,
  myItemsData,
  onAddItem,
  onDeleteItem,
  incomingBorrowRequests = [],
  onApproveBorrowRequest,
  onDeclineBorrowRequest,
  userId,
}) {
  const [itemsTab, setItemsTab] = useState("my");
  const [myItems, setMyItems] = useState([]);
  const [borrowedItems, setBorrowedItems] = useState(initialBorrowedItems);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  const [editItem, setEditItem] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDue, setEditDue] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateTarget, setDateTarget] = useState("add");
  const [pickerDate, setPickerDate] = useState(new Date());

  const storageKey = `my_items_${userId}`;

  const activeItems = useMemo(
    () => (itemsTab === "borrowed" ? borrowedItems : myItems),
    [itemsTab, borrowedItems, myItems],
  );

  useEffect(() => {
    const loadMyItems = async () => {
      if (!userId) {
        setMyItems([]);
        setIsStorageLoaded(true);
        return;
      }

      if (Array.isArray(myItemsData)) {
        setMyItems(myItemsData);
        setIsStorageLoaded(true);
        return;
      }

      try {
        const savedItems = await AsyncStorage.getItem(storageKey);

        if (savedItems) {
          const parsed = JSON.parse(savedItems);
          if (Array.isArray(parsed)) {
            setMyItems(parsed);
          } else {
            setMyItems([]);
          }
        } else {
          setMyItems([]);
        }
      } catch (error) {
        console.log("Failed to load items:", error);
        setMyItems([]);
      } finally {
        setIsStorageLoaded(true);
      }
    };

    loadMyItems();
  }, [storageKey, myItemsData]);

  useEffect(() => {
    if (!isStorageLoaded || !userId) {
      return;
    }

    const saveMyItems = async () => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(myItems));
      } catch (error) {
        console.log("Failed to save items:", error);
      }
    };

    saveMyItems();
  }, [myItems, storageKey, isStorageLoaded]);

  const formatDue = (date) => {
    const formatted = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `Due back: ${formatted}`;
  };

  const resetAddForm = () => {
    setNewTitle("");
    setNewCategory("");
    setNewDue("");
    setNewImage(null);
    setPickerDate(new Date());
    setShowDatePicker(false);
    setShowCategoryPicker(false);
    setDateTarget("add");
  };

  const closeEditModal = () => {
    setEditItem(null);
    setEditTitle("");
    setEditCategory("");
    setEditDue("");
    setShowDatePicker(false);
    setDateTarget("add");
  };

  const openDatePicker = (target) => {
    setDateTarget(target);
    setShowDatePicker(true);
  };

  const handleDateChange = (_, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (!selectedDate) {
      return;
    }

    setPickerDate(selectedDate);
    const dueLabel = formatDue(selectedDate);

    if (dateTarget === "edit") {
      setEditDue(dueLabel);
    } else {
      setNewDue(dueLabel);
    }
  };

  const handleAddItem = () => {
    resetAddForm();
    setIsAddOpen(true);
  };

  const selectAddCategory = (category) => {
    setNewCategory(category);
    setShowCategoryPicker(false);
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to upload item photos.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    if (asset.base64) {
      const mime = asset.mimeType || "image/jpeg";
      setNewImage(`data:${mime};base64,${asset.base64}`);
      return;
    }

    setNewImage(asset.uri || null);
  };

  const handleEditItem = (item) => {
    setEditItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditDue(item.due || "");
    setShowDatePicker(false);
    setDateTarget("edit");

    if (item.due) {
      const rawDate = item.due.replace("Due back: ", "");
      const parsed = new Date(rawDate);

      if (!Number.isNaN(parsed.getTime())) {
        setPickerDate(parsed);
      } else {
        setPickerDate(new Date());
      }
    } else {
      setPickerDate(new Date());
    }
  };

  const handleSaveEdit = () => {
    if (!editItem) {
      return;
    }

    const updated = {
      ...editItem,
      title: editTitle.trim() || editItem.title,
      category: editCategory.trim() || editItem.category,
      status: editDue.trim() ? "On Loan" : "Available",
      ...(editDue.trim() ? { due: editDue.trim() } : {}),
    };

    if (!editDue.trim()) {
      delete updated.due;
    }

    if (itemsTab === "borrowed") {
      setBorrowedItems((current) =>
        current.map((item) => (item.id === editItem.id ? updated : item)),
      );
    } else {
      setMyItems((current) =>
        current.map((item) => (item.id === editItem.id ? updated : item)),
      );
    }

    closeEditModal();
  };

  const handleSaveNewItem = async () => {
    if (!newTitle.trim()) {
      Alert.alert("Missing title", "Please enter an item title.");
      return;
    }

    const draftItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      category: newCategory.trim() || "Other",
      status: newDue.trim() ? "On Loan" : "Available",
      image: newImage,
      ...(newDue.trim() ? { due: newDue.trim() } : {}),
    };

    let itemToSave = draftItem;

    if (typeof onAddItem === "function") {
      try {
        const result = await onAddItem(draftItem);
        if (result && typeof result === "object") {
          itemToSave = {
            ...draftItem,
            ...result,
          };
        }
      } catch (error) {
        console.log("onAddItem failed:", error);
        Alert.alert(
          "Save failed",
          "Could not save this item to backend. Please try again.",
        );
        return;
      }
    }

    setMyItems((current) => {
      const withoutDuplicate = current.filter(
        (entry) => entry.id !== itemToSave.id,
      );
      return [itemToSave, ...withoutDuplicate];
    });
    setItemsTab("my");
    setIsAddOpen(false);
    resetAddForm();
  };

  const handleDeleteItem = (item) => {
    Alert.alert("Delete Item", `Delete ${item.title}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (itemsTab === "my" && typeof onDeleteItem === "function") {
            try {
              await onDeleteItem(item.id);
            } catch (error) {
              console.log("onDeleteItem failed:", error);
              Alert.alert(
                "Delete failed",
                "Could not delete this item from backend. Please try again.",
              );
              return;
            }
          }

          if (itemsTab === "borrowed") {
            setBorrowedItems((current) =>
              current.filter((entry) => entry.id !== item.id),
            );
          } else {
            setMyItems((current) =>
              current.filter((entry) => entry.id !== item.id),
            );
          }
        },
      },
    ]);
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await onApproveBorrowRequest?.(requestId);
      Alert.alert("Approved", "Borrow request approved.");
    } catch (error) {
      Alert.alert(
        "Approval failed",
        error?.message || "Unable to approve request.",
      );
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await onDeclineBorrowRequest?.(requestId);
      Alert.alert("Declined", "Borrow request declined.");
    } catch (error) {
      Alert.alert(
        "Decline failed",
        error?.message || "Unable to decline request.",
      );
    }
  };

  if (!isStorageLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingText}>Loading items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>My Items</Text>

            <TouchableOpacity
              style={styles.addButton}
              activeOpacity={0.8}
              onPress={handleAddItem}
            >
              <Text style={styles.addIcon}>＋</Text>
              <Text style={styles.addText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                itemsTab === "my" && styles.segmentButtonActive,
              ]}
              onPress={() => setItemsTab("my")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  itemsTab === "my" && styles.segmentTextActive,
                ]}
              >
                My Items ({myItems.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentButton,
                itemsTab === "borrowed" && styles.segmentButtonActive,
              ]}
              onPress={() => setItemsTab("borrowed")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  itemsTab === "borrowed" && styles.segmentTextActive,
                ]}
              >
                Borrowed ({borrowedItems.length})
              </Text>
            </TouchableOpacity>
          </View>

          {itemsTab === "my" && incomingBorrowRequests.length ? (
            <View style={styles.requestsSection}>
              <Text style={styles.requestsTitle}>Borrow requests</Text>
              {incomingBorrowRequests.map((request) => {
                const isPending =
                  String(request?.status || "").toLowerCase() === "pending";
                const statusText = String(request?.status || "pending");
                return (
                  <View key={String(request.id)} style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                      <Text style={styles.requestItemTitle}>
                        {request.itemTitle || "Item"}
                      </Text>
                      <View
                        style={[
                          styles.requestStatusBadge,
                          isPending
                            ? styles.requestPendingBadge
                            : styles.requestDoneBadge,
                        ]}
                      >
                        <Text style={styles.requestStatusText}>
                          {statusText}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.requestMeta}>
                      Requester:{" "}
                      {String(request.borrowerUserId || "Unknown").slice(0, 8)}
                    </Text>
                    <Text style={styles.requestMeta}>
                      {request.requestedStartDate || "-"} to{" "}
                      {request.requestedEndDate || "-"}
                    </Text>

                    {isPending ? (
                      <View style={styles.requestActionsRow}>
                        <TouchableOpacity
                          style={styles.requestApproveButton}
                          activeOpacity={0.8}
                          onPress={() => handleApproveRequest(request.id)}
                        >
                          <Text style={styles.requestApproveText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.requestDeclineButton}
                          activeOpacity={0.8}
                          onPress={() => handleDeclineRequest(request.id)}
                        >
                          <Text style={styles.requestDeclineText}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : null}

          <FlatList
            data={activeItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View style={styles.imageWrapper}>
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.image}
                      />
                    ) : (
                      <Text style={styles.placeholderIcon}>🖼️</Text>
                    )}
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.category}</Text>
                    {item.due ? (
                      <Text style={styles.dueText}>{item.due}</Text>
                    ) : null}
                  </View>

                  <View style={styles.statusBadgeWrap}>
                    <View
                      style={[
                        styles.statusBadge,
                        item.status === "Available"
                          ? styles.statusAvailable
                          : styles.statusOnLoan,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          item.status === "Available"
                            ? styles.statusTextAvailable
                            : styles.statusTextOnLoan,
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    activeOpacity={0.8}
                    onPress={() => handleEditItem(item)}
                  >
                    <Text style={styles.actionIcon}>✎</Text>
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    activeOpacity={0.8}
                    onPress={() => handleDeleteItem(item)}
                  >
                    <Text style={[styles.actionIcon, styles.deleteIcon]}>
                      🗑️
                    </Text>
                    <Text style={[styles.actionText, styles.deleteText]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>

        <Modal
          visible={!!editItem}
          transparent
          animationType="fade"
          onRequestClose={closeEditModal}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Edit item</Text>

              <Text style={styles.modalLabel}>Title</Text>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                style={styles.modalInput}
                placeholder="Item title"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.modalLabel}>Category</Text>
              <TextInput
                value={editCategory}
                onChangeText={setEditCategory}
                style={styles.modalInput}
                placeholder="Category"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.modalLabel}>Due back (optional)</Text>
              <View style={styles.dateRow}>
                <Text style={styles.dateText}>
                  {editDue || "Select a date"}
                </Text>

                <TouchableOpacity
                  style={styles.dateButton}
                  activeOpacity={0.8}
                  onPress={() => openDatePicker("edit")}
                >
                  <Text style={styles.dateButtonText}>Calendar</Text>
                </TouchableOpacity>
              </View>

              {showDatePicker &&
              Platform.OS === "ios" &&
              dateTarget === "edit" ? (
                <View style={styles.inlinePickerWrap}>
                  <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display="inline"
                    onChange={handleDateChange}
                  />
                  <TouchableOpacity
                    style={styles.pickerDoneButton}
                    activeOpacity={0.8}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.pickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.secondaryAction}
                  activeOpacity={0.8}
                  onPress={closeEditModal}
                >
                  <Text style={styles.secondaryActionText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryAction}
                  activeOpacity={0.8}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.primaryActionText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={isAddOpen}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setIsAddOpen(false);
            setShowDatePicker(false);
          }}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Add item</Text>

              <Text style={styles.modalLabel}>Title</Text>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                style={styles.modalInput}
                placeholder="Item title"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.modalLabel}>Category</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                activeOpacity={0.8}
                onPress={() => setShowCategoryPicker((current) => !current)}
              >
                <Text
                  style={[
                    styles.dropdownButtonText,
                    !newCategory && styles.dropdownPlaceholderText,
                  ]}
                >
                  {newCategory || "Select category"}
                </Text>
                <Text style={styles.dropdownChevron}>▾</Text>
              </TouchableOpacity>

              {showCategoryPicker ? (
                <View style={styles.dropdownInlineList}>
                  {categoryOptions.map((category, index) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.dropdownInlineOption,
                        index === categoryOptions.length - 1 &&
                          styles.dropdownInlineOptionLast,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => selectAddCategory(category)}
                    >
                      <Text style={styles.dropdownOptionText}>{category}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              <Text style={styles.modalLabel}>Photo (optional)</Text>
              <TouchableOpacity
                style={styles.photoPickerButton}
                activeOpacity={0.8}
                onPress={handlePickImage}
              >
                <Text style={styles.photoPickerButtonText}>
                  {newImage ? "Change photo" : "Upload photo"}
                </Text>
              </TouchableOpacity>

              {newImage ? (
                <View style={styles.previewWrap}>
                  <Image
                    source={{ uri: newImage }}
                    style={styles.previewImage}
                  />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    activeOpacity={0.8}
                    onPress={() => setNewImage(null)}
                  >
                    <Text style={styles.removePhotoText}>Remove photo</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <Text style={styles.modalLabel}>Due back (optional)</Text>
              <View style={styles.dateRow}>
                <Text style={styles.dateText}>{newDue || "Select a date"}</Text>

                <TouchableOpacity
                  style={styles.dateButton}
                  activeOpacity={0.8}
                  onPress={() => openDatePicker("add")}
                >
                  <Text style={styles.dateButtonText}>Calendar</Text>
                </TouchableOpacity>
              </View>

              {showDatePicker &&
              Platform.OS === "ios" &&
              dateTarget === "add" ? (
                <View style={styles.inlinePickerWrap}>
                  <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display="inline"
                    onChange={handleDateChange}
                  />
                  <TouchableOpacity
                    style={styles.pickerDoneButton}
                    activeOpacity={0.8}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.pickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.secondaryAction}
                  activeOpacity={0.8}
                  onPress={() => {
                    setIsAddOpen(false);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.secondaryActionText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryAction}
                  activeOpacity={0.8}
                  onPress={handleSaveNewItem}
                >
                  <Text style={styles.primaryActionText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {showDatePicker && Platform.OS === "android" ? (
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        ) : null}
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
  loadingScreen: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
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
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addIcon: {
    color: "#FFFFFF",
    marginRight: 6,
  },
  addText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  dropdownButton: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  dropdownPlaceholderText: {
    color: "#9CA3AF",
  },
  dropdownChevron: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
  },
  dropdownInlineList: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    marginTop: -2,
    marginBottom: 10,
    overflow: "hidden",
  },
  dropdownInlineOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownInlineOptionLast: {
    borderBottomWidth: 0,
  },
  dropdownOptionText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  photoPickerButton: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#A5D6A7",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  photoPickerButtonText: {
    color: "#2E7D32",
    fontSize: 14,
    fontWeight: "600",
  },
  previewWrap: {
    marginBottom: 12,
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    marginBottom: 8,
  },
  removePhotoButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  removePhotoText: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "600",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#EDEDED",
    borderRadius: 20,
    padding: 4,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: "center",
  },
  segmentButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  segmentTextActive: {
    color: "#111827",
  },
  listContent: {
    paddingBottom: 20,
  },
  requestsSection: {
    marginBottom: 14,
  },
  requestsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  requestCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  requestItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  requestMeta: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  requestStatusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  requestPendingBadge: {
    backgroundColor: "#FEF3C7",
  },
  requestDoneBadge: {
    backgroundColor: "#E5E7EB",
  },
  requestStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111827",
    textTransform: "capitalize",
  },
  requestActionsRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  requestApproveButton: {
    flex: 1,
    backgroundColor: "#DCFCE7",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    marginRight: 6,
  },
  requestApproveText: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "700",
  },
  requestDeclineButton: {
    flex: 1,
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    marginLeft: 6,
  },
  requestDeclineText: {
    color: "#991B1B",
    fontSize: 13,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageWrapper: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderIcon: {
    fontSize: 22,
    color: "#9CA3AF",
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  dueText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
  },
  statusBadgeWrap: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 12,
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
  actionRow: {
    flexDirection: "row",
    marginTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 10,
    backgroundColor: "#FFFFFF",
  },
  actionIcon: {
    marginRight: 6,
    fontSize: 12,
    color: "#111827",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  deleteButton: {
    borderColor: "#FCA5A5",
  },
  deleteIcon: {
    color: "#EF4444",
  },
  deleteText: {
    color: "#EF4444",
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#111827",
    fontSize: 14,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateText: {
    color: "#111827",
    fontSize: 14,
  },
  dateButton: {
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dateButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  inlinePickerWrap: {
    marginTop: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 10,
  },
  modalActionsRow: {
    flexDirection: "row",
    marginTop: 16,
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
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  pickerDoneButton: {
    marginTop: 12,
    alignSelf: "flex-end",
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pickerDoneText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
