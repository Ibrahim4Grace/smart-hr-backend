import { skipAuth } from '@shared/helpers/skipAuth';
import { Controller, Get } from '@nestjs/common';
import * as os from 'os';

@Controller()
export default class HealthController {
  @skipAuth()
  @Get('/')
  public home() {
    return { status_code: 200, message: 'Welcome to Smart-Hr NestJs Backend Endpoint' };
  }

  @skipAuth()
  @Get('api')
  public api() {
    return { status_code: 200, message: 'Welcome to Smart-Hr NestJs Backend Endpoint' };
  }

  @skipAuth()
  @Get('api/v1')
  public v1() {
    return { status_code: 200, message: 'Welcome to version 1 of Smart-Hr NestJS Backend Endpoint' };
  }

  @skipAuth()
  @Get('health')
  public health() {
    const networkInterfaces = os.networkInterfaces();
    let localIpAddress = 'Not available';

    // Iterate over network interfaces to find the first non-internal IPv4 address
    for (const interfaceKey in networkInterfaces) {
      const interfaceDetails = networkInterfaces[interfaceKey];
      for (const detail of interfaceDetails) {
        if (detail.family === 'IPv4' && !detail.internal) {
          localIpAddress = detail.address;
          break;
        }
      }
      if (localIpAddress !== 'Not available') break;
    }

    return { status_code: 200, message: 'This is a healthy endpoint', ip: localIpAddress };
  }
}
