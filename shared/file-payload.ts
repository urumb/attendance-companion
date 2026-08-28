export async function browserFileToText(file: Blob): Promise<string> {
  return file.text();
}

export async function browserFileToBase64(file: Blob): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)));
  }
  return btoa(binary);
}

export function decodeBrowserBase64Utf8(value: string): string {
  const binary = atob(value.replace(/^data:[^;]+;base64,/, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function stripBrowserDataUri(value: string): string {
  return value.replace(/^data:[^;]+;base64,/, "");
}
