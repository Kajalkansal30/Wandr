import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import Header from "./Header";

const HIDE_CHROME = ["/login", "/signup"];
const HIDE_HEADER = ["/login", "/signup", "/spotted"];

export default function Layout() {
  const { pathname } = useLocation();
  const hideNav = HIDE_CHROME.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const hideHeader =
    HIDE_HEADER.some((p) => pathname === p) ||
    (pathname.startsWith("/spotted/") && !pathname.startsWith("/spotted/create"));

  return (
    <div className="app-canvas">
      {!hideHeader && <Header />}
      <Outlet />
      {!hideNav && <BottomNav />}
    </div>
  );
}
