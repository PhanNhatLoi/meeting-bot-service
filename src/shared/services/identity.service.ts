import { Injectable } from '@nestjs/common';
import { IIdentityService } from 'src/shared/services/identity.service.interface';
import { UserAccount } from 'src/database/entities/user-account.entity';
import mongoose from 'mongoose';

@Injectable()
export class IdentityService implements IIdentityService {
  private user: UserAccount;

  constructor() {}

  setUser(user: UserAccount) {
    this.user = user;
  }

  private get _user(): UserAccount {
    return this.user;
  }

  get id(): string {
    return this._user?.id;
  }

  get _id(): mongoose.Types.ObjectId {
    return new mongoose.Types.ObjectId(this._user?.id);
  }

  get email(): string {
    return this._user?.email;
  }

  get name(): string {
    return this._user?.name;
  }

  get avatar(): string {
    return this._user?.avatar;
  }
}
