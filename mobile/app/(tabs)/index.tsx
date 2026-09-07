import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import * as Location from "expo-location";
import { fetchPlaces, Place } from "../../src/api/places";
import { colors } from "../../src/theme";
import { API_BASE } from "../../src/api/client";

export default function HomeScreen() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const load = useCallback(
    async (pageNum = 0, append = false) => {
      setError(null);
      try {
        const result = await fetchPlaces({
          lat: coords?.lat,
          lng: coords?.lng,
          search: search.trim() || undefined,
          page: pageNum,
          size: 20,
        });
        setPlaces((prev) => (append ? [...prev, ...result.items] : result.items));
        setHasMore(result.hasMore);
        setPage(pageNum);
      } catch (e: any) {
        setError(e?.message || "Unable to load places");
        if (!append) setPlaces([]);
      } finally {
        setLoading(false);
      }
    },
    [coords, search]
  );

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }
      } catch {
        /* optional */
      }
    })();
  }, []);

  useEffect(() => {
    setLoading(true);
    load(0, false);
  }, [load]);

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Same API as wandrhere.com · {API_BASE}</Text>
      <TextInput
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={() => {
          setLoading(true);
          load(0, false);
        }}
        placeholder="Search places"
        placeholderTextColor={colors.warm400}
        style={styles.search}
        returnKeyType="search"
      />

      {loading && places.length === 0 ? (
        <ActivityIndicator color={colors.warm600} style={{ marginTop: 40 }} />
      ) : error && places.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable
            style={styles.button}
            onPress={() => {
              setLoading(true);
              load(0, false);
            }}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => {
                setLoading(true);
                load(0, false);
              }}
            />
          }
          onEndReached={() => {
            if (hasMore && !loading) load(page + 1, true);
          }}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/place/${item.id}`)}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]} />
              )}
              <View style={styles.cardBody}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.category || "Place"}
                  {item.distance != null ? ` · ${Number(item.distance).toFixed(1)} km` : ""}
                  {item.rating != null ? ` · ★ ${item.rating}` : ""}
                </Text>
                {item.sponsored ? (
                  <Text style={styles.sponsored}>{item.sponsoredHeadline || "Sponsored"}</Text>
                ) : null}
              </View>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No places found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: 16, paddingTop: 8 },
  eyebrow: { fontSize: 11, color: colors.warm400, marginBottom: 8 },
  search: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warm200,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: colors.warm700,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.warm100,
  },
  image: { width: "100%", height: 140 },
  imagePlaceholder: { backgroundColor: colors.warm200 },
  cardBody: { padding: 12 },
  name: { fontSize: 16, fontWeight: "700", color: colors.warm700 },
  meta: { marginTop: 4, fontSize: 13, color: colors.warm500 },
  sponsored: { marginTop: 6, fontSize: 12, color: colors.accent, fontWeight: "600" },
  center: { alignItems: "center", marginTop: 48, gap: 12 },
  error: { color: colors.warm600, textAlign: "center" },
  button: { backgroundColor: colors.warm700, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  buttonText: { color: colors.cream, fontWeight: "700" },
  empty: { textAlign: "center", color: colors.warm400, marginTop: 40 },
});
