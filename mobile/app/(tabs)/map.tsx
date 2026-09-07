import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { fetchPlaces, Place } from "../../src/api/places";
import { colors } from "../../src/theme";

export default function MapScreen() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [region, setRegion] = useState({
    latitude: 28.6139,
    longitude: 77.209,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        let lat = 28.6139;
        let lng = 77.209;
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
          setRegion((r) => ({ ...r, latitude: lat, longitude: lng }));
        }
        const page = await fetchPlaces({ lat, lng, page: 0, size: 40 });
        setPlaces(page.items.filter((p) => p.lat != null && p.lng != null));
      } catch (e: any) {
        /* show empty map */
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
    <MapView style={styles.map} initialRegion={region}>
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
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream },
});
