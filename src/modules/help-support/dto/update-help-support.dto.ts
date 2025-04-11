import { PartialType } from '@nestjs/mapped-types';
import { CreateHelpSupportDto } from './create-help-support.dto';

export class UpdateHelpSupportDto extends PartialType(CreateHelpSupportDto) {}
