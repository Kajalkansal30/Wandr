import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { CURATED_LISTS } from "../../src/data/curatedLists";
import { colors } from "../../src/theme";

export default function ListsIndexScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <FlatList
        data={CURATED_LISTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/lists/${item.id}` as any)}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>{item.subtitle}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.warm100,
  },
  title: { fontWeight: "800", color: colors.warm700, fontSize: 16 },
  meta: { marginTop: 4, color: colors.warm500 },
});
