import { PlayCircle, Code2, GraduationCap, Video, HardDrive } from "lucide-react";

export const LINK_RULES = [
  {
    test: (hostname) => hostname.includes("youtube.com") || hostname.includes("youtu.be"),
    badge: "YOUTUBE",
    Icon: PlayCircle,
    accentVar: "--color-danger",
  },
  {
    test: (hostname) => hostname.includes("classroom.google.com"),
    badge: "CLASSROOM",
    Icon: GraduationCap,
    accentVar: "--color-success",
  },
  {
    test: (hostname) => hostname.includes("meet.google.com"),
    badge: "MEET",
    Icon: Video,
    accentVar: "--color-success",
  },
  {
    test: (hostname) => hostname.includes("drive.google.com"),
    badge: "DRIVE",
    Icon: HardDrive,
    accentVar: "--color-primary",
  },
  {
    test: (hostname) => hostname.includes("google.com"),
    badge: "CLASSROOM",
    Icon: GraduationCap,
    accentVar: "--color-success",
  },
  {
    test: (hostname) => hostname.includes("github.com"),
    badge: "GITHUB",
    Icon: Code2,
    accentVar: "--color-text-muted",
  },
];
