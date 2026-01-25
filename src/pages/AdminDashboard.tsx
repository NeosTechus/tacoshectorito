import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  ChefHat, 
  Truck,
  RefreshCw,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  ArrowLeft,
  LogOut,
  Bell,
  BellOff,
  Check,
  X as XIcon,
  AlertCircle,
  Calculator,
  CreditCard,
  Server,
  Zap
} from 'lucide-react';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const API_URL = import.meta.env.VITE_APP_URL || '';

interface Order {
  _id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: { name: string; qty: number }[];
  totalAmount: number;
  status: string;
  prepTimeMinutes: number;
  createdAt: string;
  estimatedReadyAt: string;
}

const ORDER_STATUSES = ['pending', 'received', 'preparing', 'ready', 'completed', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'hsl(25, 95%, 53%)', // Orange for pending approval
  received: 'hsl(var(--primary))',
  preparing: 'hsl(45, 93%, 47%)',
  ready: 'hsl(var(--accent))',
  completed: 'hsl(var(--muted-foreground))',
  cancelled: 'hsl(0 72% 51%)',
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('admin_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // Order notifications hook
  const { checkForNewOrders } = useOrderNotifications(orders, isAuthenticated, soundEnabled);

  // Toggle sound and persist preference
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('admin_sound_enabled', String(newValue));
      return newValue;
    });
  }, []);

  // Verify admin token on mount
  useEffect(() => {
    const verifyAdmin = async () => {
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        navigate('/admin/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action: 'verify-admin' }),
        });

        const data = await response.json();

        if (!data.valid) {
          localStorage.removeItem('admin_token');
          navigate('/admin/login');
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      } finally {
        setAuthChecking(false);
      }
    };

    verifyAdmin();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const getAdminToken = () => localStorage.getItem('admin_token');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      const response = await fetch(`${API_URL}/api/orders?admin=true`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await response.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      // Auto-refresh every 10 seconds for real-time updates
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Check for new orders when orders array changes
  useEffect(() => {
    checkForNewOrders();
  }, [orders, checkForNewOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = getAdminToken();
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      
      if (response.ok) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchOrders();
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const updatePrepTime = async (orderId: string, prepTimeMinutes: number) => {
    try {
      const token = getAdminToken();
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ orderId, prepTimeMinutes }),
      });
      
      if (response.ok) {
        toast.success(`Prep time updated to ${prepTimeMinutes} minutes`);
        fetchOrders();
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      toast.error('Failed to update prep time');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'received': return <CheckCircle className="w-4 h-4" />;
      case 'preparing': return <ChefHat className="w-4 h-4" />;
      case 'ready': return <Package className="w-4 h-4" />;
      case 'completed': return <Truck className="w-4 h-4" />;
      case 'cancelled': return <XIcon className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'pending': return 'destructive'; // Highlight pending orders
      case 'received': return 'default';
      case 'preparing': return 'secondary';
      case 'ready': return 'outline';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = 
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order._id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Analytics calculations
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Status distribution for pie chart
  const statusDistribution = ORDER_STATUSES.map(status => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: orders.filter(o => o.status === status).length,
    color: STATUS_COLORS[status],
  }));

  // Orders by hour (last 7 days)
  const ordersByHour = Array.from({ length: 24 }, (_, hour) => {
    const count = orders.filter(o => {
      const orderHour = new Date(o.createdAt).getHours();
      return orderHour === hour;
    }).length;
    return { hour: `${hour}:00`, orders: count };
  });

  // Revenue by day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate.toDateString() === date.toDateString();
    });
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      orders: dayOrders.length,
    };
  });

  // Show loading state while checking auth
  if (authChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-display font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={toggleSound} 
              variant={soundEnabled ? "default" : "outline"} 
              size="sm"
              title={soundEnabled ? "Sound notifications ON" : "Sound notifications OFF"}
            >
              {soundEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </Button>
            <Button onClick={fetchOrders} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleLogout} variant="ghost" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Pending Orders Section */}
        {orders.filter(o => o.status === 'pending').length > 0 && (
          <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-display text-amber-800 dark:text-amber-200">
                      Pending Orders
                    </CardTitle>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      {orders.filter(o => o.status === 'pending').length} order(s) awaiting approval
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {orders
                .filter(o => o.status === 'pending')
                .map((order) => (
                  <div
                    key={order._id}
                    className="bg-background rounded-xl p-4 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{order._id.slice(-8).toUpperCase()}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {order.customerName || 'Guest'}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {order.items.map((item, i) => (
                          <span key={i}>
                            {item.qty}x {item.name}
                            {i < order.items.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">${order.totalAmount.toFixed(2)}</span>
                        <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                        {order.customerPhone && <span>{order.customerPhone}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => updateOrderStatus(order._id, 'cancelled')}
                      >
                        <XIcon className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => updateOrderStatus(order._id, 'received')}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              <ShoppingBag className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{orders.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {todayOrders.length} today
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="w-5 h-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ${todayRevenue.toFixed(2)} today
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
              <TrendingUp className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">${avgOrderValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Per order average
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
              <Users className="w-5 h-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pending completion
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2 bg-card shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg font-display">Revenue (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="bg-card shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg font-display">Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {statusDistribution.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs text-muted-foreground">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders by Hour */}
        <Card className="bg-card shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg font-display">Orders by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ordersByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="hour" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10}
                  interval={2}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--accent))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost & Usage Analytics */}
        <CostAnalyticsDashboard 
          orders={orders} 
          todayOrders={todayOrders} 
          totalRevenue={totalRevenue} 
        />

        {/* Orders Table */}
        <Card id="orders-table" className="bg-card shadow-soft">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg font-display">Orders</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prep Time</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Loading orders...
                      </TableCell>
                    </TableRow>
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-mono text-xs">
                          {order._id.slice(-8)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customerName || 'Guest'}</div>
                            <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {order.items.map((item, i) => (
                              <span key={i}>
                                {item.qty}x {item.name}
                                {i < order.items.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">${order.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(order.status)} className="gap-1">
                            {getStatusIcon(order.status)}
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.prepTimeMinutes.toString()}
                            onValueChange={(value) => updatePrepTime(order._id, parseInt(value))}
                          >
                            <SelectTrigger className="w-20 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[5, 10, 15, 20, 25, 30, 45, 60].map((mins) => (
                                <SelectItem key={mins} value={mins.toString()}>
                                  {mins}m
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(value) => updateOrderStatus(order._id, value)}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ORDER_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

// Cost Analytics Dashboard Component
interface CostAnalyticsProps {
  orders: Order[];
  todayOrders: Order[];
  totalRevenue: number;
}

const CostAnalyticsDashboard = ({ orders, todayOrders, totalRevenue }: CostAnalyticsProps) => {
  // Calculate cost estimates
  const costMetrics = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'ready');
    
    // Stripe fees: 2.9% + $0.30 per transaction
    const stripeFeePercentage = 0.029;
    const stripeFeeFixed = 0.30;
    const totalStripeFees = completedOrders.reduce((sum, order) => {
      return sum + (order.totalAmount * stripeFeePercentage) + stripeFeeFixed;
    }, 0);
    
    // Vercel serverless estimates (per order: ~3-5 function invocations)
    const invocationsPerOrder = 4;
    const totalInvocations = orders.length * invocationsPerOrder;
    const freeInvocations = 100000;
    const paidInvocationRate = 0.0000006; // $0.60 per million
    const vercelCost = Math.max(0, (totalInvocations - freeInvocations) * paidInvocationRate);
    
    // MongoDB estimates (free tier: 512MB, ~1KB per order)
    const avgOrderSizeKB = 1;
    const totalStorageMB = (orders.length * avgOrderSizeKB) / 1024;
    const freeStorageMB = 512;
    const mongoDBCost = totalStorageMB > freeStorageMB ? (totalStorageMB - freeStorageMB) * 0.10 : 0;
    
    // Email costs (Resend: $0.001 per email, 3000 free)
    const emailsPerOrder = 1;
    const totalEmails = orders.length * emailsPerOrder;
    const freeEmails = 3000;
    const emailCost = Math.max(0, (totalEmails - freeEmails) * 0.001);
    
    // Total operational cost
    const totalOperationalCost = totalStripeFees + vercelCost + mongoDBCost + emailCost;
    
    // Net revenue
    const netRevenue = totalRevenue - totalOperationalCost;
    
    // Cost per order
    const costPerOrder = orders.length > 0 ? totalOperationalCost / orders.length : 0;
    
    // Profit margin
    const profitMargin = totalRevenue > 0 ? ((netRevenue / totalRevenue) * 100) : 0;
    
    // Free tier usage percentages
    const vercelUsagePercent = (totalInvocations / freeInvocations) * 100;
    const mongoUsagePercent = (totalStorageMB / freeStorageMB) * 100;
    const emailUsagePercent = (totalEmails / freeEmails) * 100;
    
    return {
      stripeFees: totalStripeFees,
      vercelCost,
      mongoDBCost,
      emailCost,
      totalOperationalCost,
      netRevenue,
      costPerOrder,
      profitMargin,
      totalInvocations,
      totalStorageMB,
      totalEmails,
      vercelUsagePercent,
      mongoUsagePercent,
      emailUsagePercent,
    };
  }, [orders, totalRevenue]);

  // Monthly projection
  const monthlyProjection = useMemo(() => {
    const daysWithOrders = new Set(orders.map(o => new Date(o.createdAt).toDateString())).size;
    const avgOrdersPerDay = daysWithOrders > 0 ? orders.length / daysWithOrders : todayOrders.length;
    const projectedMonthlyOrders = avgOrdersPerDay * 30;
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const projectedMonthlyRevenue = projectedMonthlyOrders * avgOrderValue;
    const projectedMonthlyCost = projectedMonthlyOrders * costMetrics.costPerOrder;
    
    return {
      orders: projectedMonthlyOrders,
      revenue: projectedMonthlyRevenue,
      cost: projectedMonthlyCost,
      profit: projectedMonthlyRevenue - projectedMonthlyCost,
    };
  }, [orders, todayOrders, totalRevenue, costMetrics.costPerOrder]);

  return (
    <Card className="bg-card shadow-soft">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-display">Cost & Usage Analytics</CardTitle>
            <p className="text-sm text-muted-foreground">Estimated operational costs and projections</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cost Breakdown Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-muted-foreground">Stripe Fees</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              ${costMetrics.stripeFees.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">2.9% + $0.30/txn</p>
          </div>
          
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-muted-foreground">Vercel</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              ${costMetrics.vercelCost.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {costMetrics.totalInvocations.toLocaleString()} invocations
            </p>
          </div>
          
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium text-muted-foreground">MongoDB</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              ${costMetrics.mongoDBCost.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {costMetrics.totalStorageMB.toFixed(2)} MB used
            </p>
          </div>
          
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-medium text-muted-foreground">Emails</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              ${costMetrics.emailCost.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {costMetrics.totalEmails} sent
            </p>
          </div>
        </div>

        {/* Free Tier Usage */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Free Tier Usage</h4>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Vercel Invocations</span>
                <span className="font-medium">{Math.min(100, costMetrics.vercelUsagePercent).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    costMetrics.vercelUsagePercent > 80 ? 'bg-destructive' : 
                    costMetrics.vercelUsagePercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, costMetrics.vercelUsagePercent)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">MongoDB Storage</span>
                <span className="font-medium">{Math.min(100, costMetrics.mongoUsagePercent).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    costMetrics.mongoUsagePercent > 80 ? 'bg-destructive' : 
                    costMetrics.mongoUsagePercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, costMetrics.mongoUsagePercent)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Resend Emails</span>
                <span className="font-medium">{Math.min(100, costMetrics.emailUsagePercent).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    costMetrics.emailUsagePercent > 80 ? 'bg-destructive' : 
                    costMetrics.emailUsagePercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, costMetrics.emailUsagePercent)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center p-4 bg-destructive/10 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">Total Operational Cost</p>
            <p className="text-2xl font-bold text-destructive">
              ${costMetrics.totalOperationalCost.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ${costMetrics.costPerOrder.toFixed(2)}/order
            </p>
          </div>
          
          <div className="text-center p-4 bg-green-500/10 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">Net Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              ${costMetrics.netRevenue.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {costMetrics.profitMargin.toFixed(1)}% margin
            </p>
          </div>
          
          <div className="text-center p-4 bg-primary/10 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">Monthly Projection</p>
            <p className="text-2xl font-bold text-primary">
              ${monthlyProjection.profit.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ~{monthlyProjection.orders.toFixed(0)} orders
            </p>
          </div>
        </div>

        {/* Cost Optimization Tips */}
        {(costMetrics.vercelUsagePercent > 50 || costMetrics.mongoUsagePercent > 50) && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
              💡 Cost Optimization Tips
            </h4>
            <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
              {costMetrics.vercelUsagePercent > 50 && (
                <li>• Consider caching frequently accessed data to reduce function calls</li>
              )}
              {costMetrics.mongoUsagePercent > 50 && (
                <li>• Archive completed orders older than 90 days to reduce storage</li>
              )}
              <li>• Enable Stripe's fee optimization for high-volume processing</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;
