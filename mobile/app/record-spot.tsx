import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions, useMicrophonePermissions, CameraType } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../src/context/AuthContext";
import { colors } from "../src/theme";
import { setPendingSpotMedia } from "../src/state/pendingSpotMedia";

const MAX_DURATION_SEC = 30;

export default function RecordSpotScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function goToCreate(uri: string, mime = "video/mp4", durationSec?: number) {
    setPendingSpotMedia({ uri, mime, durationSec });
    router.replace("/create-spot");
  }

  async function startRecording() {
    if (!cameraRef.current || recording || busy) return;
    setError(null);
    setBusy(true);
    setRecording(true);
    elapsedRef.current = 0;
    setElapsed(0);
    clearTimer();
    timerRef.current = setInterval(() => {
      elapsedRef.current = Math.min(MAX_DURATION_SEC, elapsedRef.current + 1);
      setElapsed(elapsedRef.current);
    }, 1000);
    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_DURATION_SEC,
      });
      clearTimer();
      setRecording(false);
      setBusy(false);
      if (video?.uri) {
        goToCreate(
          video.uri,
          "video/mp4",
          Math.max(1, Math.min(MAX_DURATION_SEC, elapsedRef.current || MAX_DURATION_SEC))
        );
      }
    } catch (e: any) {
      clearTimer();
      setRecording(false);
      setBusy(false);
      setError(e?.message || "Recording failed");
    }
  }

  function stopRecording() {
    if (!cameraRef.current || !recording) return;
    cameraRef.current.stopRecording();
  }

  async function pickFromGallery() {
    if (recording || busy) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Photo library permission required");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 0.85,
      videoMaxDuration: MAX_DURATION_SEC,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const secs = asset.duration != null ? Math.round(asset.duration / 1000) : undefined;
    goToCreate(asset.uri, asset.mimeType || "video/mp4", secs);
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Sign in to record a spot.</Text>
        <Pressable style={styles.solidBtn} onPress={() => router.push("/login")}>
          <Text style={styles.solidBtnText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  if (!camPerm || !micPerm) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.cream} />
      </View>
    );
  }

  if (!camPerm.granted || !micPerm.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Camera and microphone are needed to record Spotted videos.</Text>
        <Pressable
          style={styles.solidBtn}
          onPress={async () => {
            if (!camPerm.granted) await requestCamPerm();
            if (!micPerm.granted) await requestMicPerm();
          }}
        >
          <Text style={styles.solidBtnText}>Allow access</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode="video"
        mute={false}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.topText}>Close</Text>
        </Pressable>
        <Text style={styles.timer}>
          {recording ? `${elapsed}s / ${MAX_DURATION_SEC}s` : `Up to ${MAX_DURATION_SEC}s`}
        </Text>
        <Pressable
          disabled={recording}
          onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          hitSlop={12}
        >
          <Text style={[styles.topText, recording && styles.dim]}>Flip</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable style={styles.sideBtn} onPress={pickFromGallery} disabled={recording}>
          <Text style={styles.sideBtnText}>Gallery</Text>
        </Pressable>

        <Pressable
          style={[styles.recordOuter, recording && styles.recordOuterOn]}
          onPress={() => {
            if (recording) stopRecording();
            else startRecording();
          }}
        >
          <View style={[styles.recordInner, recording && styles.recordInnerOn]} />
        </Pressable>

        <View style={styles.sideBtn}>
          <Text style={styles.sideBtnHint}>{recording ? "Tap stop" : "Record"}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 14,
  },
  msg: { color: colors.cream, textAlign: "center", lineHeight: 22 },
  solidBtn: {
    backgroundColor: colors.warm700,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
  },
  solidBtnText: { color: colors.cream, fontWeight: "700" },
  link: { color: colors.warm200, fontWeight: "600" },
  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 2,
  },
  topText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  dim: { opacity: 0.4 },
  timer: { color: "#fff", fontWeight: "600", fontSize: 14 },
  errorWrap: {
    position: "absolute",
    top: "40%",
    left: 24,
    right: 24,
    backgroundColor: "rgba(0,0,0,0.65)",
    padding: 12,
    borderRadius: 10,
  },
  error: { color: "#ffb4a0", textAlign: "center" },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    zIndex: 2,
  },
  sideBtn: { width: 72, alignItems: "center" },
  sideBtnText: { color: "#fff", fontWeight: "700" },
  sideBtnHint: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" },
  recordOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  recordOuterOn: { borderColor: colors.accent },
  recordInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accent,
  },
  recordInnerOn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
});
