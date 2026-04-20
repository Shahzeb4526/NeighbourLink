import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";

export default function LoginScreen({ onSignIn, onCreateAccount }) {
  const [viewMode, setViewMode] = useState("signIn");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignInPress = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing details", "Please enter email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSignIn?.(email.trim(), password);
    } catch (error) {
      Alert.alert("Sign in failed", error?.message || "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccountPress = async () => {
    if (!fullName.trim()) {
      Alert.alert("Missing details", "Please enter your full name.");
      return;
    }

    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing details", "Please enter email and password.");
      return;
    }

    if (password.trim() !== confirmPassword.trim()) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    if (password.trim().length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await onCreateAccount?.(email.trim(), password, {
        full_name: fullName.trim(),
      });
      if (result?.requiresEmailConfirmation) {
        Alert.alert(
          "Account created",
          "Please check your email and confirm your account, then sign in.",
        );
      }
    } catch (error) {
      const message = error?.message || "Please try again.";
      Alert.alert("Sign up failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateAccount = () => {
    setViewMode("createAccount");
  };

  const backToSignIn = () => {
    setViewMode("signIn");
    setConfirmPassword("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {viewMode === "createAccount" ? "Create account" : "Welcome back"}
        </Text>
        <Text style={styles.subtitle}>
          {viewMode === "createAccount"
            ? "Enter your details to make a new account"
            : "Sign in to borrow and share items"}
        </Text>

        {viewMode === "createAccount" ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>
        ) : null}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {viewMode === "createAccount" ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.9}
          onPress={
            viewMode === "createAccount"
              ? handleCreateAccountPress
              : handleSignInPress
          }
          disabled={isSubmitting}
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting
              ? viewMode === "createAccount"
                ? "Creating Account..."
                : "Signing In..."
              : viewMode === "createAccount"
                ? "Create Account"
                : "Sign In"}
          </Text>
        </TouchableOpacity>

        {viewMode === "signIn" ? (
          <TouchableOpacity style={styles.linkButton} activeOpacity={0.7}>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>
        ) : null}

        {viewMode === "signIn" ? (
          <>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.9}
              onPress={openCreateAccount}
              disabled={isSubmitting}
            >
              <Text style={styles.secondaryButtonText}>Create New Account</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.linkButton}
            activeOpacity={0.7}
            onPress={backToSignIn}
            disabled={isSubmitting}
          >
            <Text style={styles.linkText}>Back to Sign In</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4FAF4",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  fieldGroup: {
    marginTop: 18,
  },
  label: {
    fontSize: 14,
    color: "#111827",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 12, android: 10, default: 12 }),
    fontSize: 14,
    color: "#111827",
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: "#56A64B",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  linkButton: {
    marginTop: 14,
    alignItems: "center",
  },
  linkText: {
    color: "#56A64B",
    fontSize: 14,
    fontWeight: "600",
  },
  dividerRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
  },
  secondaryButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
  },
});
