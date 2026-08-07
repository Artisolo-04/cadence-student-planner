import { LayoutDashboard, Calendar, BookOpen, ClipboardList, Settings } from "lucide-react";

export const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Timetable", path: "/timetable", icon: Calendar },
  { label: "Subjects", path: "/subjects", icon: BookOpen },
  { label: "Homework", path: "/homework", icon: ClipboardList },
  { label: "Settings", path: "/settings", icon: Settings },
];
