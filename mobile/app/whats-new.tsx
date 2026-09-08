import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { fetchPlaces, Place } from "../src/api/places";
import { colors } from "../src/theme";

export default function WhatsNewScreen() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const page = await fetchPlaces({ size: 50 });
        setPlaces(page.items || []);
      } catch {
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sections = useMemo(() => {
    const rising = [...places].sort((a, b) => (b.savedCount || 0) - (a.savedCount || 0)).slice(0, 10);
    const rated = [...places].filter((p) => (p.rating || 0) >= 4).slice(0, 10);
    return [
      { title: "Rising saves", data: rising },
      { title: "Highly rated", data: rated },
    ];
  }, [places]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.warm600} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {sections.map((sec) => (
        <View key={sec.title} style={{ marginBottom: 20 }}>
          <Text style={styles.heading}>{sec.title}</Text>
          <FlatList
            horizontal
            data={sec.data}
            keyExtractor={(item) => String(item.id)}
            showsHorizontalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.empty}>Nothing here yet.</Text>}
            renderItem={({ item }) => (
              <Pressable style={styles.card} onPress={() => router.push(`/place/${item.id}`)}>
                {item.image ? <Image source={{ uri: item.image }} style={styles.image} /> : <View style={styles.image} />}
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
              </Pressable>
            )}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream },
  heading: { fontSize: 18, fontWeight: "800", color: colors.warm700, marginBottom: 10 },
  card: { width: 140, marginRight: 10 },
  image: { width: 140, height: 100, borderRadius: 12, backgroundColor: colors.warm100 },
  name: { marginTop: 6, fontWeight: "700", color: colors.warm700, fontSize: 13 },
  empty: { color: colors.warm400 },
});
