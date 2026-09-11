import { Play, Code2, GraduationCap, Video, HardDrive } from "lucide-react";

export const LINK_RULES = [
  {
    test: (hostname) => hostname.includes("youtube.com") || hostname.includes("youtu.be"),
    badge: "YOUTUBE",
    Icon: Play,
    accentVar: "--color-link-youtube",
  },
  {
    test: (hostname) => hostname.includes("classroom.google.com"),
    badge: "CLASSROOM",
    Icon: GraduationCap,
    accentVar: "--color-link-classroom",
  },
  {
    test: (hostname) => hostname.includes("meet.google.com"),
    badge: "MEET",
    Icon: Video,
    accentVar: "--color-link-meet",
  },
  {
    test: (hostname) => hostname.includes("drive.google.com"),
    badge: "DRIVE",
    Icon: HardDrive,
    accentVar: "--color-link-drive",
  },
  {
    test: (hostname) => hostname.includes("google.com"),
    badge: "CLASSROOM",
    Icon: GraduationCap,
    accentVar: "--color-link-classroom",
  },
  {
    test: (hostname) => hostname.includes("github.com"),
    badge: "GITHUB",
    Icon: Code2,
    accentVar: "--color-link-github",
  },
];
