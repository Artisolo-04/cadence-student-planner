import { FileText, FileSpreadsheet, Image as ImageIcon } from "lucide-react";

export const FILE_RULES = [
  {
    extensions: ["pdf"],
    kind: "pdf",
    badge: "PDF",
    Icon: FileText,
    accentVar: "--color-danger",
  },
  {
    extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg"],
    kind: "image",
    badge: null,
    Icon: ImageIcon,
    accentVar: "--color-accent",
  },
  {
    extensions: ["xls", "xlsx", "csv"],
    kind: "sheet",
    badge: null,
    Icon: FileSpreadsheet,
    accentVar: "--color-success",
  },
  {
    extensions: ["doc", "docx", "txt", "md"],
    kind: "doc",
    badge: null,
    Icon: FileText,
    accentVar: "--color-success",
  },
];
