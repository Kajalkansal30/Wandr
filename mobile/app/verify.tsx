import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { resendVerification, verifyEmail } from "../src/api/auth";
import { useAuth } from "../src/context/AuthContext";
import { colors } from "../src/theme";

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const { user, markEmailVerified } = useAuth();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const t = typeof params.token === "string" ? params.token : Array.isArray(params.token) ? params.token[0] : "";
    if (t) setToken(t);
  }, [params.token]);

  async function onVerify(raw?: string) {
    const value = (raw ?? token).trim();
    if (!value) {
      setError("Paste the token from your email, or open the email link.");
      return;
    }
    setBusy(true);
    setError(null);
    setExpired(false);
    setMessage(null);
    try {
      const res = await verifyEmail(value);
      await markEmailVerified();
      setMessage(res?.message || "Email verified.");
    } catch (e: any) {
      const msg = e?.message || "Verification failed";
      setError(msg);
      if (/expired|invalid/i.test(msg)) setExpired(true);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const t = typeof params.token === "string" ? params.token : "";
    if (t) void onVerify(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.meta}>
        Open the link from your email, or paste the token below. Links expire in 24 hours — you can resend anytime.
      </Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        placeholder="Verification token"
        placeholderTextColor={colors.warm400}
        value={token}
        onChangeText={setToken}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.ok}>{message}</Text> : null}
      <Pressable style={styles.button} disabled={busy || !token.trim()} onPress={() => onVerify()}>
        {busy ? <ActivityIndicator color={colors.cream} /> : <Text style={styles.buttonText}>Verify</Text>}
      </Pressable>

      {(expired || !message) && user ? (
        <Pressable
          style={styles.secondary}
          disabled={resendBusy}
          onPress={async () => {
            setResendBusy(true);
            setError(null);
            try {
              const res = await resendVerification();
              setMessage(res?.message || "Verification email sent.");
              setExpired(false);
            } catch (e: any) {
              setError(e?.message || "Could not resend");
            } finally {
              setResendBusy(false);
            }
          }}
        >
          <Text style={styles.secondaryText}>
            {resendBusy ? "Sending…" : "Resend verification email"}
          </Text>
        </Pressable>
      ) : null}

      {!user ? (
        <Pressable onPress={() => router.push("/login")}>
          <Text style={styles.secondaryText}>Sign in to resend email</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 20, gap: 12 },
  meta: { color: colors.warm500, marginBottom: 4, lineHeight: 20 },
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
  },
  buttonText: { color: colors.cream, fontWeight: "700" },
  secondary: { alignItems: "center", paddingVertical: 8 },
  secondaryText: { color: colors.accent, fontWeight: "700", textAlign: "center" },
  error: { color: colors.accent },
  ok: { color: colors.sage, fontWeight: "600" },
});
