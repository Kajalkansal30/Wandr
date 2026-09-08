import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { resetPassword } from "../src/api/auth";
import { colors } from "../src/theme";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = typeof params.token === "string" ? params.token : Array.isArray(params.token) ? params.token[0] : "";
    if (t) setToken(t);
  }, [params.token]);

  return (
    <View style={styles.container}>
      <Text style={styles.meta}>Choose a new password (at least 8 characters).</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        placeholder="Reset token"
        placeholderTextColor={colors.warm400}
        value={token}
        onChangeText={setToken}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="New password"
        placeholderTextColor={colors.warm400}
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.ok}>{message}</Text> : null}
      <Pressable
        style={styles.button}
        disabled={busy || !token.trim() || password.length < 8}
        onPress={async () => {
          setBusy(true);
          setError(null);
          try {
            const res = await resetPassword(token.trim(), password);
            setMessage(res?.message || "Password updated. Sign in with your new password.");
            setTimeout(() => router.replace("/login"), 1200);
          } catch (e: any) {
            setError(e?.message || "Reset failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <ActivityIndicator color={colors.cream} /> : <Text style={styles.buttonText}>Update password</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 20, gap: 12 },
  meta: { color: colors.warm500 },
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
  },
  buttonText: { color: colors.cream, fontWeight: "700" },
  error: { color: colors.accent },
  ok: { color: colors.sage, fontWeight: "600" },
});
