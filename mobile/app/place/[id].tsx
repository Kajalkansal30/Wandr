import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  confirmPlaceInfo,
  fetchPlace,
  fetchPlaceMedia,
  fetchPlaceSpots,
  Place,
  reportPlace,
} from "../../src/api/places";
import { fetchReviews, submitReview } from "../../src/api/reviews";
import { toggleFavorite } from "../../src/api/favorites";
import { isVerificationRequiredError } from "../../src/api/auth";
import { trackEvent } from "../../src/api/spotted";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme";

const REPORT_REASONS = ["SPAM", "INAPPROPRIATE", "MISLEADING", "COPYRIGHT", "OTHER"];

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string; upgrade?: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [place, setPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [spots, setSpots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [p, r, m, s] = await Promise.all([
          fetchPlace(id),
          fetchReviews(id),
          fetchPlaceMedia(id).catch(() => []),
          fetchPlaceSpots(id).catch(() => []),
        ]);
        setPlace(p);
        const reviewList = Array.isArray(r) ? r : [];
        setReviews(reviewList);
        setMedia(Array.isArray(m) ? m : []);
        setSpots(Array.isArray(s) ? s : []);
        trackEvent("place_view", { placeId: Number(id), source: "mobile_detail" });
      } catch (e: any) {
        setError(e?.message || "Unable to load place");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function handleVerifyGate(e: any) {
    if (isVerificationRequiredError(e)) {
      Alert.alert("Verify your email", "Verify to use this feature. Links expire in 24 hours.", [
        { text: "Cancel", style: "cancel" },
        { text: "Verify / Resend", onPress: () => router.push("/verify") },
      ]);
      return true;
    }
    return false;
  }

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
  const myReview =
    user != null
      ? reviews.find((r) => r.userId != null && String(r.userId) === String(user.userId))
      : null;

  useEffect(() => {
    if (myReview) {
      setRating(Number(myReview.rating) || 5);
      setText(myReview.text || "");
    }
  }, [myReview?.id]);

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
        {String(place.ownershipStatus || "").toUpperCase() === "UNCLAIMED" ? (
          <Text style={styles.meta}>Community Added · Not claimed</Text>
        ) : null}
        {String(place.ownershipStatus || "").toUpperCase() === "CLAIM_PENDING" ? (
          <Text style={styles.meta}>Claim pending</Text>
        ) : null}
        {String(place.ownershipStatus || "").toUpperCase() === "OWNER_VERIFIED" ? (
          <Text style={styles.meta}>Verified business</Text>
        ) : null}
        {place.hours ? <Text style={styles.meta}>Hours: {place.hours}</Text> : null}
        {place.phone ? <Text style={styles.meta}>Phone: {place.phone}</Text> : null}
        {place.address ? <Text style={styles.meta}>{place.address}</Text> : null}
        {place.description ? <Text style={styles.desc}>{place.description}</Text> : null}

        <View style={styles.actionsRow}>
          {user ? (
            <Pressable
              style={styles.secondaryBtn}
              onPress={async () => {
                try {
                  await toggleFavorite(place.id);
                } catch (e: any) {
                  if (!handleVerifyGate(e)) Alert.alert("Error", e?.message || "Failed");
                }
              }}
            >
              <Text style={styles.secondaryText}>Save</Text>
            </Pressable>
          ) : null}
          {place.lat != null && place.lng != null ? (
            <Pressable
              style={styles.secondaryBtn}
              onPress={() =>
                Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`)
              }
            >
              <Text style={styles.secondaryText}>Directions</Text>
            </Pressable>
          ) : null}
          {place.website ? (
            <Pressable style={styles.secondaryBtn} onPress={() => Linking.openURL(place.website!)}>
              <Text style={styles.secondaryText}>Website</Text>
            </Pressable>
          ) : null}
          {user ? (
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => {
                Alert.alert(
                  "Report place",
                  "Why are you reporting this?",
                  REPORT_REASONS.map((reason) => ({
                    text: reason,
                    onPress: async () => {
                      try {
                        await reportPlace(place.id, reason);
                        Alert.alert("Thanks", "Report submitted.");
                      } catch (e: any) {
                        if (!handleVerifyGate(e)) Alert.alert("Error", e?.message || "Failed");
                      }
                    },
                  })).concat([{ text: "Cancel", style: "cancel" } as any])
                );
              }}
            >
              <Text style={styles.secondaryText}>Report</Text>
            </Pressable>
          ) : null}
        </View>

        {media.length > 0 ? (
          <>
            <Text style={styles.section}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {media.map((m) =>
                m.url || m.thumbnailUrl ? (
                  <Image
                    key={m.id}
                    source={{ uri: m.thumbnailUrl || m.url }}
                    style={styles.thumb}
                  />
                ) : null
              )}
            </ScrollView>
          </>
        ) : null}

        {spots.length > 0 ? (
          <>
            <Text style={styles.section}>Spotted here</Text>
            {spots.slice(0, 5).map((s) => (
              <Text key={s.id} style={styles.meta}>
                {s.caption || s.spotKind || `Spot #${s.id}`}
              </Text>
            ))}
          </>
        ) : null}

        {(() => {
          const status = String(place.ownershipStatus || "").toUpperCase();
          const isOwnListing =
            !!user && place.ownerId != null && String(place.ownerId) === String(user.userId);
          const isCommunity = !isOwnListing && ["UNCLAIMED", "CLAIM_PENDING"].includes(status);
          const isManaged = !isOwnListing && ["OWNER_CLAIMED", "OWNER_VERIFIED"].includes(status);
          return (
            <>
              {isCommunity ? (
                <>
                  <Text style={styles.section}>Community added · not an owner listing</Text>
                  <Text style={styles.meta}>
                    Are you the owner? Sign up as a Café owner and add your listing in Business Hub after the ₹100 unlock.
                  </Text>
                  <Pressable style={styles.button} onPress={() => router.push("/signup")}>
                    <Text style={styles.buttonText}>Sign up as Café owner</Text>
                  </Pressable>
                </>
              ) : null}
              {isManaged ? (
                <>
                  <Text style={styles.section}>Managed by the business</Text>
                  <Text style={styles.meta}>
                    This listing is claimed by an owner account. Wandr does not offer access disputes here.
                  </Text>
                </>
              ) : null}
            </>
          );
        })()}

        {user ? (
          <>
            <Text style={styles.section}>Confirm information</Text>
            <View style={styles.actionsRow}>
              <Pressable
                style={styles.secondaryBtn}
                onPress={async () => {
                  try {
                    await confirmPlaceInfo(place.id, { accurate: true });
                    setConfirmMsg("Thanks — info marked as confirmed.");
                  } catch (e: any) {
                    if (!handleVerifyGate(e)) setConfirmMsg(e?.message || "Failed");
                  }
                }}
              >
                <Text style={styles.secondaryText}>Looks correct</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryBtn}
                onPress={async () => {
                  try {
                    await confirmPlaceInfo(place.id, { accurate: false });
                    setConfirmMsg("Thanks — corrections queued for review.");
                  } catch (e: any) {
                    if (!handleVerifyGate(e)) setConfirmMsg(e?.message || "Failed");
                  }
                }}
              >
                <Text style={styles.secondaryText}>Needs fix</Text>
              </Pressable>
            </View>
            {confirmMsg ? <Text style={styles.meta}>{confirmMsg}</Text> : null}
          </>
        ) : null}

        <Text style={styles.section}>Reviews</Text>
        {user ? (
          <View style={styles.form}>
            <Text style={styles.formLabel}>{myReview ? "Update your review (1–5)" : "Your rating (1–5)"}</Text>
            <Text style={styles.meta}>One review per place — posting again updates it.</Text>
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
                } catch (e: any) {
                  if (!handleVerifyGate(e)) setError(e?.message || "Failed to submit");
                } finally {
                  setSaving(false);
                }
              }}
            >
              <Text style={styles.buttonText}>{saving ? "Saving…" : myReview ? "Save changes" : "Post review"}</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.meta}>Sign in to leave a review.</Text>
        )}

        {reviews.filter((r) => !(myReview && r.id === myReview.id)).length === 0 && !myReview ? (
          <Text style={styles.meta}>No reviews yet — be the first.</Text>
        ) : (
          reviews
            .filter((r) => !(myReview && r.id === myReview.id))
            .map((r) => (
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
  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
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
    marginTop: 8,
  },
  button: {
    backgroundColor: colors.warm700,
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: colors.cream, fontWeight: "700" },
  secondaryBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.warm200,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  secondaryText: { color: colors.warm700, fontWeight: "700" },
  thumb: { width: 120, height: 90, borderRadius: 10, marginRight: 8, backgroundColor: colors.warm100 },
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
