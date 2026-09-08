import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { submitCommunityPlace } from "../src/api/places";
import { isVerificationRequiredError } from "../src/api/auth";
import { colors } from "../src/theme";

const CATEGORIES = ["Café", "Bakery", "Restaurant", "Street Food", "Food Truck", "Dessert", "Pop-up", "Other"];

export default function SubmitPlaceScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [instagram, setInstagram] = useState("");
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

  if (done) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Thanks for adding a place</Text>
        <Text style={styles.msg}>Submitted for review. Community listing — owner can claim later.</Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, gap: 12 }}>
      <Text style={styles.title}>Add a place</Text>
      <Text style={styles.msg}>
        Submitting creates a community listing (not claimed). It does not make you the owner — the authorized manager can claim later.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Place name"
        placeholderTextColor={colors.warm400}
        value={name}
        onChangeText={setName}
      />
      <View style={styles.row}>
        {CATEGORIES.map((c) => (
          <Pressable key={c} onPress={() => setCategory(c)} style={category === c ? styles.pillOn : styles.pillOff}>
            <Text style={category === c ? styles.pillOnText : styles.pillOffText}>{c}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="City"
        placeholderTextColor={colors.warm400}
        value={city}
        onChangeText={setCity}
      />
      <TextInput
        style={[styles.input, { minHeight: 70 }]}
        placeholder="Address / usual location"
        placeholderTextColor={colors.warm400}
        multiline
        value={address}
        onChangeText={setAddress}
      />
      <TextInput
        style={[styles.input, { minHeight: 90 }]}
        placeholder="Why is this special?"
        placeholderTextColor={colors.warm400}
        multiline
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Instagram (optional)"
        placeholderTextColor={colors.warm400}
        value={instagram}
        onChangeText={setInstagram}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={styles.button}
        disabled={busy || !name.trim() || !category}
        onPress={async () => {
          setBusy(true);
          setError(null);
          try {
            await submitCommunityPlace({
              name: name.trim(),
              category,
              locationType: "CAFE",
              city: city.trim() || null,
              address: address.trim() || null,
              description: description.trim() || null,
              instagram: instagram.trim() || undefined,
              priceLevel: 2,
            });
            setDone(true);
          } catch (e: any) {
            if (isVerificationRequiredError(e)) {
              setError("Verify your email to submit places.");
            } else {
              setError(e?.message || "Submit failed");
            }
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <ActivityIndicator color={colors.cream} /> : <Text style={styles.buttonText}>Submit place</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream, gap: 12, padding: 24 },
  title: { fontSize: 20, fontWeight: "800", color: colors.warm700, textAlign: "center" },
  msg: { color: colors.warm600, textAlign: "center" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pillOn: { backgroundColor: colors.warm700, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  pillOff: { borderWidth: 1, borderColor: colors.warm200, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.white },
  pillOnText: { color: colors.cream, fontWeight: "700", fontSize: 12 },
  pillOffText: { color: colors.warm600, fontWeight: "600", fontSize: 12 },
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
    paddingHorizontal: 16,
  },
  buttonText: { color: colors.cream, fontWeight: "700" },
  error: { color: colors.accent },
});
