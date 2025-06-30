# Server-Sent Events (SSE) Implementation

This module provides a comprehensive Server-Sent Events (SSE) implementation for real-time updates in your NestJS application.

## Features

- **Real-time Updates**: Send instant notifications and updates to connected clients
- **User-specific Events**: Target specific users with personalized notifications
- **Broadcast Events**: Send events to all connected users
- **Connection Management**: Automatic cleanup of inactive connections
- **Heartbeat Support**: Keep connections alive with periodic heartbeats
- **Reusable**: Easy to integrate with any module in your application

## Architecture

### Core Components

1. **SSEService**: Main service for managing SSE connections and sending events
2. **SSEController**: HTTP controller for establishing SSE connections
3. **SSENotificationService**: Helper service with pre-built notification methods
4. **SSEModule**: Module that exports all SSE components

### Event Types

The SSE implementation supports various event types:

- `connection_established`: Initial connection confirmation
- `heartbeat`: Periodic keep-alive messages
- `notification`: General notifications
- `calendar_event_*`: Calendar-related events
- `employee_*`: Employee-related events
- `leave_request_*`: Leave request events
- `chat_*`: Chat-related events
- `task_*`: Task/todo events
- `project_*`: Project events
- `system_notification`: System-wide notifications
- `dashboard_update`: Dashboard data updates
- `alert`: Alert notifications

## Usage

### 1. Frontend Connection

```javascript
// Connect to SSE endpoint
const eventSource = new EventSource('/api/sse/connect', {
  headers: {
    'Authorization': `Bearer ${token}` // Include your JWT token
  }
});

// Listen for events
eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Received SSE event:', data);
  
  switch(data.type) {
    case 'calendar_event_created':
      handleNewCalendarEvent(data.data);
      break;
    case 'notification':
      showNotification(data.data);
      break;
    case 'heartbeat':
      // Connection is alive
      break;
  }
};

// Handle connection errors
eventSource.onerror = function(error) {
  console.error('SSE connection error:', error);
  // Implement reconnection logic
};

// Close connection when done
// eventSource.close();
```

### 2. Backend Integration

#### Basic Usage in Services

```typescript
import { SSEService } from '@shared/sse/sse.service';

@Injectable()
export class YourService {
  constructor(private readonly sseService: SSEService) {}

  async createSomething(data: any, userId: string) {
    // Your business logic
    const result = await this.repository.save(data);
    
    // Send real-time update
    this.sseService.sendToUser(userId, 'something_created', {
      data: result,
      message: 'New item created successfully'
    });
    
    return result;
  }
}
```

#### Using the Notification Service

```typescript
import { SSENotificationService } from '@shared/sse/sse-notification.service';

@Injectable()
export class YourService {
  constructor(private readonly sseNotificationService: SSENotificationService) {}

  async createEmployee(employeeData: any, hrId: string) {
    const employee = await this.employeeRepository.save(employeeData);
    
    // Send employee notification
    this.sseNotificationService.sendEmployeeNotification(
      hrId, 
      employee, 
      'created'
    );
    
    return employee;
  }

  async approveLeaveRequest(leaveId: string, employeeId: string) {
    const leaveRequest = await this.leaveRepository.findOne(leaveId);
    leaveRequest.status = 'approved';
    await this.leaveRepository.save(leaveRequest);
    
    // Send leave notification
    this.sseNotificationService.sendLeaveNotification(
      employeeId,
      leaveRequest,
      'approved'
    );
    
    return leaveRequest;
  }
}
```

### 3. Module Integration

Add the SSE module to your module imports:

```typescript
import { SSEModule } from '@shared/sse/sse.module';

@Module({
  imports: [
    // ... other imports
    SSEModule
  ],
  // ... rest of module config
})
export class YourModule {}
```

## API Endpoints

### SSE Connection
- **GET** `/api/sse/connect` - Establish SSE connection
- **GET** `/api/sse/status` - Get connection status
- **GET** `/api/sse/connections` - Get all active connections (Admin)

### Calendar Events (Example)
- **POST** `/api/calendar/reminders/upcoming` - Send upcoming event reminders
- **POST** `/api/calendar/reminders/:eventId` - Send specific event reminder

## Event Structure

All SSE events follow this structure:

```typescript
interface SSEEvent {
  type: string;           // Event type identifier
  data: any;             // Event payload
  userId?: string;        // Target user (optional for broadcasts)
  timestamp: Date;        // Event timestamp
}
```

## Advanced Usage

### Custom Event Types

```typescript
// Send custom event
this.sseService.sendToUser(userId, 'custom_event_type', {
  customData: 'value',
  action: 'performed',
  metadata: { key: 'value' }
});
```

### Bulk Notifications

```typescript
// Send to multiple users
const userIds = ['user1', 'user2', 'user3'];
this.sseService.sendToUsers(userIds, 'bulk_notification', {
  message: 'System maintenance scheduled',
  type: 'warning'
});
```

### Broadcast Events

```typescript
// Send to all connected users
this.sseService.sendToAll('system_announcement', {
  message: 'System will be down for maintenance',
  scheduledTime: '2024-01-01T02:00:00Z'
});
```

### Connection Management

```typescript
// Check if user has active connection
const hasConnection = this.sseService.hasConnection(userId);

// Get connection count
const totalConnections = this.sseService.getConnectionCount();

// Get active connections
const activeConnections = this.sseService.getActiveConnections();
```

## Error Handling

The SSE implementation includes comprehensive error handling:

- Automatic connection cleanup on errors
- Graceful handling of disconnected clients
- Logging of connection events and errors
- Periodic cleanup of inactive connections

## Performance Considerations

- Connections are automatically cleaned up after 30 minutes of inactivity
- Heartbeat messages are sent every 30 seconds to keep connections alive
- The service uses RxJS observables for efficient event streaming
- Connection limits can be implemented if needed

## Security

- All SSE endpoints require authentication via JWT
- User-specific events are filtered to ensure users only receive their own events
- CORS headers are properly configured for cross-origin requests

## Testing

```typescript
// Test SSE connection
describe('SSE Service', () => {
  it('should send events to connected users', async () => {
    const userId = 'test-user';
    const eventStream = sseService.createConnection(userId);
    
    let receivedEvent: any;
    eventStream.subscribe(event => {
      receivedEvent = event;
    });
    
    sseService.sendToUser(userId, 'test_event', { message: 'test' });
    
    expect(receivedEvent).toBeDefined();
    expect(receivedEvent.type).toBe('test_event');
  });
});
```

## Troubleshooting

### Common Issues

1. **Connection not established**: Check authentication token and CORS settings
2. **Events not received**: Verify user ID and event type matching
3. **Connection drops**: Implement reconnection logic in frontend
4. **Memory leaks**: Ensure proper cleanup of subscriptions

### Debug Mode

Enable debug logging by setting the log level:

```typescript
// In your service
this.logger.debug('SSE event sent', { userId, eventType });
```

## Examples

See the calendar module integration for a complete example of how to use SSE for real-time updates in your application. 