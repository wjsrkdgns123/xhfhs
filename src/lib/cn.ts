// #25 (incremental step 5): shared className joiner extracted from App.tsx.
export function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ');
}
