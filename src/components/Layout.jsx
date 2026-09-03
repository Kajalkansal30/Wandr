import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";

const HIDE_NAV = ["/login", "/signup", "/welcome"];

export default function Layout() {
  const { pathname } = useLocation();
  const hideNav = HIDE_NAV.some((p) => pathname === p || pathname.startsWith(p + "/"));

  return (
    <div className="app-canvas">
      <Outlet />
      {!hideNav && <BottomNav />}
    </div>
  );
}
