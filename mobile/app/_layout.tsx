import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { AuthProvider } from "../src/context/AuthContext";
import { colors } from "../src/theme";

function DeepLinkHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    function handleUrl(url: string | null) {
      if (!url) return;
      try {
        const parsed = Linking.parse(url);
        const path = (parsed.path || "").replace(/^\//, "");
        const token =
          (parsed.queryParams?.token as string | undefined) ||
          (typeof parsed.queryParams?.token === "string" ? parsed.queryParams.token : undefined);

        if (path.includes("verify-email") || path === "verify") {
          router.push(token ? `/verify?token=${encodeURIComponent(token)}` : "/verify");
          return;
        }
        if (path.includes("claim-verify") || path === "claim-verify") {
          const claimId =
            (parsed.queryParams?.claimId as string | undefined) ||
            (typeof parsed.queryParams?.claimId === "string" ? parsed.queryParams.claimId : undefined);
          const q = new URLSearchParams();
          if (token) q.set("token", token);
          if (claimId) q.set("claimId", String(claimId));
          router.push((`/claim-verify?${q.toString()}`) as any);
          return;
        }
        if (path.includes("reset-password") || path === "reset-password") {
          router.push(
            (token ? `/reset-password?token=${encodeURIComponent(token)}` : "/reset-password") as any
          );
        }
      } catch {
        /* ignore */
      }
    }

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener("url", (e) => handleUrl(e.url));
    return () => sub.remove();
  }, [router]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <DeepLinkHandler>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.cream },
            headerTintColor: colors.warm700,
            contentStyle: { backgroundColor: colors.cream },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: "Sign in" }} />
          <Stack.Screen name="signup" options={{ title: "Create account" }} />
          <Stack.Screen name="forgot" options={{ title: "Forgot password" }} />
          <Stack.Screen name="reset-password" options={{ title: "Reset password" }} />
          <Stack.Screen name="verify" options={{ title: "Verify email" }} />
          <Stack.Screen name="claim-verify" options={{ title: "Business email" }} />
          <Stack.Screen name="change-password" options={{ title: "Change password" }} />
          <Stack.Screen name="delete-account" options={{ title: "Delete account" }} />
          <Stack.Screen name="place/[id]" options={{ title: "Place" }} />
          <Stack.Screen name="create-spot" options={{ title: "New spot" }} />
          <Stack.Screen
            name="record-spot"
            options={{ title: "Record", headerShown: false, presentation: "fullScreenModal" }}
          />
          <Stack.Screen name="owner/index" options={{ title: "Business" }} />
          <Stack.Screen name="owner/analytics" options={{ title: "Analytics" }} />
          <Stack.Screen name="owner/boosts" options={{ title: "Boosts" }} />
          <Stack.Screen name="owner/claims" options={{ title: "Claims" }} />
          <Stack.Screen name="owner/edit/[id]" options={{ title: "Edit listing" }} />
          <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
          <Stack.Screen name="submit" options={{ title: "Submit a place" }} />
          <Stack.Screen name="lists/index" options={{ title: "Curated lists" }} />
          <Stack.Screen name="lists/[id]" options={{ title: "List" }} />
          <Stack.Screen name="whats-new" options={{ title: "What's new" }} />
        </Stack>
      </DeepLinkHandler>
    </AuthProvider>
  );
}
