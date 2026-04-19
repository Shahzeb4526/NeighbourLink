import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from "react-native";

export default function EditProfileScreen({
  currentUser,
  onClose,
  onUpdateProfile,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState(
    currentUser?.user_metadata?.full_name ||
      currentUser?.user_metadata?.name ||
      currentUser?.email?.split("@")[0] ||
      "",
  );
  const [email, setEmail] = useState(currentUser?.email || "");
  const [location, setLocation] = useState(
    currentUser?.user_metadata?.location || "",
  );
  const [phone, setPhone] = useState(currentUser?.user_metadata?.phone || "");

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Missing name", "Please enter your full name.");
      return;
    }

    try {
      setIsSaving(true);
      const cleanEmail = email.trim();
      if (!cleanEmail) {
        Alert.alert("Missing email", "Please enter your email address.");
        return;
      }
      const profileData = {
        fullName: fullName.trim(),
        email: cleanEmail,
        location: location.trim(),
        phone: phone.trim(),
      };

      const result = await onUpdateProfile?.(profileData);

      if (
        result?.emailChanged &&
        result?.emailUpdated === false &&
        result?.emailError
      ) {
        Alert.alert(
          "Profile updated",
          `Your profile details were saved, but email could not be changed: ${result.emailError}`,
        );
        onClose?.();
        return;
      }

      if (result?.emailChanged && result?.emailUpdatePending) {
        Alert.alert(
          "Check your inbox",
          "We sent a confirmation link to your new email. Confirm it to finish updating your email address.",
        );
      } else {
        Alert.alert("Success", "Your profile has been updated.");
      }
      onClose?.();
    } catch (error) {
      Alert.alert(
        "Unable to update profile",
        error?.message || "Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
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
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={styles.backButton} />
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your full name"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Your email address"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldGroup}>
              <TextInput
                style={styles.input}
                placeholder="Your neighborhood or city"
                placeholderTextColor="#9CA3AF"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Phone (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Your phone number"
                placeholderTextColor="#9CA3AF"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
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
  form: {
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 12, android: 10, default: 12 }),
    fontSize: 14,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  saveButton: {
    marginTop: 28,
    backgroundColor: "#56A64B",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
