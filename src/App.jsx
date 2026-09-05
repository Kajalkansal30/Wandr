import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PlacesProvider } from "./contexts/PlacesContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import CafeDetailPage from "./pages/CafeDetailPage";
import SavedPage from "./pages/SavedPage";
import ProfilePage from "./pages/ProfilePage";
import SubmitPlacePage from "./pages/SubmitPlacePage";
import MapExplorePage from "./pages/MapExplorePage";
import { CuratedListsIndex, CuratedListPage } from "./pages/CuratedListsPage";
import WhatsNewPage from "./pages/WhatsNewPage";
import SpottedPage from "./pages/SpottedPage";
import CreateSpotPage from "./pages/CreateSpotPage";
import DashboardPage from "./pages/owner/DashboardPage";
import RegisterCafePage from "./pages/owner/RegisterCafePage";
import EditCafePage from "./pages/owner/EditCafePage";
import BoostPage from "./pages/owner/BoostPage";
import AdminPage from "./pages/admin/AdminPage";
import VerifyCafePage from "./pages/admin/VerifyCafePage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlacesProvider>
          <Routes>
            <Route path="welcome" element={<Navigate to="/" replace />} />
            <Route path="map" element={<MapExplorePage />} />

            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignupPage />} />
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
        </PlacesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
