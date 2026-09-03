import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function Layout() {
  return (
    <div className="app-canvas">
      <Outlet />
      <BottomNav />
    </div>
  );
}
