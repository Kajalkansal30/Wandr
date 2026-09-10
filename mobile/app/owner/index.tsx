import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { fetchOwnerPlaces } from "../../src/api/owner";
import { fetchListingFeeStatus, unlockListingFeeMobile } from "../../src/api/billing";
import { colors } from "../../src/theme";

export default function OwnerPlacesScreen() {
  const { isOwner, user, setListingFeePaid } = useAuth();
  const router = useRouter();
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feePaid, setFeePaid] = useState<boolean | null>(null);
  const [payBusy, setPayBusy] = useState(false);

  useEffect(() => {
    if (!user || !isOwner) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [data, billing] = await Promise.all([
          fetchOwnerPlaces(),
          fetchListingFeeStatus().catch(() => ({ listingFeePaid: false })),
        ]);
        setPlaces(Array.isArray(data) ? data : []);
        setFeePaid(Boolean(billing.listingFeePaid));
        if (billing.listingFeePaid) await setListingFeePaid(true);
      } catch (e: any) {
        setError(e?.message || "Unable to load places");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isOwner, setListingFeePaid]);

  async function onUnlock() {
    setPayBusy(true);
    setError(null);
    try {
      await unlockListingFeeMobile();
      setFeePaid(true);
      await setListingFeePaid(true);
    } catch (e: any) {
      setError(e?.message || "Payment failed");
    } finally {
      setPayBusy(false);
    }
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Sign in as an owner.</Text>
        <Pressable style={styles.button} onPress={() => router.push("/login")}>
          <Text style={styles.buttonText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  if (!isOwner) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Owner tools are available for Café owner accounts only.</Text>
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
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {feePaid === false ? (
        <View style={styles.payCard}>
          <Text style={styles.name}>Unlock Business Hub — ₹100 once</Text>
          <Text style={styles.meta}>Then list unlimited cafés. Live after phone OTP — no admin wait.</Text>
          <Pressable style={styles.button} onPress={onUnlock} disabled={payBusy}>
            <Text style={styles.buttonText}>{payBusy ? "Working…" : "Pay ₹100 & unlock"}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.button} onPress={() => router.push("/owner/edit/new")}>
          <Text style={styles.buttonText}>New listing</Text>
        </Pressable>
      )}
      <View style={styles.links}>
        <Pressable onPress={() => router.push("/owner/analytics")}>
          <Text style={styles.link}>Analytics</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/owner/boosts")}>
          <Text style={styles.link}>Boosts</Text>
        </Pressable>
      </View>
      <FlatList
        data={places}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.empty}>No listings yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable onPress={() => router.push(`/place/${item.id}`)}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.status || "—"} · {item.city || item.address || ""}
              </Text>
            </Pressable>
            <Pressable onPress={() => router.push(`/owner/edit/${item.id}`)}>
              <Text style={styles.link}>Edit</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 16 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cream,
    gap: 12,
  },
  msg: { color: colors.warm600, textAlign: "center", paddingHorizontal: 24 },
  button: {
    backgroundColor: colors.warm700,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  buttonText: { color: colors.cream, fontWeight: "700" },
  links: { flexDirection: "row", gap: 16, marginBottom: 12 },
  payCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.warm200,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.warm100,
  },
  name: { fontWeight: "700", color: colors.warm700, fontSize: 16 },
  meta: { marginTop: 4, color: colors.warm500, fontSize: 13 },
  link: { marginTop: 8, color: colors.accent, fontWeight: "700" },
  empty: { textAlign: "center", color: colors.warm400, marginTop: 40 },
  error: { color: colors.accent, marginBottom: 8 },
});
