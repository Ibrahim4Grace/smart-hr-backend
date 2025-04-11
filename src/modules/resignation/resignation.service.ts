import { Injectable } from '@nestjs/common';
import { CreateResignationDto } from './dto/create-resignation.dto';
import { UpdateResignationDto } from './dto/update-resignation.dto';

@Injectable()
export class ResignationService {
  create(createResignationDto: CreateResignationDto) {
    return 'This action adds a new resignation';
  }

  findAll() {
    return `This action returns all resignation`;
  }

  findOne(id: number) {
    return `This action returns a #${id} resignation`;
  }

  update(id: number, updateResignationDto: UpdateResignationDto) {
    return `This action updates a #${id} resignation`;
  }

  remove(id: number) {
    return `This action removes a #${id} resignation`;
  }
}
