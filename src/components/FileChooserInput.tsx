"use client";

import { forwardRef, useId, useState } from "react";
import { Upload } from "lucide-react";

// A custom-styled replacement for the plain browser `<input type="file">`,
// which renders inconsistently (and unstyleably) across browsers. The real
// input is kept in the DOM (visually hidden) so refs/name/FormData behavior
// is unchanged for callers — only its default chrome is swapped for a
// clickable button + selected-file label.
export const FileChooserInput = forwardRef<
  HTMLInputElement,
  {
    name?: string;
    accept?: string;
    multiple?: boolean;
    label?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
  }
>(function FileChooserInput({ name, accept, multiple, label, onChange, className }, ref) {
  const inputId = useId();
  const [fileLabel, setFileLabel] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) setFileLabel("");
    else if (files.length === 1) setFileLabel(files[0].name);
    else setFileLabel(`${files.length} files selected`);
    onChange?.(e);
  }

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className ?? ""}`}>
      <label
        htmlFor={inputId}
        className="flex items-center gap-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded cursor-pointer shrink-0"
      >
        <Upload size={13} />
        {label ?? (multiple ? "Choose Files" : "Choose File")}
      </label>
      <input
        ref={ref}
        id={inputId}
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="sr-only"
      />
      <span className={`text-xs truncate max-w-[220px] ${fileLabel ? "text-gray-600" : "text-gray-400"}`}>
        {fileLabel || "No file chosen"}
      </span>
    </div>
  );
});
