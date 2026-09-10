import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { colors } from "../src/theme";

export default function SignupScreen() {
  const { signup } = useAuth();
  const router = useRouter();
  const [accountType, setAccountType] = useState<"USER" | "OWNER">("USER");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setBusy(true);
    setError(null);
    try {
      await signup(email.trim(), password, displayName.trim(), accountType);
      if (accountType === "OWNER") router.replace("/owner");
      else router.replace("/(tabs)/profile");
    } catch (e: any) {
      setError(e?.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>I am…</Text>
      <View style={styles.row}>
        <Pressable
          style={[styles.chip, accountType === "USER" && styles.chipOn]}
          onPress={() => setAccountType("USER")}
        >
          <Text style={[styles.chipTitle, accountType === "USER" && styles.chipTitleOn]}>Explorer</Text>
          <Text style={[styles.chipSub, accountType === "USER" && styles.chipSubOn]}>Free</Text>
        </Pressable>
        <Pressable
          style={[styles.chip, accountType === "OWNER" && styles.chipOn]}
          onPress={() => setAccountType("OWNER")}
        >
          <Text style={[styles.chipTitle, accountType === "OWNER" && styles.chipTitleOn]}>Café owner</Text>
          <Text style={[styles.chipSub, accountType === "OWNER" && styles.chipSubOn]}>Business Hub</Text>
        </Pressable>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Display name"
        placeholderTextColor={colors.warm400}
        value={displayName}
        onChangeText={setDisplayName}
      />
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
        placeholder="Password (min 6)"
        placeholderTextColor={colors.warm400}
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={onSubmit} disabled={busy}>
        {busy ? <ActivityIndicator color={colors.cream} /> : <Text style={styles.buttonText}>Create account</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 20, gap: 12 },
  label: { fontSize: 13, fontWeight: "600", color: colors.warm600 },
  row: { flexDirection: "row", gap: 8 },
  chip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warm200,
    backgroundColor: colors.white,
    padding: 12,
  },
  chipOn: { backgroundColor: colors.warm700, borderColor: colors.warm700 },
  chipTitle: { fontSize: 14, fontWeight: "700", color: colors.warm700 },
  chipTitleOn: { color: colors.cream },
  chipSub: { marginTop: 4, fontSize: 11, color: colors.warm400 },
  chipSubOn: { color: "rgba(255,255,255,0.8)" },
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
    marginTop: 8,
    backgroundColor: colors.warm700,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: colors.cream, fontWeight: "700" },
  error: { color: "#c45c4a", fontSize: 13 },
});
