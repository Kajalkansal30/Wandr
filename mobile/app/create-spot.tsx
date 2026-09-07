import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { fetchPlaces } from "../src/api/places";
import { createSpot } from "../src/api/spotted";
import { uploadLocalUri } from "../src/api/media";
import { takePendingSpotMedia } from "../src/state/pendingSpotMedia";
import { colors } from "../src/theme";

const SPOT_KINDS = ["AMBIENCE", "FOOD", "NEW_CAFE", "HIDDEN_GEM", "OFFER", "EVENT"];

export default function CreateSpotScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [placeId, setPlaceId] = useState<number | null>(null);
  const [placeName, setPlaceName] = useState("");
  const [places, setPlaces] = useState<any[]>([]);
  const [spotKind, setSpotKind] = useState("AMBIENCE");
  const [caption, setCaption] = useState("");
  const [url, setUrl] = useState("");
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [mime, setMime] = useState("video/mp4");
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const pending = takePendingSpotMedia();
    if (!pending) return;
    setLocalUri(pending.uri);
    setMime(pending.mime || "video/mp4");
    if (pending.durationSec != null && pending.durationSec > 0) {
      setDurationSec(pending.durationSec);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return places.slice(0, 8);
    return places
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [places, query]);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Sign in to post a spot.</Text>
        <Pressable style={styles.button} onPress={() => router.push("/login")}>
          <Text style={styles.buttonText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.cameraLink} onPress={() => router.push("/record-spot")}>
        <Text style={styles.cameraLinkText}>Open camera (front / back)</Text>
      </Pressable>

      <TextInput
        style={styles.input}
        placeholder="Search place"
        placeholderTextColor={colors.warm400}
        value={query}
        onChangeText={async (v) => {
          setQuery(v);
          if (v.trim().length < 2) return;
          try {
            const page = await fetchPlaces({ search: v.trim(), size: 20 });
            setPlaces(page.items || []);
          } catch {
            /* ignore */
          }
        }}
      />
      {placeId ? (
        <Text style={styles.selected}>Selected: {placeName}</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          style={{ maxHeight: 140 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => {
                setPlaceId(item.id);
                setPlaceName(item.name);
                setQuery(item.name);
              }}
            >
              <Text style={styles.rowText}>{item.name}</Text>
            </Pressable>
          )}
        />
      )}

      <View style={styles.kinds}>
        {SPOT_KINDS.map((k) => (
          <Pressable
            key={k}
            style={[styles.chip, spotKind === k && styles.chipOn]}
            onPress={() => setSpotKind(k)}
          >
            <Text style={[styles.chipText, spotKind === k && styles.chipTextOn]}>{k}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Caption"
        placeholderTextColor={colors.warm400}
        value={caption}
        onChangeText={setCaption}
      />
      <TextInput
        style={styles.input}
        placeholder="Or paste https video URL"
        placeholderTextColor={colors.warm400}
        autoCapitalize="none"
        value={url}
        onChangeText={setUrl}
      />

      <Pressable
        style={styles.secondary}
        onPress={async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            setError("Photo library permission required");
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["videos", "images"],
            quality: 0.85,
          });
          if (result.canceled || !result.assets?.[0]) return;
          const asset = result.assets[0];
          setLocalUri(asset.uri);
          setMime(asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg"));
          if (asset.duration != null) setDurationSec(Math.round(asset.duration / 1000));
        }}
      >
        <Text style={styles.secondaryText}>
          {localUri ? "Media ready — tap to change" : "Pick video / photo from gallery"}
        </Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {done ? <Text style={styles.ok}>Spot submitted.</Text> : null}

      <Pressable
        style={styles.button}
        disabled={busy}
        onPress={async () => {
          setBusy(true);
          setError(null);
          try {
            if (!placeId) throw new Error("Choose a place");
            let videoUrl = url.trim();
            let thumbnailUrl: string | null = null;
            if (localUri) {
              const uploaded = await uploadLocalUri(
                localUri,
                "spotted",
                mime.startsWith("image/") ? "image/jpeg" : mime || "video/mp4"
              );
              videoUrl = uploaded.url;
              thumbnailUrl = uploaded.thumbnailUrl;
            }
            if (!videoUrl || !/^https:\/\//i.test(videoUrl)) {
              throw new Error("Record, add media, or paste an https URL");
            }
            await createSpot({
              placeId,
              url: videoUrl,
              thumbnailUrl,
              caption: caption.trim() || null,
              spotKind,
              durationSec: durationSec ?? null,
            });
            setDone(true);
          } catch (e: any) {
            setError(e?.message || "Could not publish");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <ActivityIndicator color={colors.cream} /> : <Text style={styles.buttonText}>Publish</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 16, gap: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream, gap: 12 },
  msg: { color: colors.warm600 },
  cameraLink: {
    backgroundColor: colors.warm700,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  cameraLinkText: { color: colors.cream, fontWeight: "700" },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warm200,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.warm700,
  },
  selected: { color: colors.sage, fontWeight: "700" },
  row: {
    backgroundColor: colors.white,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.warm100,
  },
  rowText: { color: colors.warm700 },
  kinds: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.warm200,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipOn: { backgroundColor: colors.warm700, borderColor: colors.warm700 },
  chipText: { fontSize: 11, color: colors.warm600, fontWeight: "600" },
  chipTextOn: { color: colors.cream },
  button: {
    backgroundColor: colors.warm700,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: colors.cream, fontWeight: "700" },
  secondary: { alignItems: "center", paddingVertical: 8 },
  secondaryText: { color: colors.accent, fontWeight: "700" },
  error: { color: colors.accent },
  ok: { color: colors.sage, fontWeight: "600" },
});
