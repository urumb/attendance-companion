export function stripBrowserDataUri(value: string) {
  const commaIndex = value.indexOf(",");
  return commaIndex >= 0 ? value.slice(commaIndex + 1) : value;
}

export async function browserFileToText(file: File) {
  if (typeof file.text === "function") return file.text();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("The browser could not read this file."));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsText(file);
  });
}

export async function browserFileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("The browser could not read this file."));
    reader.onload = () => resolve(stripBrowserDataUri(String(reader.result ?? "")));
    reader.readAsDataURL(file);
  });
}

export function decodeBrowserBase64Utf8(value: string) {
  const binary = atob(stripBrowserDataUri(value));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
