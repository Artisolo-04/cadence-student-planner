import FileCard from "./FileCard";

export default function ResourceGrid({ items, folderTitle, onRequestDelete, onPreview }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => (
        <FileCard
          key={item.id}
          item={item}
          folderTitle={folderTitle}
          onRequestDelete={onRequestDelete}
          onPreview={onPreview}
        />
      ))}
    </div>
  );
}
