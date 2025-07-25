import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('app')
@Controller()
export class AppController {
  @ApiOperation({ summary: 'Application home page' })
  @ApiResponse({ 
    status: 200, 
    description: 'Application information',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'SkyLoad API' },
        version: { type: 'string', example: '1.0.0' },
        description: { type: 'string', example: 'Smart distributed file processing for cloud uploads' },
        endpoints: {
          type: 'object',
          properties: {
            api: { type: 'string', example: '/api' },
            health: { type: 'string', example: '/health' },
            uploads: { type: 'string', example: '/uploads' }
          }
        }
      }
    }
  })
  @Get()
  getAppInfo() {
    return {
      name: 'SkyLoad API',
      version: '1.0.0',
      description: 'Smart distributed file processing for cloud uploads',
      endpoints: {
        api: '/api',
        health: '/health',
        uploads: '/uploads'
      }
    };
  }
} 