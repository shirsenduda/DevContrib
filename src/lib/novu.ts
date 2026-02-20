import { Novu } from '@novu/api';

let _novu: Novu | null = null;

export function getNovu(): Novu {
  if (!_novu) {
    const secretKey = process.env.NOVU_SECRET_KEY;
    if (!secretKey) throw new Error('NOVU_SECRET_KEY is not set');
    _novu = new Novu({ secretKey });
  }
  return _novu;
}
