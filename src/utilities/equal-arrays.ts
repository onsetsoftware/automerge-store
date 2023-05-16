export const equalArrays = (a: unknown[], b: unknown[]) =>
  a.length === b.length && a.every((element, index) => element === b[index]);
