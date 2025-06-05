import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepositoryAbstract } from 'src/base/repositories/base.abstract.repository';
import { Meeting } from '../entities/meeting.entity';
import { IMeetingRepository } from '../interfaces/meeting.repository.interface';

@Injectable()
export class MeetingRepository
  extends BaseRepositoryAbstract<Meeting>
  implements IMeetingRepository
{
  constructor(
    @InjectModel(Meeting.name)
    private readonly _meetingRepository: Model<Meeting>,
  ) {
    super(_meetingRepository);
  }
}
