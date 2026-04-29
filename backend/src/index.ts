import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Types
interface Event {
  id: string;
  eventType: string;
  userId: string;
  properties: Record<string, any>;
  timestamp: Date;
}

// In-memory storage (replace with database in production)
let events: Event[] = [];

// Seed some demo data
const seedDemoData = () => {
  const demoEvents: Event[] = [
    {
      id: '1',
      eventType: 'page_view',
      userId: 'user_123',
      properties: { page: '/home', referrer: 'google' },
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      eventType: 'click',
      userId: 'user_123',
      properties: { button: 'signup', page: '/home' },
      timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000)
    },
    {
      id: '3',
      eventType: 'page_view',
      userId: 'user_456',
      properties: { page: '/pricing', referrer: 'direct' },
      timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000)
    },
    {
      id: '4',
      eventType: 'purchase',
      userId: 'user_456',
      properties: { amount: 49.99, product: 'premium' },
      timestamp: new Date(Date.now() - 21 * 60 * 60 * 1000)
    },
    {
      id: '5',
      eventType: 'click',
      userId: 'user_789',
      properties: { button: 'buy_now', page: '/pricing' },
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  ];
  events.push(...demoEvents);
};

seedDemoData();

// API Endpoints
app.post('/api/collect', (req, res) => {
  const { eventType, userId, properties } = req.body;
  
  const newEvent: Event = {
    id: Math.random().toString(36).substr(2, 9),
    eventType: eventType || 'custom',
    userId: userId || 'anonymous',
    properties: properties || {},
    timestamp: new Date()
  };
  
  events.push(newEvent);
  console.log(`Event collected: ${newEvent.eventType} from ${newEvent.userId}`);
  
  res.status(201).json({ success: true, event: newEvent });
});

app.get('/api/analytics', (req, res) => {
  const { days = '7' } = req.query;
  const daysFilter = parseInt(days as string);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysFilter);
  
  // Filter events by date range
  const filteredEvents = events.filter(e => e.timestamp >= cutoffDate);
  
  // Calculate metrics
  const totalEvents = filteredEvents.length;
  const uniqueUsers = new Set(filteredEvents.map(e => e.userId)).size;
  
  // Events by type
  const eventsByType: Record<string, number> = {};
  filteredEvents.forEach(e => {
    eventsByType[e.eventType] = (eventsByType[e.eventType] || 0) + 1;
  });
  
  // Events over time (by day)
  const eventsByDay: Record<string, number> = {};
  filteredEvents.forEach(e => {
    const day = e.timestamp.toISOString().split('T')[0];
    eventsByDay[day] = (eventsByDay[day] || 0) + 1;
  });
  
  const timeSeriesData = Object.entries(eventsByDay).map(([date, count]) => ({
    date,
    count
  })).sort((a, b) => a.date.localeCompare(b.date));
  
  // Top event type
  let topEventType = '';
  let maxCount = 0;
  Object.entries(eventsByType).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topEventType = type;
    }
  });
  
  res.json({
    summary: {
      totalEvents,
      uniqueUsers,
      topEventType,
      avgEventsPerUser: uniqueUsers ? (totalEvents / uniqueUsers).toFixed(2) : 0
    },
    eventsByType,
    timeSeriesData,
    recentEvents: filteredEvents.slice(-10).reverse()
  });
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});