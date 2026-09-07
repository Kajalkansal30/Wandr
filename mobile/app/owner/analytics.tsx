import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { fetchOwnerAnalytics } from "../../src/api/owner";
import { colors } from "../../src/theme";

export default function OwnerAnalyticsScreen() {
  const { isOwner } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOwner) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setData(await fetchOwnerAnalytics(30));
      } catch (e: any) {
        setError(e?.message || "Unable to load analytics");
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

  const totals = data?.totals || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 10 }}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.title}>Last {data?.days ?? 30} days</Text>
      {Object.entries(totals).map(([key, value]) => (
        <View key={key} style={styles.card}>
          <Text style={styles.key}>{key}</Text>
          <Text style={styles.value}>{String(value)}</Text>
        </View>
      ))}
      {(data?.funnel || []).map((f: any, idx: number) => (
        <View key={idx} style={styles.card}>
          <Text style={styles.key}>{f.label || f.eventType}</Text>
          <Text style={styles.value}>{f.count ?? f.value ?? 0}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream },
  msg: { color: colors.warm600 },
  title: { fontSize: 20, fontWeight: "800", color: colors.warm700, marginBottom: 8 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.warm100,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  key: { color: colors.warm600, fontWeight: "600" },
  value: { color: colors.warm700, fontWeight: "800" },
  error: { color: colors.accent },
});
