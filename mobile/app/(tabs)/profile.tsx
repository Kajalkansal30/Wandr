import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { logoutAll, resendVerification } from "../../src/api/auth";
import { colors } from "../../src/theme";

export default function ProfileScreen() {
  const { user, loading, signOut, isOwner } = useAuth();
  const router = useRouter();
  const [resendBusy, setResendBusy] = useState(false);

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

      {!user.emailVerified ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Email not verified. Verify to post reviews, Spotted, and claims. Links expire in 24 hours.
          </Text>
          <Pressable
            disabled={resendBusy}
            onPress={async () => {
              setResendBusy(true);
              try {
                const res = await resendVerification();
                Alert.alert("Email sent", res?.message || "Check your inbox.");
              } catch (e: any) {
                Alert.alert("Could not resend", e?.message || "Try again later");
              } finally {
                setResendBusy(false);
              }
            }}
          >
            <Text style={styles.bannerLink}>{resendBusy ? "Sending…" : "Resend verification email"}</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/verify")}>
            <Text style={styles.bannerLink}>I have a token</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable style={styles.row} onPress={() => router.push("/notifications")}>
        <Text style={styles.rowText}>Notifications</Text>
      </Pressable>
      <Pressable style={styles.row} onPress={() => router.push("/submit")}>
        <Text style={styles.rowText}>Submit a place</Text>
      </Pressable>
      <Pressable style={styles.row} onPress={() => router.push("/change-password" as any)}>
        <Text style={styles.rowText}>Change password</Text>
      </Pressable>
      <Pressable style={styles.row} onPress={() => router.push("/lists" as any)}>
        <Text style={styles.rowText}>Curated lists</Text>
      </Pressable>
      <Pressable style={styles.row} onPress={() => router.push("/whats-new" as any)}>
        <Text style={styles.rowText}>What's new</Text>
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

      <Text style={styles.section}>Account</Text>
      <Pressable
        style={styles.row}
        onPress={() => {
          Alert.alert("Log out everywhere?", "Ends sessions on all devices.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Log out all",
              style: "destructive",
              onPress: async () => {
                try {
                  await logoutAll();
                } catch {
                  /* still clear local */
                }
                await signOut();
              },
            },
          ]);
        }}
      >
        <Text style={styles.rowText}>Log out of all devices</Text>
      </Pressable>
      <Pressable style={styles.row} onPress={() => router.push("/delete-account" as any)}>
        <Text style={[styles.rowText, { color: colors.accent }]}>Delete account</Text>
      </Pressable>

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
  banner: {
    marginTop: 14,
    marginBottom: 8,
    backgroundColor: "#FFF4EC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.warm200,
    gap: 8,
  },
  bannerText: { color: colors.warm700, fontSize: 13, lineHeight: 18 },
  bannerLink: { color: colors.accent, fontWeight: "700" },
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
