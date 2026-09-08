import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { fetchPlaces, Place } from "../../src/api/places";
import { getCuratedList } from "../../src/data/curatedLists";
import { colors } from "../../src/theme";

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const def = getCuratedList(String(id || ""));
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const page = await fetchPlaces({ size: 60 });
        let items = (page.items || []).filter(def.filter);
        if (def.sort) items = [...items].sort(def.sort);
        setPlaces(items.slice(0, 30));
      } catch {
        setPlaces([]);
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

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{def.title}</Text>
      <FlatList
        data={places}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.empty}>No places in this list yet.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/place/${item.id}`)}>
            {item.image ? <Image source={{ uri: item.image }} style={styles.image} /> : <View style={styles.image} />}
            <View style={styles.body}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.category || "Place"}
                {item.city ? ` · ${item.city}` : ""}
                {item.rating != null ? ` · ★ ${item.rating}` : ""}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream },
  heading: { fontSize: 22, fontWeight: "800", color: colors.warm700, marginBottom: 12 },
  card: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.warm100,
  },
  image: { width: 88, height: 88, backgroundColor: colors.warm100 },
  body: { flex: 1, padding: 12, justifyContent: "center" },
  name: { fontWeight: "700", color: colors.warm700 },
  meta: { marginTop: 4, color: colors.warm500, fontSize: 13 },
  empty: { textAlign: "center", color: colors.warm400, marginTop: 40 },
});
