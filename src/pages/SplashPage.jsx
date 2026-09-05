import { Navigate } from "react-router-dom";

/** Welcome splash removed — first visit goes to Discover. */
export default function SplashPage() {
  return <Navigate to="/" replace />;
}
