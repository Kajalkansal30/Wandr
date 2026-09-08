import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { fetchOwnerClaims, fetchOwnerPlaces, requestOwnerVerification } from "../../src/api/owner";
import { colors } from "../../src/theme";

export default function OwnerClaimsScreen() {
  const { isOwner } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function reload() {
    const [claims, mine] = await Promise.all([fetchOwnerClaims(), fetchOwnerPlaces()]);
    setItems(Array.isArray(claims) ? claims : []);
    setPlaces(Array.isArray(mine) ? mine : []);
  }

  useEffect(() => {
    if (!isOwner) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        await reload();
      } catch (e: any) {
        setError(e?.message || "Unable to load claims");
      } finally {
        setLoading(false);
      }
    })();
  }, [isOwner]);

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
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.section}>Request verification</Text>
      {places.slice(0, 8).map((p) => (
        <View key={p.id} style={styles.card}>
          <Text style={styles.name}>{p.name}</Text>
          <Text style={styles.meta}>{p.status} · {p.city || ""}</Text>
          <Pressable onPress={() => router.push(`/place/${p.id}?upgrade=1` as any)}>
            <Text style={styles.link}>{busyId === p.id ? "Requesting…" : "Open place · verify methods"}</Text>
          </Pressable>
          <Pressable
            disabled={busyId === p.id}
            onPress={async () => {
              setBusyId(p.id);
              setError(null);
              try {
                await requestOwnerVerification(p.id);
                await reload();
                router.push(`/place/${p.id}?upgrade=1` as any);
              } catch (e: any) {
                setError(e?.message || "Request failed");
              } finally {
                setBusyId(null);
              }
            }}
          >
            <Text style={styles.link}>{busyId === p.id ? "Requesting…" : "Request verification"}</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/owner/edit/${p.id}`)}>
            <Text style={styles.link}>Edit listing</Text>
          </Pressable>
        </View>
      ))}

      <Text style={styles.section}>Claims history</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.empty}>No claims yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>Claim #{item.id}</Text>
            <Text style={styles.meta}>
              Place {item.placeId || item.place?.id} · {item.status}
              {item.verificationRequest ? " · verification" : ""}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream },
  msg: { color: colors.warm600 },
  section: { fontWeight: "800", color: colors.warm700, marginBottom: 8, marginTop: 8 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.warm100,
  },
  name: { fontWeight: "700", color: colors.warm700 },
  meta: { marginTop: 4, color: colors.warm500, fontSize: 13 },
  link: { marginTop: 8, color: colors.accent, fontWeight: "700" },
  empty: { textAlign: "center", color: colors.warm400, marginTop: 20 },
  error: { color: colors.accent, marginBottom: 8 },
});
