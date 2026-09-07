import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../src/api/notifications";
import { colors } from "../src/theme";

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await fetchNotifications();
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Sign in to see notifications.</Text>
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
      <Pressable
        style={styles.markAll}
        onPress={async () => {
          try {
            await markAllNotificationsRead();
            setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
          } catch {
            /* ignore */
          }
        }}
      >
        <Text style={styles.markAllText}>Mark all read</Text>
      </Pressable>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.empty}>No notifications.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, !item.readAt && styles.unread]}
            onPress={async () => {
              try {
                await markNotificationRead(item.id);
                setItems((prev) =>
                  prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n))
                );
              } catch {
                /* ignore */
              }
            }}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>{item.message}</Text>
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
  markAll: { alignSelf: "flex-end", marginBottom: 8 },
  markAllText: { color: colors.accent, fontWeight: "700" },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.warm100,
  },
  unread: { borderColor: colors.accent },
  title: { fontWeight: "700", color: colors.warm700 },
  meta: { marginTop: 4, color: colors.warm500, fontSize: 13 },
  empty: { textAlign: "center", color: colors.warm400, marginTop: 40 },
});
