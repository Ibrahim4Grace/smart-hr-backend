import { PartialType } from '@nestjs/mapped-types';
import { CreateApiStatusDto } from './create-api-status.dto';

export class UpdateApiStatusDto extends PartialType(CreateApiStatusDto) {}
