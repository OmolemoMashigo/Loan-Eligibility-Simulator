export function fieldHintId(id: string): string {
  return `${id}-hint`;
}

export function fieldErrorId(id: string): string {
  return `${id}-error`;
}

export function describedById(
  id: string,
  options: { hint?: string; error?: string },
): string | undefined {
  const ids = [
    options.error ? fieldErrorId(id) : undefined,
    options.hint ? fieldHintId(id) : undefined,
  ].filter((value): value is string => value !== undefined);

  return ids.length > 0 ? ids.join(' ') : undefined;
}
