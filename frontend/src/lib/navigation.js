import { LayoutDashboard, Calendar, BookOpen, ClipboardList, Library, Settings, BarChart3 } from "lucide-react";

export const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Timetable", path: "/timetable", icon: Calendar },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Subjects", path: "/subjects", icon: BookOpen },
  { label: "Vault", path: "/vault", icon: Library },
  { label: "Homework", path: "/homework", icon: ClipboardList },
  { label: "Settings", path: "/settings", icon: Settings },
];
