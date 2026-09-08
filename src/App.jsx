import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { PlacesProvider } from "./contexts/PlacesContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const ClaimVerifyPage = lazy(() => import("./pages/ClaimVerifyPage"));
const CafeDetailPage = lazy(() => import("./pages/CafeDetailPage"));
const SavedPage = lazy(() => import("./pages/SavedPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const SubmitPlacePage = lazy(() => import("./pages/SubmitPlacePage"));
const MapExplorePage = lazy(() => import("./pages/MapExplorePage"));
const WhatsNewPage = lazy(() => import("./pages/WhatsNewPage"));
const SpottedPage = lazy(() => import("./pages/SpottedPage"));
const CreateSpotPage = lazy(() => import("./pages/CreateSpotPage"));
const DashboardPage = lazy(() => import("./pages/owner/DashboardPage"));
const RegisterCafePage = lazy(() => import("./pages/owner/RegisterCafePage"));
const EditCafePage = lazy(() => import("./pages/owner/EditCafePage"));
const BoostPage = lazy(() => import("./pages/owner/BoostPage"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));
const VerifyCafePage = lazy(() => import("./pages/admin/VerifyCafePage"));

const CuratedListsIndex = lazy(async () => {
  const mod = await import("./pages/CuratedListsPage");
  return { default: mod.CuratedListsIndex };
});

const CuratedListPage = lazy(async () => {
  const mod = await import("./pages/CuratedListsPage");
  return { default: mod.CuratedListPage };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-warm-500">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <PlacesProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="welcome" element={<Navigate to="/" replace />} />
                <Route path="map" element={<MapExplorePage />} />

                <Route element={<Layout />}>
                  <Route index element={<HomePage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="signup" element={<SignupPage />} />
                  <Route path="forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="reset-password" element={<ResetPasswordPage />} />
                  <Route path="verify-email" element={<VerifyEmailPage />} />
                  <Route path="claim-verify" element={<ClaimVerifyPage />} />
                  <Route path="cafe/:id" element={<CafeDetailPage />} />
                  <Route path="lists" element={<CuratedListsIndex />} />
                  <Route path="lists/:listId" element={<CuratedListPage />} />
                  <Route path="collections" element={<Navigate to="/lists" replace />} />
                  <Route path="whats-new/:area" element={<WhatsNewPage />} />
                  <Route path="spotted" element={<SpottedPage />} />
                  <Route
                    path="spotted/create"
                    element={
                      <ProtectedRoute allowedRoles={["user", "owner", "admin"]}>
                        <CreateSpotPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route
                    path="notifications"
                    element={
                      <ProtectedRoute allowedRoles={["user", "owner", "admin"]}>
                        <NotificationsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="submit" element={<SubmitPlacePage />} />
                  <Route
                    path="saved"
                    element={
                      <ProtectedRoute allowedRoles={["user", "owner", "admin"]}>
                        <SavedPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="owner/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["owner"]}>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="owner/register-cafe"
                    element={
                      <ProtectedRoute allowedRoles={["owner"]}>
                        <RegisterCafePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="owner/edit-cafe/:id"
                    element={
                      <ProtectedRoute allowedRoles={["owner"]}>
                        <EditCafePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="owner/boost"
                    element={
                      <ProtectedRoute allowedRoles={["owner"]}>
                        <BoostPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/verify/:id"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <VerifyCafePage />
                      </ProtectedRoute>
                    }
                  />
                </Route>
              </Routes>
            </Suspense>
          </PlacesProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
