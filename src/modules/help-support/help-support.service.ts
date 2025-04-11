import { Injectable } from '@nestjs/common';
import { CreateHelpSupportDto } from './dto/create-help-support.dto';
import { UpdateHelpSupportDto } from './dto/update-help-support.dto';

@Injectable()
export class HelpSupportService {
  create(createHelpSupportDto: CreateHelpSupportDto) {
    return 'This action adds a new helpSupport';
  }

  findAll() {
    return `This action returns all helpSupport`;
  }

  findOne(id: number) {
    return `This action returns a #${id} helpSupport`;
  }

  update(id: number, updateHelpSupportDto: UpdateHelpSupportDto) {
    return `This action updates a #${id} helpSupport`;
  }

  remove(id: number) {
    return `This action removes a #${id} helpSupport`;
  }
}
