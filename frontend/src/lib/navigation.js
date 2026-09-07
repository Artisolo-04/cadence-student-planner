import { LayoutDashboard, Calendar, BookOpen, ClipboardList, Library, Settings } from "lucide-react";

export const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Timetable", path: "/timetable", icon: Calendar },
  { label: "Subjects", path: "/subjects", icon: BookOpen },
  { label: "Vault", path: "/vault", icon: Library },
  { label: "Homework", path: "/homework", icon: ClipboardList },
  { label: "Settings", path: "/settings", icon: Settings },
];
