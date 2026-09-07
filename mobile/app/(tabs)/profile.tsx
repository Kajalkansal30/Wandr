import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme";
import { API_BASE } from "../../src/api/client";

export default function ProfileScreen() {
  const { user, loading, signOut, isOwner } = useAuth();
  const router = useRouter();

  if (loading) {
    return <View style={styles.container} />;
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Your Wandr</Text>
        <Text style={styles.meta}>Same account as the website.</Text>
        <Pressable style={styles.button} onPress={() => router.push("/login")}>
          <Text style={styles.buttonText}>Sign in</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => router.push("/signup")}>
          <Text style={styles.secondaryText}>Create account</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{user.displayName || user.email}</Text>
      <Text style={styles.meta}>{user.email}</Text>
      <Text style={styles.meta}>Role: {user.role}</Text>
      <Text style={styles.api}>API: {API_BASE}</Text>

      <Pressable style={styles.row} onPress={() => router.push("/notifications")}>
        <Text style={styles.rowText}>Notifications</Text>
      </Pressable>
      <Pressable style={styles.row} onPress={() => router.push("/submit")}>
        <Text style={styles.rowText}>Submit a place</Text>
      </Pressable>

      {isOwner ? (
        <>
          <Text style={styles.section}>Business</Text>
          <Pressable style={styles.row} onPress={() => router.push("/owner")}>
            <Text style={styles.rowText}>My places</Text>
          </Pressable>
          <Pressable style={styles.row} onPress={() => router.push("/owner/analytics")}>
            <Text style={styles.rowText}>Analytics</Text>
          </Pressable>
          <Pressable style={styles.row} onPress={() => router.push("/owner/boosts")}>
            <Text style={styles.rowText}>Boosts</Text>
          </Pressable>
          <Pressable style={styles.row} onPress={() => router.push("/owner/claims")}>
            <Text style={styles.rowText}>Claims</Text>
          </Pressable>
        </>
      ) : null}

      <Pressable
        style={[styles.button, { marginTop: 24 }]}
        onPress={async () => {
          await signOut();
        }}
      >
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 20 },
  title: { fontSize: 24, fontWeight: "800", color: colors.warm700 },
  meta: { marginTop: 6, color: colors.warm500 },
  api: { marginTop: 10, fontSize: 11, color: colors.warm400 },
  section: { marginTop: 24, marginBottom: 8, fontWeight: "700", color: colors.warm700 },
  row: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.warm100,
  },
  rowText: { color: colors.warm700, fontWeight: "600" },
  button: {
    backgroundColor: colors.warm700,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: { color: colors.cream, fontWeight: "700" },
  secondary: { alignItems: "center", marginTop: 12 },
  secondaryText: { color: colors.accent, fontWeight: "700" },
});
