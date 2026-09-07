import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { fetchPlace, Place } from "../../src/api/places";
import { fetchReviews, submitReview } from "../../src/api/reviews";
import { toggleFavorite } from "../../src/api/favorites";
import { trackEvent } from "../../src/api/spotted";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme";

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [place, setPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [p, r] = await Promise.all([fetchPlace(id), fetchReviews(id)]);
        setPlace(p);
        setReviews(Array.isArray(r) ? r : []);
        trackEvent("place_view", { placeId: Number(id), source: "mobile_detail" });
      } catch (e: any) {
        setError(e?.message || "Unable to load place");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.warm600} />
      </View>
    );
  }

  if (error || !place) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || "Not found"}</Text>
      </View>
    );
  }

  const displayCount = reviews.length;
  const displayRating =
    displayCount > 0
      ? (reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / displayCount).toFixed(1)
      : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {place.image ? <Image source={{ uri: place.image }} style={styles.hero} /> : null}
      <View style={styles.body}>
        <Text style={styles.name}>{place.name}</Text>
        <Text style={styles.meta}>
          {place.category || "Place"}
          {place.city ? ` · ${place.city}` : ""}
        </Text>
        <Text style={styles.meta}>
          {displayCount > 0 ? `★ ${displayRating} · ${displayCount} reviews` : "No reviews yet"}
        </Text>
        {place.description ? <Text style={styles.desc}>{place.description}</Text> : null}

        {user ? (
          <Pressable
            style={styles.secondaryBtn}
            onPress={async () => {
              try {
                await toggleFavorite(place.id);
              } catch {
                /* ignore */
              }
            }}
          >
            <Text style={styles.secondaryText}>Toggle save</Text>
          </Pressable>
        ) : null}

        <Text style={styles.section}>Reviews</Text>
        {user ? (
          <View style={styles.form}>
            <Text style={styles.formLabel}>Your rating (1–5)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={String(rating)}
              onChangeText={(v) => setRating(Math.min(5, Math.max(1, Number(v) || 1)))}
            />
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              multiline
              placeholder="What was it like?"
              placeholderTextColor={colors.warm400}
              value={text}
              onChangeText={setText}
            />
            <Pressable
              style={styles.button}
              disabled={saving}
              onPress={async () => {
                setSaving(true);
                try {
                  await submitReview(place.id, { rating, text: text.trim() || null });
                  const r = await fetchReviews(id);
                  setReviews(Array.isArray(r) ? r : []);
                  setText("");
                } catch (e: any) {
                  setError(e?.message || "Failed to submit");
                } finally {
                  setSaving(false);
                }
              }}
            >
              <Text style={styles.buttonText}>{saving ? "Posting…" : "Post review"}</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.meta}>Sign in to leave a review.</Text>
        )}

        {reviews.length === 0 ? (
          <Text style={styles.meta}>No reviews yet — be the first.</Text>
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={styles.review}>
              <Text style={styles.reviewName}>
                {r.userDisplayName || "Guest"} · ★ {r.rating}
              </Text>
              {r.text ? <Text style={styles.desc}>{r.text}</Text> : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream },
  hero: { width: "100%", height: 220 },
  body: { padding: 16 },
  name: { fontSize: 24, fontWeight: "800", color: colors.warm700 },
  meta: { marginTop: 6, color: colors.warm500 },
  desc: { marginTop: 12, color: colors.warm600, lineHeight: 20 },
  section: { marginTop: 24, marginBottom: 8, fontSize: 18, fontWeight: "700", color: colors.warm700 },
  form: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.warm100,
    marginBottom: 12,
    gap: 8,
  },
  formLabel: { color: colors.warm600, fontWeight: "600" },
  input: {
    backgroundColor: colors.warm100,
    borderRadius: 10,
    padding: 10,
    color: colors.warm700,
    borderWidth: 1,
    borderColor: colors.warm200,
  },
  button: {
    backgroundColor: colors.warm700,
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  buttonText: { color: colors.cream, fontWeight: "700" },
  secondaryBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.warm200,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  secondaryText: { color: colors.warm700, fontWeight: "700" },
  review: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.warm100,
  },
  reviewName: { fontWeight: "700", color: colors.warm700 },
  error: { color: colors.accent },
});
