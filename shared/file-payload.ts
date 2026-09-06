export function stripBrowserDataUri(value: string) {
  const commaIndex = value.indexOf(",");
  return commaIndex >= 0 ? value.slice(commaIndex + 1) : value;
}

export async function browserFileToText(file: File | Blob): Promise<string> {
  if (typeof file.text === "function") return file.text();
  if (typeof file.arrayBuffer === "function") {
    const buffer = await file.arrayBuffer();
    return new TextDecoder().decode(buffer);
  }
  if (typeof FileReader !== "undefined") {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error ?? new Error("The browser could not read this file."));
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.readAsText(file);
    });
  }
  throw new Error("The environment does not support reading files as text.");
}

export async function browserFileToBase64(file: File | Blob): Promise<string> {
  if (typeof file.arrayBuffer === "function") {
    const buffer = await file.arrayBuffer();
    if (typeof Buffer !== "undefined") {
      return Buffer.from(buffer).toString("base64");
    }
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const len = bytes.byteLength;
    const chunkSize = 8192;
    for (let i = 0; i < len; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, len)));
    }
    return btoa(binary);
  }
  if (typeof FileReader !== "undefined") {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error ?? new Error("The browser could not read this file."));
      reader.onload = () => resolve(stripBrowserDataUri(String(reader.result ?? "")));
      reader.readAsDataURL(file);
    });
  }
  throw new Error("The environment does not support reading files as base64.");
}

export function decodeBrowserBase64Utf8(value: string): string {
  const clean = stripBrowserDataUri(value);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(clean, "base64").toString("utf-8");
  }
  const binary = atob(clean);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

