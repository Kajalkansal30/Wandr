import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { colors } from "../src/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      const dest = typeof next === "string" && next.startsWith("/") ? next : "/(tabs)/profile";
      router.replace(dest as any);
    } catch (e: any) {
      setError(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor={colors.warm400}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Password"
        placeholderTextColor={colors.warm400}
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={onSubmit} disabled={busy}>
        {busy ? <ActivityIndicator color={colors.cream} /> : <Text style={styles.buttonText}>Sign in</Text>}
      </Pressable>
      <Pressable onPress={() => router.push("/signup")}>
        <Text style={styles.link}>Create an account</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/forgot")}>
        <Text style={styles.link}>Forgot password</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/reset-password" as any)}>
        <Text style={styles.link}>Have a reset token?</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/verify")}>
        <Text style={styles.link}>Verify email</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 20, gap: 12 },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warm200,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.warm700,
  },
  button: {
    backgroundColor: colors.warm700,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: colors.cream, fontWeight: "700" },
  link: { textAlign: "center", color: colors.accent, fontWeight: "700", marginTop: 8 },
  error: { color: colors.accent },
});
