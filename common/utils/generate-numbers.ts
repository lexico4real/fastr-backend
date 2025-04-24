export function generateRandomValue(
  type: 'numeric' | 'alpha' | 'alphanumeric' = 'alphanumeric',
  length = 6,
): string {
  let chars = '';

  switch (type) {
    case 'numeric':
      chars = '0123456789';
      break;
    case 'alpha':
      chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      break;
    case 'alphanumeric':
    default:
      chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      break;
  }

  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }

  return result;
}