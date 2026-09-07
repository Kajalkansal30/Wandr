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
import { submitCommunityPlace } from "../src/api/places";
import { colors } from "../src/theme";

export default function SubmitPlaceScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Sign in to submit a place.</Text>
        <Pressable style={styles.button} onPress={() => router.push("/login")}>
          <Text style={styles.buttonText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Place name"
        placeholderTextColor={colors.warm400}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="City"
        placeholderTextColor={colors.warm400}
        value={city}
        onChangeText={setCity}
      />
      <TextInput
        style={styles.input}
        placeholder="Address"
        placeholderTextColor={colors.warm400}
        value={address}
        onChangeText={setAddress}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {done ? <Text style={styles.ok}>Submitted for review.</Text> : null}
      <Pressable
        style={styles.button}
        disabled={busy || !name.trim()}
        onPress={async () => {
          setBusy(true);
          setError(null);
          try {
            await submitCommunityPlace({
              name: name.trim(),
              city: city.trim() || null,
              address: address.trim() || null,
              category: "Cafe",
            });
            setDone(true);
            setName("");
            setCity("");
            setAddress("");
          } catch (e: any) {
            setError(e?.message || "Submit failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <ActivityIndicator color={colors.cream} /> : <Text style={styles.buttonText}>Submit</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 20, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream, gap: 12 },
  msg: { color: colors.warm600 },
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
  error: { color: colors.accent },
  ok: { color: colors.sage, fontWeight: "600" },
});
