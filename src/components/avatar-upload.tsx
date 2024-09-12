import { PhotoIcon } from "@heroicons/react/20/solid";
import React, { useRef, useState } from "react";
import { Field, Label } from "./fieldset";
import { Input } from "./input";
import { Button } from "./button";

interface PhotoUploaderProps {
  setImageBase64: (base64String: string) => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  setImageBase64,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // Function to handle file input and convert to Base64
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIsUploading(true);
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        setImageBase64(base64String); // Passing the Base64 string to parent via props
      };
      reader.readAsDataURL(file); // Convert image to Base64
    }
    setIsUploading(false);
  };

  return (
    <div className="col-span-full">
      <label
        htmlFor="photo"
        className="block text-sm font-medium leading-6 text-gray-900"
      >
        Photo
      </label>
      <div className="mt-2 flex items-center gap-x-3">
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <PhotoIcon
            aria-hidden="true"
            className="h-12 w-12 text-zinc-300 dark:text-zinc-700"
          />
        )}

        <Field>
          <Label
            htmlFor="fileInput"
            className="text-sm font-medium text-gray-900"
          />
          <Input
            ref={inputRef}
            type="file"
            id="photo"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only hidden"
          />
        </Field>
        <Button
          onClick={() => {
            inputRef.current?.click();
          }}
          color="white"
        >
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </div>
  );
};
