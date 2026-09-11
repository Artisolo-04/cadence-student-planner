import { FileText, FileSpreadsheet, Image as ImageIcon } from "lucide-react";

export const FILE_RULES = [
  {
    extensions: ["pdf"],
    kind: "pdf",
    badge: "PDF",
    Icon: FileText,
    accentVar: "--color-file-pdf",
  },
  {
    extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg"],
    kind: "image",
    badge: null,
    Icon: ImageIcon,
    accentVar: "--color-file-image",
  },
  {
    extensions: ["xls", "xlsx", "csv"],
    kind: "sheet",
    badge: null,
    Icon: FileSpreadsheet,
    accentVar: "--color-file-sheet",
  },
  {
    extensions: ["doc", "docx"],
    kind: "doc",
    badge: null,
    Icon: FileText,
    accentVar: "--color-file-doc",
  },
  {
    extensions: ["txt", "md"],
    kind: "txt",
    badge: null,
    Icon: FileText,
    accentVar: "--color-file-txt",
  },
];
