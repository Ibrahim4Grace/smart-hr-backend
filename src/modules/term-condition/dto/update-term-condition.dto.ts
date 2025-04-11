import { PartialType } from '@nestjs/mapped-types';
import { CreateTermConditionDto } from './create-term-condition.dto';

export class UpdateTermConditionDto extends PartialType(CreateTermConditionDto) {}
