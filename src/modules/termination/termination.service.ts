import { Injectable } from '@nestjs/common';
import { CreateTerminationDto } from './dto/create-termination.dto';
import { UpdateTerminationDto } from './dto/update-termination.dto';

@Injectable()
export class TerminationService {
  create(createTerminationDto: CreateTerminationDto) {
    return 'This action adds a new termination';
  }

  findAll() {
    return `This action returns all termination`;
  }

  findOne(id: number) {
    return `This action returns a #${id} termination`;
  }

  update(id: number, updateTerminationDto: UpdateTerminationDto) {
    return `This action updates a #${id} termination`;
  }

  remove(id: number) {
    return `This action removes a #${id} termination`;
  }
}
