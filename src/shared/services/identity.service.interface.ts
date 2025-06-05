import mongoose from 'mongoose';
import { UserAccount } from 'src/database/entities/user-account.entity';

export abstract class IIdentityService {
  abstract id: string;
  abstract _id: mongoose.Types.ObjectId;
  abstract email: string;
  abstract name: string | null;
  abstract setUser(user: UserAccount): void;
}
