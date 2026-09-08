import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../../src/context/AuthContext";
import {
  createOwnerPlace,
  fetchOwnerPlace,
  fetchOwnerTrust,
  requestOwnerVerification,
  updateOwnerPlace,
} from "../../../src/api/owner";
import { uploadLocalUri } from "../../../src/api/media";
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
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [hours, setHours] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [trust, setTrust] = useState<any>(null);
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
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
        setWebsite(p.website || "");
        setInstagram(p.instagram || "");
        setHours(p.hours || "");
        setWhatsapp(p.whatsapp || "");
        setImageUrl(p.image || "");
        setLat(p.lat != null ? String(p.lat) : "");
        setLng(p.lng != null ? String(p.lng) : "");
        try {
          setTrust(await fetchOwnerTrust(id!));
        } catch {
          setTrust(null);
        }
      } catch (e: any) {
        setError(e?.message || "Unable to load place");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew, isOwner]);

  async function pickCover() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo library access to upload a cover.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadLocalUri(result.assets[0].uri, "place-cover", "image/jpeg");
      setImageUrl(uploaded.url);
    } catch (e: any) {
      setError(e?.message || "Cover upload failed");
    } finally {
      setUploading(false);
    }
  }

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
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.cover} /> : null}
      <Pressable style={styles.secondaryBtn} onPress={pickCover} disabled={uploading}>
        <Text style={styles.secondaryBtnText}>{uploading ? "Uploading…" : "Upload cover image"}</Text>
      </Pressable>
      <TextInput style={styles.input} placeholder="Name" placeholderTextColor={colors.warm400} value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Category" placeholderTextColor={colors.warm400} value={category} onChangeText={setCategory} />
      <TextInput style={styles.input} placeholder="City" placeholderTextColor={colors.warm400} value={city} onChangeText={setCity} />
      <TextInput style={styles.input} placeholder="Address" placeholderTextColor={colors.warm400} value={address} onChangeText={setAddress} />
      <TextInput style={styles.input} placeholder="Phone" placeholderTextColor={colors.warm400} value={phone} onChangeText={setPhone} />
      <TextInput style={styles.input} placeholder="WhatsApp" placeholderTextColor={colors.warm400} value={whatsapp} onChangeText={setWhatsapp} />
      <TextInput style={styles.input} placeholder="Website" placeholderTextColor={colors.warm400} value={website} onChangeText={setWebsite} />
      <TextInput style={styles.input} placeholder="Instagram" placeholderTextColor={colors.warm400} value={instagram} onChangeText={setInstagram} />
      <TextInput style={styles.input} placeholder="Hours (e.g. 9 AM – 10 PM)" placeholderTextColor={colors.warm400} value={hours} onChangeText={setHours} />
      <TextInput style={styles.input} placeholder="Latitude" placeholderTextColor={colors.warm400} value={lat} onChangeText={setLat} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Longitude" placeholderTextColor={colors.warm400} value={lng} onChangeText={setLng} keyboardType="decimal-pad" />
      <TextInput
        style={[styles.input, { minHeight: 90 }]}
        placeholder="Description"
        placeholderTextColor={colors.warm400}
        multiline
        value={description}
        onChangeText={setDescription}
      />
      {!isNew && trust ? (
        <View style={styles.trustBox}>
          <Text style={styles.trustTitle}>Trust</Text>
          <Text style={styles.meta}>{JSON.stringify(trust).slice(0, 180)}</Text>
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={styles.button}
        disabled={busy || !name.trim()}
        onPress={async () => {
          setBusy(true);
          setError(null);
          const body: Record<string, unknown> = {
            name: name.trim(),
            category: category.trim() || "Cafe",
            city: city.trim() || null,
            address: address.trim() || null,
            description: description.trim() || null,
            phone: phone.trim() || null,
            whatsapp: whatsapp.trim() || null,
            website: website.trim() || null,
            instagram: instagram.trim() || null,
            hours: hours.trim() || null,
            image: imageUrl.trim() || null,
            lat: lat.trim() ? Number(lat) : null,
            lng: lng.trim() ? Number(lng) : null,
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
      {!isNew ? (
        <Pressable
          style={styles.secondaryBtn}
          onPress={async () => {
            try {
              await requestOwnerVerification(id!, { phone: phone.trim() || null, evidence: "Mobile verification request" });
              Alert.alert("Requested", "Verification request submitted for review.");
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Could not request verification");
            }
          }}
        >
          <Text style={styles.secondaryBtnText}>Request verification</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream },
  msg: { color: colors.warm600 },
  cover: { width: "100%", height: 160, borderRadius: 12, backgroundColor: colors.warm100 },
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
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.warm200,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.warm700, fontWeight: "700" },
  trustBox: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.warm100,
  },
  trustTitle: { fontWeight: "700", color: colors.warm700, marginBottom: 4 },
  meta: { color: colors.warm500, fontSize: 12 },
  error: { color: colors.accent },
});
