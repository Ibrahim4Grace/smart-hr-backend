import { Injectable } from '@nestjs/common';
import { CreateTermConditionDto } from './dto/create-term-condition.dto';
import { UpdateTermConditionDto } from './dto/update-term-condition.dto';

@Injectable()
export class TermConditionService {
  create(createTermConditionDto: CreateTermConditionDto) {
    return 'This action adds a new termCondition';
  }

  findAll() {
    return `This action returns all termCondition`;
  }

  findOne(id: number) {
    return `This action returns a #${id} termCondition`;
  }

  update(id: number, updateTermConditionDto: UpdateTermConditionDto) {
    return `This action updates a #${id} termCondition`;
  }

  remove(id: number) {
    return `This action removes a #${id} termCondition`;
  }
}
