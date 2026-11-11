export const SUPPORT_PICTURES = [
  ["quiet", "Quiet place"],
  ["break", "Movement break"],
  ["directions", "Help with directions"],
  ["time", "Extra time"],
  ["read", "Read aloud"],
  ["schedule", "Picture schedule"],
  ["help", "Teacher help"],
];
export function pictureFor(support) {
  if (SUPPORT_PICTURES.some(([key]) => key === support.picture))
    return support.picture;
  const title = (support.title || "").toLowerCase();
  if (/quiet|distract|focus/.test(title)) return "quiet";
  if (/break|move|stretch/.test(title)) return "break";
  if (/direction|instruction|explain/.test(title)) return "directions";
  if (/time/.test(title)) return "time";
  if (/read|aloud/.test(title)) return "read";
  if (/schedule|routine/.test(title)) return "schedule";
  return "help";
}
