import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../../src/context/AuthContext";
import { createOwnerPlace, fetchOwnerPlace, updateOwnerPlace } from "../../../src/api/owner";
import { colors } from "../../../src/theme";

export default function OwnerEditPlaceScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isNew = !id || id === "new";
  const { isOwner } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Cafe");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !isOwner) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const p = await fetchOwnerPlace(id!);
        setName(p.name || "");
        setCategory(p.category || "Cafe");
        setCity(p.city || "");
        setAddress(p.address || "");
        setDescription(p.description || "");
        setPhone(p.phone || "");
      } catch (e: any) {
        setError(e?.message || "Unable to load place");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew, isOwner]);

  if (!isOwner) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Owner only</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.warm600} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 10 }}>
      <TextInput style={styles.input} placeholder="Name" placeholderTextColor={colors.warm400} value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Category" placeholderTextColor={colors.warm400} value={category} onChangeText={setCategory} />
      <TextInput style={styles.input} placeholder="City" placeholderTextColor={colors.warm400} value={city} onChangeText={setCity} />
      <TextInput style={styles.input} placeholder="Address" placeholderTextColor={colors.warm400} value={address} onChangeText={setAddress} />
      <TextInput style={styles.input} placeholder="Phone" placeholderTextColor={colors.warm400} value={phone} onChangeText={setPhone} />
      <TextInput
        style={[styles.input, { minHeight: 90 }]}
        placeholder="Description"
        placeholderTextColor={colors.warm400}
        multiline
        value={description}
        onChangeText={setDescription}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={styles.button}
        disabled={busy || !name.trim()}
        onPress={async () => {
          setBusy(true);
          setError(null);
          const body = {
            name: name.trim(),
            category: category.trim() || "Cafe",
            city: city.trim() || null,
            address: address.trim() || null,
            description: description.trim() || null,
            phone: phone.trim() || null,
          };
          try {
            if (isNew) {
              const created = await createOwnerPlace(body);
              router.replace(`/owner/edit/${created.id}`);
            } else {
              await updateOwnerPlace(id!, body);
              router.back();
            }
          } catch (e: any) {
            setError(e?.message || "Save failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <ActivityIndicator color={colors.cream} /> : <Text style={styles.buttonText}>{isNew ? "Create" : "Save"}</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream },
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
});
