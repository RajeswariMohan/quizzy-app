import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordService {
  private readonly rounds = 10;

  /** Dev/test seed hashes — login and current-password checks are skipped until a real password is set. */
  isUnsetOrPlaceholder(hash: string | null | undefined): boolean {
    return !hash || hash.includes('testhashplaceholder');
  }

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    if (this.isUnsetOrPlaceholder(hash)) {
      return false;
    }
    return bcrypt.compare(plain, hash);
  }
}
