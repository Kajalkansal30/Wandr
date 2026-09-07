import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { fetchFavoritePlaces } from "../../src/api/favorites";
import { colors } from "../../src/theme";

export default function SavedScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setPlaces([]);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const data = await fetchFavoritePlaces();
      setPlaces(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Unable to load saved places");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Sign in to see saved places.</Text>
        <Pressable style={styles.button} onPress={() => router.push("/login")}>
          <Text style={styles.buttonText}>Sign in</Text>
        </Pressable>
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
      <FlatList
        data={places}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { setLoading(true); load(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>No saved places yet.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/place/${item.id}`)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.city || item.address || item.category}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream, gap: 12 },
  msg: { color: colors.warm600 },
  button: { backgroundColor: colors.warm700, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  buttonText: { color: colors.cream, fontWeight: "700" },
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
  empty: { textAlign: "center", color: colors.warm400, marginTop: 40 },
  error: { color: colors.accent, marginBottom: 8 },
});
