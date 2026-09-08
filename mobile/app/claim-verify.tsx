import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { verifyClaimBusinessEmail } from "../src/api/places";
import { isVerificationRequiredError } from "../src/api/auth";
import { colors } from "../src/theme";

export default function ClaimVerifyScreen() {
  const { token, claimId } = useLocalSearchParams<{ token?: string; claimId?: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "working" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const q = new URLSearchParams();
      if (token) q.set("token", token);
      if (claimId) q.set("claimId", claimId);
      router.replace(`/login?next=${encodeURIComponent(`/claim-verify?${q}`)}` as any);
      return;
    }
    if (!token || !claimId) {
      setStatus("error");
      setMessage("Missing token or claimId in the link.");
      return;
    }
    let cancelled = false;
    (async () => {
      setStatus("working");
      try {
        const res = await verifyClaimBusinessEmail(Number(claimId), token);
        if (cancelled) return;
        setStatus("ok");
        setMessage(res.message || (res.autoApproved ? "Verified and approved." : "Business email verified."));
      } catch (e: any) {
        if (cancelled) return;
        if (isVerificationRequiredError(e)) {
          router.replace("/verify");
          return;
        }
        setStatus("error");
        setMessage(e?.message || "Could not verify business email");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user, token, claimId, router]);

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Business email verification</Text>
      {status === "working" || status === "idle" ? <ActivityIndicator color={colors.warm600} /> : null}
      {status === "ok" ? (
        <>
          <Text style={[styles.msg, { color: colors.sage }]}>{message}</Text>
          <Pressable style={styles.button} onPress={() => router.replace("/(tabs)")}>
            <Text style={styles.buttonText}>Home</Text>
          </Pressable>
        </>
      ) : null}
      {status === "error" ? (
        <>
          <Text style={[styles.msg, { color: colors.accent }]}>{message}</Text>
          <Pressable style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Back</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream, padding: 24 },
  title: { fontSize: 22, fontWeight: "800", color: colors.warm700, marginBottom: 16, textAlign: "center" },
  msg: { color: colors.warm600, textAlign: "center", marginBottom: 16 },
  button: {
    backgroundColor: colors.warm700,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  buttonText: { color: colors.cream, fontWeight: "700" },
});
