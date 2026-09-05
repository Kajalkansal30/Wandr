import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import Header from "./Header";
import SiteFooter from "./SiteFooter";

const HIDE_CHROME = ["/login", "/signup"];
const HIDE_HEADER = ["/login", "/signup", "/spotted"];
const HIDE_FOOTER = ["/login", "/signup", "/spotted"];

export default function Layout() {
  const { pathname } = useLocation();
  const hideNav = HIDE_CHROME.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const hideHeader =
    HIDE_HEADER.some((p) => pathname === p) ||
    (pathname.startsWith("/spotted/") && !pathname.startsWith("/spotted/create"));
  const hideFooter =
    HIDE_FOOTER.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/owner/") ||
    pathname.startsWith("/admin");

  return (
    <div className="app-canvas flex min-h-dvh flex-col">
      {!hideHeader && <Header />}
      <div className="flex-1">
        <Outlet />
      </div>
      {!hideFooter && <SiteFooter />}
      {!hideNav && <BottomNav />}
    </div>
  );
}
