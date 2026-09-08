import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  checkClaimDomain,
  claimPlace,
  fetchClaimMethods,
  fetchMyClaim,
  fetchPlace,
  startClaimBusinessEmail,
  startClaimDomain,
  startClaimPhoneOtp,
  submitClaimDocument,
  submitClaimVideo,
  verifyClaimBusinessEmail,
  verifyClaimPhoneOtp,
} from "../api/places";
import { isVerificationRequiredError } from "../api/auth";
import { uploadLocalUri } from "../api/media";
import { colors } from "../theme";

const ROLES = ["OWNER", "MANAGER", "AUTHORIZED_REPRESENTATIVE"] as const;

type Props = {
  placeId: number | string;
  mode?: "claim" | "managed" | "upgrade";
  initialOpen?: boolean;
  onComplete?: (place: any) => void;
};

export default function ClaimVerificationPanel({
  placeId,
  mode = "claim",
  initialOpen = false,
  onComplete,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<(typeof ROLES)[number]>("OWNER");
  const [claimId, setClaimId] = useState<number | null>(null);
  const [step, setStep] = useState<"role" | "methods" | "done">("role");
  const [methods, setMethods] = useState<any>(null);
  const [otpCode, setOtpCode] = useState("");
  const [bizEmail, setBizEmail] = useState("");
  const [emailToken, setEmailToken] = useState("");
  const [domainTxt, setDomainTxt] = useState("");
  const [domainHost, setDomainHost] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pendingHint, setPendingHint] = useState(false);

  useEffect(() => {
    if (initialOpen) setOpen(true);
  }, [initialOpen]);

  // Resume pending claim on mount so refresh / revisit continues the same claim.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pending = await fetchMyClaim(placeId);
        if (cancelled || !pending?.id) return;
        setClaimId(pending.id);
        setStep("methods");
        setMsg(pending.message || "Resume verification.");
        if (pending.requestedRole) setRole(pending.requestedRole);
        setPendingHint(true);
        setOpen(true);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [placeId]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const m = await fetchClaimMethods(placeId);
        setMethods(m);
      } catch {
        /* ignore */
      }
    })();
  }, [open, placeId]);

  function gate(e: any) {
    if (isVerificationRequiredError(e)) {
      Alert.alert("Verify your email", "Verify to claim businesses. Links expire in 24 hours.", [
        { text: "Cancel", style: "cancel" },
        { text: "Verify / Resend", onPress: () => router.push("/verify") },
      ]);
      return true;
    }
    return false;
  }

  async function start(kind: string) {
    setBusy(true);
    setMsg(null);
    try {
      const m = methods || (await fetchClaimMethods(placeId));
      setMethods(m);
      let k = kind;
      if (k === "CLAIM" && m.alreadyManaged && !m.canClaim) k = "ACCESS_REQUEST";
      const res = await claimPlace(placeId, {
        requestedRole: role,
        claimKind: k,
        verificationRequest: k === "VERIFICATION_UPGRADE",
      });
      if (k === "ACCESS_REQUEST" || k === "DISPUTE") {
        setMsg(res.message || "Submitted for review.");
        setStep("done");
        return;
      }
      setClaimId(res.id);
      setPendingHint(false);
      setMsg(res.message || "Choose a verification method.");
      setStep("methods");
    } catch (e: any) {
      if (!gate(e)) Alert.alert("Error", e?.message || "Could not start");
    } finally {
      setBusy(false);
    }
  }

  async function run(fn: () => Promise<any>) {
    if (!claimId) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fn();
      setMsg(res.message || "Updated.");
      if (res.domainTxtRecord) {
        setDomainTxt(res.domainTxtRecord);
        setDomainHost(res.domainHost || "");
      }
      if (res.autoApproved || res.status === "APPROVED") {
        setStep("done");
        setPendingHint(false);
        const place = await fetchPlace(placeId);
        onComplete?.(place);
        Alert.alert("Verified business", res.message || "Claim approved.");
      }
    } catch (e: any) {
      if (!gate(e)) Alert.alert("Error", e?.message || "Step failed");
    } finally {
      setBusy(false);
    }
  }

  async function pickEvidence(kind: "video" | "doc") {
    if (!claimId) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow media access to upload evidence.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === "video" ? ["videos"] : ["images"],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setBusy(true);
    try {
      const uploaded = await uploadLocalUri(
        result.assets[0].uri,
        kind === "video" ? "claim-evidence" : "claim-document",
        kind === "video" ? "video/mp4" : "image/jpeg"
      );
      await run(() =>
        kind === "video"
          ? submitClaimVideo(claimId, uploaded.url, "Verification video")
          : submitClaimDocument(claimId, uploaded.url, "Business document")
      );
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message || "Try again");
    } finally {
      setBusy(false);
    }
  }

  const recommended: string[] = methods?.recommended || [];
  const other: string[] = methods?.other || [];
  const show = (k: string) => recommended.includes(k) || other.includes(k);

  if (!open) {
    return (
      <View>
        {pendingHint ? <Text style={styles.meta}>You have a verification in progress.</Text> : null}
        <Pressable style={styles.button} onPress={() => setOpen(true)}>
          <Text style={styles.buttonText}>
            {mode === "managed"
              ? "Request access / dispute"
              : mode === "upgrade"
                ? "Complete verification"
                : pendingHint
                  ? "Resume verification"
                  : "Claim this business"}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      {step === "role" ? (
        <>
          <Text style={styles.label}>How are you associated?</Text>
          {ROLES.map((r) => (
            <Pressable key={r} onPress={() => setRole(r)} style={{ marginTop: 6 }}>
              <Text style={{ color: role === r ? colors.accent : colors.warm600, fontWeight: "700" }}>
                {role === r ? "● " : "○ "}
                {r.replace(/_/g, " ")}
              </Text>
            </Pressable>
          ))}
          {mode === "managed" ? (
            <View style={styles.row}>
              <Pressable style={styles.secondaryBtn} disabled={busy} onPress={() => start("ACCESS_REQUEST")}>
                <Text style={styles.secondaryText}>Request access</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} disabled={busy} onPress={() => start("DISPUTE")}>
                <Text style={styles.secondaryText}>Dispute</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.button}
              disabled={busy}
              onPress={() => start(mode === "upgrade" ? "VERIFICATION_UPGRADE" : "CLAIM")}
            >
              <Text style={styles.buttonText}>{busy ? "Starting…" : "Continue"}</Text>
            </Pressable>
          )}
        </>
      ) : null}

      {step === "methods" && claimId ? (
        <>
          <Text style={styles.label}>Verify your association</Text>
          {show("PHONE_OTP") ? (
            <>
              {recommended.includes("PHONE_OTP") ? <Text style={styles.rec}>Recommended</Text> : null}
              <Pressable style={styles.secondaryBtn} disabled={busy} onPress={() => run(() => startClaimPhoneOtp(claimId))}>
                <Text style={styles.secondaryText}>Send OTP {methods?.listingPhoneMasked || ""}</Text>
              </Pressable>
              <TextInput style={styles.input} placeholder="OTP code" placeholderTextColor={colors.warm400} value={otpCode} onChangeText={setOtpCode} keyboardType="number-pad" />
              <Pressable style={styles.button} disabled={busy} onPress={() => run(() => verifyClaimPhoneOtp(claimId, otpCode))}>
                <Text style={styles.buttonText}>Verify OTP</Text>
              </Pressable>
            </>
          ) : null}

          {show("DOMAIN_TXT") ? (
            <>
              {recommended.includes("DOMAIN_TXT") ? <Text style={styles.rec}>Recommended</Text> : null}
              <Pressable style={styles.secondaryBtn} disabled={busy} onPress={() => run(() => startClaimDomain(claimId))}>
                <Text style={styles.secondaryText}>Start DNS verification</Text>
              </Pressable>
              {domainTxt ? <Text style={styles.meta}>Host: {domainHost}{"\n"}TXT: {domainTxt}</Text> : null}
              {domainTxt ? (
                <Pressable style={styles.secondaryBtn} disabled={busy} onPress={() => run(() => checkClaimDomain(claimId))}>
                  <Text style={styles.secondaryText}>Check DNS</Text>
                </Pressable>
              ) : null}
            </>
          ) : null}

          {show("BUSINESS_EMAIL") ? (
            <>
              {recommended.includes("BUSINESS_EMAIL") ? <Text style={styles.rec}>Recommended</Text> : null}
              <TextInput style={styles.input} placeholder="Business email" placeholderTextColor={colors.warm400} value={bizEmail} onChangeText={setBizEmail} autoCapitalize="none" />
              <Pressable style={styles.secondaryBtn} disabled={busy} onPress={() => run(() => startClaimBusinessEmail(claimId, bizEmail))}>
                <Text style={styles.secondaryText}>Send email code</Text>
              </Pressable>
              <TextInput style={styles.input} placeholder="Email token" placeholderTextColor={colors.warm400} value={emailToken} onChangeText={setEmailToken} autoCapitalize="none" />
              <Pressable style={styles.secondaryBtn} disabled={busy} onPress={() => run(() => verifyClaimBusinessEmail(claimId, emailToken))}>
                <Text style={styles.secondaryText}>Verify email</Text>
              </Pressable>
              <Text style={styles.meta}>Or open wandr://claim-verify from the email link.</Text>
            </>
          ) : null}

          {show("VIDEO") ? (
            <Pressable style={styles.secondaryBtn} disabled={busy} onPress={() => pickEvidence("video")}>
              <Text style={styles.secondaryText}>Upload verification video (admin)</Text>
            </Pressable>
          ) : null}
          {show("DOCUMENT") ? (
            <Pressable style={styles.secondaryBtn} disabled={busy} onPress={() => pickEvidence("doc")}>
              <Text style={styles.secondaryText}>Upload document (admin)</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}

      {step === "done" ? <Text style={[styles.meta, { color: colors.sage }]}>Done. {msg}</Text> : null}
      {msg && step !== "done" ? <Text style={styles.meta}>{msg}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: 8, gap: 8 },
  label: { fontWeight: "700", color: colors.warm700, marginTop: 4 },
  rec: { fontSize: 11, fontWeight: "800", color: colors.sage, textTransform: "uppercase" },
  meta: { color: colors.warm500, fontSize: 13, marginTop: 4 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
    marginTop: 8,
  },
  buttonText: { color: colors.cream, fontWeight: "700" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.warm200,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    marginTop: 4,
  },
  secondaryText: { color: colors.warm700, fontWeight: "700", fontSize: 13 },
});
