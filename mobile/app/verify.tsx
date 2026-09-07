import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { verifyEmail } from "../src/api/auth";
import { colors } from "../src/theme";

export default function VerifyEmailScreen() {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <Text style={styles.meta}>Paste the verification token from your email.</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        placeholder="Verification token"
        placeholderTextColor={colors.warm400}
        value={token}
        onChangeText={setToken}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.ok}>{message}</Text> : null}
      <Pressable
        style={styles.button}
        disabled={busy || !token.trim()}
        onPress={async () => {
          setBusy(true);
          setError(null);
          try {
            const res = await verifyEmail(token.trim());
            setMessage(res?.message || "Email verified.");
          } catch (e: any) {
            setError(e?.message || "Verification failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <ActivityIndicator color={colors.cream} /> : <Text style={styles.buttonText}>Verify</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 20, gap: 12 },
  meta: { color: colors.warm500, marginBottom: 4 },
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
