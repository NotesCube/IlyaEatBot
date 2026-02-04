export function xorDecrypt(enc: string, key: string): string {
  const text = atob(enc);
  return [...text]
    .map((c, i) =>
      String.fromCharCode(
        c.charCodeAt(0) ^ key.charCodeAt(i % key.length)
      )
    )
    .join("");
}