import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";
import { fetchSpottedFeed, toggleSpotLike } from "../../src/api/spotted";
import { colors } from "../../src/theme";
import { useAuth } from "../../src/context/AuthContext";

const { height: SCREEN_H } = Dimensions.get("window");

type Spot = {
  id: number;
  url?: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  spotKind?: string | null;
  mediaType?: string | null;
  placeId?: number;
  place?: { name?: string; id?: number } | null;
  likeCount?: number;
  likedByMe?: boolean;
};

function SpotReelItem({
  item,
  active,
  height,
  user,
  onLike,
  onPlace,
}: {
  item: Spot;
  active: boolean;
  height: number;
  user: boolean;
  onLike: (id: number) => void;
  onPlace: (placeId: number) => void;
}) {
  const isVideo =
    !item.mediaType ||
    String(item.mediaType).toUpperCase().includes("VIDEO") ||
    /\.(mp4|webm|mov|m4v)(\?|$)/i.test(item.url || "");

  const player = useVideoPlayer(isVideo && item.url ? item.url : null, (p) => {
    p.loop = true;
    p.muted = false;
  });

  useEffect(() => {
    if (!isVideo || !item.url) return;
    try {
      if (active) {
        player.play();
      } else {
        player.pause();
      }
    } catch {
      /* ignore */
    }
  }, [active, isVideo, item.url, player]);

  return (
    <View style={[styles.page, { height }]}>
      {isVideo && item.url ? (
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />
      ) : item.thumbnailUrl || item.url ? (
        <Image
          source={{ uri: item.thumbnailUrl || item.url! }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.fallback]} />
      )}

      <View style={styles.overlay}>
        <Text style={styles.placeName} numberOfLines={1}>
          {item.place?.name || (item.placeId ? `Place #${item.placeId}` : "Spotted")}
        </Text>
        <Text style={styles.caption} numberOfLines={3}>
          {item.caption || item.spotKind || ""}
        </Text>
        <View style={styles.actions}>
          {item.placeId ? (
            <Pressable onPress={() => onPlace(item.placeId!)}>
              <Text style={styles.actionText}>Place</Text>
            </Pressable>
          ) : null}
          {user ? (
            <Pressable onPress={() => onLike(item.id)}>
              <Text style={styles.actionText}>
                {item.likedByMe ? "♥" : "♡"} {item.likeCount ?? 0}
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.actionText}>♡ {item.likeCount ?? 0}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const MemoSpot = memo(SpotReelItem);

export default function SpottedScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [pageHeight, setPageHeight] = useState(SCREEN_H);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchSpottedFeed({ filter: "all", limit: 40 });
      const list = Array.isArray(data) ? data : [];
      setSpots(list);
      if (list[0]?.id != null) setActiveId(list[0].id);
    } catch (e: any) {
      setError(e?.message || "Unable to load Spotted");
      setSpots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable);
    if (first?.item?.id != null) setActiveId(first.item.id);
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  async function handleLike(id: number) {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      const res = await toggleSpotLike(id);
      setSpots((prev) =>
        prev.map((s) => (s.id === id ? { ...s, likedByMe: res.liked, likeCount: res.likeCount } : s))
      );
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator color={colors.cream} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerFill}>
        <Text style={styles.errorLight}>{error}</Text>
        <Pressable
          style={styles.fab}
          onPress={() => {
            setLoading(true);
            load();
          }}
        >
          <Text style={styles.fabText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={styles.root}
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        if (h > 0) setPageHeight(h);
      }}
    >
      {spots.length === 0 ? (
        <View style={styles.centerFill}>
          <Text style={styles.emptyLight}>No spots yet. Be the first.</Text>
        </View>
      ) : (
        <FlatList
          data={spots}
          keyExtractor={(item) => String(item.id)}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={pageHeight}
          decelerationRate="fast"
          disableIntervalMomentum
          getItemLayout={(_, index) => ({
            length: pageHeight,
            offset: pageHeight * index,
            index,
          })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item }) => (
            <MemoSpot
              item={item}
              active={focused && activeId === item.id}
              height={pageHeight}
              user={Boolean(user)}
              onLike={handleLike}
              onPlace={(placeId) => router.push(`/place/${placeId}`)}
            />
          )}
        />
      )}

      <View style={[styles.topActions, { top: insets.top + 8 }]}>
        {user ? (
          <Pressable style={styles.recordFab} onPress={() => router.push("/record-spot")}>
            <Text style={styles.recordFabText}>Record</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.recordFab} onPress={() => router.push("/login")}>
            <Text style={styles.recordFabText}>Sign in</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  centerFill: {
    flex: 1,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  page: {
    width: "100%",
    backgroundColor: "#000",
    overflow: "hidden",
  },
  fallback: { backgroundColor: colors.warm700 },
  overlay: {
    position: "absolute",
    left: 16,
    right: 72,
    bottom: 28,
  },
  placeName: { color: "#fff", fontWeight: "800", fontSize: 18 },
  caption: { color: "rgba(255,255,255,0.9)", marginTop: 6, lineHeight: 20 },
  actions: { flexDirection: "row", gap: 18, marginTop: 14 },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  topActions: { position: "absolute", right: 16, zIndex: 5 },
  recordFab: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  recordFabText: { color: "#fff", fontWeight: "800" },
  fab: {
    backgroundColor: colors.warm700,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  fabText: { color: colors.cream, fontWeight: "700" },
  emptyLight: { color: "rgba(255,255,255,0.7)", textAlign: "center" },
  errorLight: { color: "#ffb4a0", textAlign: "center" },
});
