import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { fetchPlaces, Place } from "../../src/api/places";
import { colors } from "../../src/theme";

const FALLBACK = { latitude: 28.6139, longitude: 77.209 };

export default function MapScreen() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [region, setRegion] = useState({
    ...FALLBACK,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });
  const [loading, setLoading] = useState(true);
  const [locationDenied, setLocationDenied] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  async function loadAround(lat: number, lng: number, denied: boolean, fallback: boolean) {
    setLocationDenied(denied);
    setUsingFallback(fallback);
    setRegion((r) => ({ ...r, latitude: lat, longitude: lng }));
    const page = await fetchPlaces({ lat, lng, page: 0, size: 40 });
    setPlaces(page.items.filter((p) => p.lat != null && p.lng != null));
  }

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          await loadAround(loc.coords.latitude, loc.coords.longitude, false, false);
        } else {
          await loadAround(FALLBACK.latitude, FALLBACK.longitude, true, true);
        }
      } catch {
        try {
          await loadAround(FALLBACK.latitude, FALLBACK.longitude, true, true);
        } catch {
          /* empty map */
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.warm600} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {locationDenied || usingFallback ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Location is off — showing a default city map. Enable location for nearby places.
          </Text>
          <Pressable
            onPress={async () => {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== "granted") return;
              setLoading(true);
              try {
                const loc = await Location.getCurrentPositionAsync({});
                await loadAround(loc.coords.latitude, loc.coords.longitude, false, false);
              } finally {
                setLoading(false);
              }
            }}
          >
            <Text style={styles.bannerLink}>Enable location</Text>
          </Pressable>
        </View>
      ) : null}
      <MapView style={styles.map} initialRegion={region} region={region}>
        {places.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: Number(p.lat), longitude: Number(p.lng) }}
            pinColor={colors.accent}
          >
            <Callout onPress={() => router.push(`/place/${p.id}`)}>
              <View style={{ maxWidth: 180 }}>
                <Text style={{ fontWeight: "700" }}>{p.name}</Text>
                <Text style={{ fontSize: 12, color: colors.warm500 }}>Tap for details</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream },
  banner: {
    backgroundColor: "#FFF4EC",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.warm200,
    gap: 6,
  },
  bannerText: { color: colors.warm700, fontSize: 13, lineHeight: 18 },
  bannerLink: { color: colors.accent, fontWeight: "700" },
});
