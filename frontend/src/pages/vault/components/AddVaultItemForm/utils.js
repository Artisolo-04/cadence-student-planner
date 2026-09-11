export function stripExtension(filename) {
  const lastDot = filename.lastIndexOf(".");
  return lastDot > 0 ? filename.slice(0, lastDot) : filename;
}

import { PlayCircle, Code2, GraduationCap, Video, HardDrive } from "lucide-react";

export function getLinkBrand(rawUrl) {
  if (!rawUrl) return null;
  let hostname = "";
  try {
    hostname = new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
    return { badge: "YOUTUBE", Icon: PlayCircle, accentVar: "--color-danger" };
  }
  if (hostname.includes("classroom.google.com")) {
    return { badge: "CLASSROOM", Icon: GraduationCap, accentVar: "--color-success" };
  }
  if (hostname.includes("meet.google.com")) {
    return { badge: "MEET", Icon: Video, accentVar: "--color-success" };
  }
  if (hostname.includes("drive.google.com")) {
    return { badge: "DRIVE", Icon: HardDrive, accentVar: "--color-primary" };
  }
  if (hostname.includes("google.com")) {
    return { badge: "CLASSROOM", Icon: GraduationCap, accentVar: "--color-success" };
  }
  if (hostname.includes("github.com")) {
    return { badge: "GITHUB", Icon: Code2, accentVar: "--color-text-muted" };
  }
  return null;
}

export function deriveResourceType(rawUrl) {
  return /\.pdf(?:\?.*)?$/i.test(rawUrl.trim()) ? "pdf" : "link";
}
