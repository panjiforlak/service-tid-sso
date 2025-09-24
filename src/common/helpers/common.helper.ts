import { randomBytes } from 'crypto';

export function generateTrxId(prefix = 'TID'): string {
  // pakai timestamp (ms sejak epoch)
  //   const timestamp = Date.now();

  // format jamtgltahun → ddMMyyyyHHmmss
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = [
    pad(now.getDate()),
    pad(now.getMonth() + 1),
    now.getFullYear(),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('');

  let mode = 'DEV';
  if (process.env.NODE_ENV === 'production') mode = 'PRD';

  const random = randomBytes(5).toString('hex').toUpperCase().slice(0, 5);
  return `${prefix}${mode}${dateStr}${random}`;
}
