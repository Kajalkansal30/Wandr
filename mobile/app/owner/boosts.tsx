import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { createOwnerBoost, fetchOwnerBoosts, fetchOwnerPlaces } from "../../src/api/owner";
import { colors } from "../../src/theme";

const AUDIENCES = [
  { id: "coffee", label: "Coffee lovers" },
  { id: "desserts", label: "Dessert lovers" },
  { id: "students", label: "Students" },
  { id: "work", label: "Remote workers" },
  { id: "date", label: "Date night" },
];
const BUDGETS = [500, 1000, 2500, 5000];
const RADII = [3, 5, 10];

export default function OwnerBoostsScreen() {
  const { isOwner } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [placeId, setPlaceId] = useState("");
  const [radius, setRadius] = useState(5);
  const [audiences, setAudiences] = useState<string[]>(["coffee"]);
  const [budget, setBudget] = useState(1000);
  const [headline, setHeadline] = useState("");
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  const approved = useMemo(() => places.filter((p) => String(p.status).toLowerCase() === "approved"), [places]);

  async function reload() {
    const [boosts, mine] = await Promise.all([fetchOwnerBoosts(), fetchOwnerPlaces()]);
    setItems(Array.isArray(boosts) ? boosts : []);
    setPlaces(Array.isArray(mine) ? mine : []);
    if (!placeId) {
      const first = (Array.isArray(mine) ? mine : []).find((p) => String(p.status).toLowerCase() === "approved");
      if (first) setPlaceId(String(first.id));
    }
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
        setError(e?.message || "Unable to load boosts");
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
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {doneMsg ? <Text style={styles.ok}>{doneMsg}</Text> : null}

      <Pressable style={styles.button} onPress={() => setCreating((v) => !v)}>
        <Text style={styles.buttonText}>{creating ? "Hide create form" : "Create boost"}</Text>
      </Pressable>

      {creating ? (
        <View style={styles.form}>
          <Text style={styles.label}>Listing</Text>
          {approved.length === 0 ? (
            <Text style={styles.meta}>Get a place approved first, then you can boost it.</Text>
          ) : (
            approved.map((p) => (
              <Pressable key={p.id} style={styles.chipRow} onPress={() => setPlaceId(String(p.id))}>
                <Text style={placeId === String(p.id) ? styles.chipOn : styles.chipOff}>{p.name}</Text>
              </Pressable>
            ))
          )}
          <Text style={styles.label}>Radius (km)</Text>
          <View style={styles.row}>
            {RADII.map((r) => (
              <Pressable key={r} onPress={() => setRadius(r)} style={radius === r ? styles.pillOn : styles.pillOff}>
                <Text style={radius === r ? styles.pillOnText : styles.pillOffText}>{r}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>Budget (₹)</Text>
          <View style={styles.row}>
            {BUDGETS.map((b) => (
              <Pressable key={b} onPress={() => setBudget(b)} style={budget === b ? styles.pillOn : styles.pillOff}>
                <Text style={budget === b ? styles.pillOnText : styles.pillOffText}>{b}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>Audiences</Text>
          <View style={styles.row}>
            {AUDIENCES.map((a) => {
              const on = audiences.includes(a.id);
              return (
                <Pressable
                  key={a.id}
                  onPress={() =>
                    setAudiences((prev) => (prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id]))
                  }
                  style={on ? styles.pillOn : styles.pillOff}
                >
                  <Text style={on ? styles.pillOnText : styles.pillOffText}>{a.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Headline (optional)"
            placeholderTextColor={colors.warm400}
            value={headline}
            onChangeText={setHeadline}
          />
          <Pressable
            style={styles.button}
            disabled={busy || !placeId || audiences.length === 0}
            onPress={async () => {
              setBusy(true);
              setError(null);
              setDoneMsg(null);
              try {
                await createOwnerBoost({
                  placeId: Number(placeId),
                  targetRadiusKm: radius,
                  audiences,
                  budgetInr: budget,
                  durationDays: 7,
                  headline: headline.trim() || undefined,
                });
                setDoneMsg("Boost is live. Sponsored slots stay labeled.");
                setCreating(false);
                await reload();
              } catch (e: any) {
                setError(e?.message || "Could not start boost");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? <ActivityIndicator color={colors.cream} /> : <Text style={styles.buttonText}>Start boost</Text>}
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.section}>Your campaigns</Text>
      <FlatList
        data={items}
        scrollEnabled={false}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.empty}>No boost campaigns.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.headline || item.placeName || `Campaign #${item.id}`}</Text>
            <Text style={styles.meta}>
              {item.status} · budget ₹{item.budgetInr ?? "—"} · {item.impressions ?? 0} impressions
            </Text>
          </View>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream },
  msg: { color: colors.warm600 },
  form: { gap: 8, marginBottom: 16 },
  label: { fontWeight: "700", color: colors.warm700, marginTop: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chipRow: { marginBottom: 4 },
  chipOn: { fontWeight: "800", color: colors.accent },
  chipOff: { color: colors.warm600 },
  pillOn: { backgroundColor: colors.warm700, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  pillOff: { borderWidth: 1, borderColor: colors.warm200, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.white },
  pillOnText: { color: colors.cream, fontWeight: "700", fontSize: 12 },
  pillOffText: { color: colors.warm600, fontWeight: "600", fontSize: 12 },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warm200,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.warm700,
  },
  button: {
    backgroundColor: colors.warm700,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: { color: colors.cream, fontWeight: "700" },
  section: { fontWeight: "800", color: colors.warm700, marginBottom: 8, fontSize: 16 },
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
  empty: { textAlign: "center", color: colors.warm400, marginTop: 20 },
  error: { color: colors.accent, marginBottom: 8 },
  ok: { color: colors.sage, fontWeight: "600", marginBottom: 8 },
});
