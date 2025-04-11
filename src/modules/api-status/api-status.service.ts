import { Injectable } from '@nestjs/common';
import { CreateApiStatusDto } from './dto/create-api-status.dto';
import { UpdateApiStatusDto } from './dto/update-api-status.dto';

@Injectable()
export class ApiStatusService {
  create(createApiStatusDto: CreateApiStatusDto) {
    return 'This action adds a new apiStatus';
  }

  findAll() {
    return `This action returns all apiStatus`;
  }

  findOne(id: number) {
    return `This action returns a #${id} apiStatus`;
  }

  update(id: number, updateApiStatusDto: UpdateApiStatusDto) {
    return `This action updates a #${id} apiStatus`;
  }

  remove(id: number) {
    return `This action removes a #${id} apiStatus`;
  }
}
