import PdfViewer from "./PdfViewer";
import ImageViewer from "./ImageViewer";
import TextViewer from "./TextViewer";
import UrlViewer from "./UrlViewer";
import DocxViewer from "./DocxViewer";
import UnsupportedViewer from "./UnsupportedViewer";

export function getViewerForKind(meta) {
  if (!meta) return UnsupportedViewer;
  switch (meta.kind) {
    case "pdf":
      return PdfViewer;
    case "image":
      return ImageViewer;
    case "url":
      return UrlViewer;
    case "doc":
      if (["docx", "doc"].includes(meta.ext)) return DocxViewer;
      return ["txt", "md"].includes(meta.ext) ? TextViewer : UnsupportedViewer;
    case "sheet":
      return meta.ext === "csv" ? TextViewer : UnsupportedViewer;
    default:
      return UnsupportedViewer;
  }
}
