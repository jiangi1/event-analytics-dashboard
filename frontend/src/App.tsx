import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import './App.css';

interface AnalyticsData {
  summary: {
    totalEvents: number;
    uniqueUsers: number;
    topEventType: string;
    avgEventsPerUser: string;
  };
  eventsByType: Record<string, number>;
  timeSeriesData: Array<{ date: string; count: number }>;
  recentEvents: Array<{
    id: string;
    eventType: string;
    userId: string;
    properties: Record<string, any>;
    timestamp: string;
  }>;
}

// Pastel colors for the pie chart only
const COLORS = ['#FFB3BA', '#B5EAD7', '#C7CEEA', '#FFDAC1', '#E2F0CB', '#FFC8DD', '#D4F1F9'];

function App() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [eventType, setEventType] = useState('');
  const [eventProperties, setEventProperties] = useState('{}');

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/analytics?days=${days}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestEvent = async () => {
    try {
      let properties = {};
      try {
        properties = JSON.parse(eventProperties);
      } catch (e) {
        alert('Invalid JSON for properties');
        return;
      }

      await axios.post('http://localhost:3001/api/collect', {
        eventType: eventType || 'custom',
        userId: 'test_user_' + Math.random().toString(36).substr(2, 6),
        properties
      });

      alert('Event sent successfully!');
      fetchAnalytics();
      setEventType('');
      setEventProperties('{}');
    } catch (error) {
      console.error('Error sending event:', error);
      alert('Error sending event');
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 10000);
    return () => clearInterval(interval);
  }, [days]);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (!data) {
    return <div className="error">Failed to load data</div>;
  }

  const pieData = Object.entries(data.eventsByType).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div className="App">
      <header className="dashboard-header">
        <h1>📊 Event Analytics Dashboard</h1>
        <div className="date-filter">
          <label>Show last </label>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={1}>1 day</option>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>Total Events</h3>
          <div className="kpi-value">{data.summary.totalEvents}</div>
        </div>
        <div className="kpi-card">
          <h3>Unique Users</h3>
          <div className="kpi-value">{data.summary.uniqueUsers}</div>
        </div>
        <div className="kpi-card">
          <h3>Top Event Type</h3>
          <div className="kpi-value">{data.summary.topEventType}</div>
        </div>
        <div className="kpi-card">
          <h3>Avg Events/User</h3>
          <div className="kpi-value">{data.summary.avgEventsPerUser}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h2>Events Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.timeSeriesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                interval={0}
                tick={{ fontSize: 11 }}
                angle={data.timeSeriesData.length === 1 ? 0 : -20}
                textAnchor="end"
                height={50}
              />
              <YAxis 
                allowDecimals={false}
                domain={[0, 'auto']}
              />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#a8edea" 
                strokeWidth={2}
                dot={{ r: 4, fill: "#a8edea" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Events by Type</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pieData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#a8edea" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Event Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Events Table */}
      <div className="events-section">
        <h2>Recent Events</h2>
        <div className="events-table-container">
          <table className="events-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event Type</th>
                <th>User ID</th>
                <th>Properties</th>
              </tr>
            </thead>
            <tbody>
              {data.recentEvents.map((event) => (
                <tr key={event.id}>
                  <td>{new Date(event.timestamp).toLocaleString()}</td>
                  <td>
                    <span className="event-badge">{event.eventType}</span>
                  </td>
                  <td>{event.userId}</td>
                  <td>
                    <pre>{JSON.stringify(event.properties, null, 2)}</pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Simulator */}
      <div className="simulator-section">
        <h2>🎮 Event Simulator (Test Collection)</h2>
        <div className="simulator-form">
          <input
            type="text"
            placeholder="Event Type (e.g., click, purchase, page_view)"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          />
          <textarea
            placeholder='Properties (JSON) e.g., {"button": "signup", "page": "/home"}'
            value={eventProperties}
            onChange={(e) => setEventProperties(e.target.value)}
            rows={3}
          />
          <button onClick={sendTestEvent}>Send Test Event</button>
        </div>
      </div>
    </div>
  );
}

export default App;