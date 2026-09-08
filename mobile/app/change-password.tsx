import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { changePassword } from "../src/api/auth";
import { colors } from "../src/theme";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Current password"
        placeholderTextColor={colors.warm400}
        value={oldPassword}
        onChangeText={setOldPassword}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="New password (min 8)"
        placeholderTextColor={colors.warm400}
        value={newPassword}
        onChangeText={setNewPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={styles.button}
        disabled={busy || !oldPassword || newPassword.length < 8}
        onPress={async () => {
          setBusy(true);
          setError(null);
          try {
            await changePassword(oldPassword, newPassword);
            Alert.alert("Password updated", "Sign in again on other devices if needed.");
            router.back();
          } catch (e: any) {
            setError(e?.message || "Could not change password");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <ActivityIndicator color={colors.cream} /> : <Text style={styles.buttonText}>Save</Text>}
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
  },
  buttonText: { color: colors.cream, fontWeight: "700" },
  error: { color: colors.accent },
});
