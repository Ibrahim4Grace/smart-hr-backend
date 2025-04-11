import { SetMetadata } from '@nestjs/common';

export const RESPONSE_HANDLED_KEY = 'response_handled';
export const ResponseHandled = () => SetMetadata(RESPONSE_HANDLED_KEY, true);
