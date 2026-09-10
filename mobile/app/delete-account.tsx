import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { deleteAccount } from "../src/api/auth";
import { useAuth } from "../src/context/AuthContext";
import { colors } from "../src/theme";

export default function DeleteAccountScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <Text style={styles.warn}>
        This permanently deletes your account, favorites, reviews, and related data.
      </Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Confirm with your password"
        placeholderTextColor={colors.warm400}
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={[styles.button, styles.danger]}
        disabled={busy || !password}
        onPress={() => {
          Alert.alert("Delete account?", "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                setBusy(true);
                setError(null);
                try {
                  await deleteAccount(password);
                  await signOut();
                  router.replace("/(tabs)/profile");
                } catch (e: any) {
                  setError(e?.message || "Delete failed");
                } finally {
                  setBusy(false);
                }
              },
            },
          ]);
        }}
      >
        {busy ? <ActivityIndicator color={colors.cream} /> : <Text style={styles.buttonText}>Delete account</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 20, gap: 12 },
  warn: { color: colors.warm600, lineHeight: 20 },
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
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
  },
  danger: { backgroundColor: colors.accent },
  buttonText: { color: colors.cream, fontWeight: "700" },
  error: { color: colors.accent },
});
