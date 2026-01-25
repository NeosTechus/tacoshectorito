import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  ChefHat, 
  Truck,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  ArrowLeft,
  LogOut,
  Bell,
  BellOff,
  Check,
  X as XIcon,
  AlertCircle,
  User,
  Phone
} from 'lucide-react';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { API_BASE } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const API_URL = API_BASE;

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

const ORDER_STATUSES = ['pending', 'received', 'preparing', 'ready', 'completed'];

const ChefDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('chef_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [acceptingOrders, setAcceptingOrders] = useState(() => {
    const saved = localStorage.getItem('chef_accepting_orders');
    return saved !== null ? saved === 'true' : true;
  });
  const [autoRejecting, setAutoRejecting] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  const autoRejectedIdsRef = useRef<Set<string>>(new Set());

  // Order notifications hook
  const { checkForNewOrders, unlockAudio } = useOrderNotifications(orders, isAuthenticated, soundEnabled);

  // Toggle sound
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('chef_sound_enabled', String(newValue));
      if (newValue) {
        unlockAudio();
      }
      return newValue;
    });
  }, [unlockAudio]);

  const toggleAcceptingOrders = useCallback(() => {
    setAcceptingOrders(prev => {
      const newValue = !prev;
      localStorage.setItem('chef_accepting_orders', String(newValue));
      if (newValue) {
        toast.success('Now accepting orders');
      } else {
        toast.error('Order taking paused');
      }
      return newValue;
    });
  }, []);

  // Verify chef token on mount
  useEffect(() => {
    const verifyChef = async () => {
      const token = localStorage.getItem('chef_token');
      
      if (!token) {
        navigate('/chef/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action: 'verify-chef' }),
        });

        const data = await response.json();

        if (!data.valid) {
          localStorage.removeItem('chef_token');
          navigate('/chef/login');
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('chef_token');
        navigate('/chef/login');
      } finally {
        setAuthChecking(false);
      }
    };

    verifyChef();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('chef_token');
    toast.success('Logged out successfully');
    navigate('/chef/login');
  };

  const getChefToken = () => localStorage.getItem('chef_token');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = getChefToken();
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
      // Auto-refresh every 10 seconds
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);


  // Check for new orders
  useEffect(() => {
    checkForNewOrders();
  }, [orders, checkForNewOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    let previousOrders: Order[] = [];
    setOrders((current) => {
      previousOrders = current;
      return current.map((order) =>
        order._id === orderId ? { ...order, status: newStatus } : order
      );
    });

    try {
      const token = getChefToken();
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Order marked as ${newStatus}`);
        fetchOrders();
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      setOrders(previousOrders);
      toast.error('Failed to update order status');
    }
  };

  const acceptAllPending = async () => {
    if (pendingOrders.length === 0 || !acceptingOrders) return;
    try {
      setLoading(true);
      await Promise.all(
        pendingOrders.map(order => updateOrderStatus(order._id, 'received'))
      );
      toast.success(`Accepted ${pendingOrders.length} order(s)`);
      await fetchOrders();
    } catch (error) {
      toast.error('Failed to accept all pending orders');
    } finally {
      setLoading(false);
    }
  };

  const updatePrepTime = async (orderId: string, prepTimeMinutes: number) => {
    let previousOrders: Order[] = [];
    setOrders((current) => {
      previousOrders = current;
      return current.map((order) =>
        order._id === orderId ? { ...order, prepTimeMinutes } : order
      );
    });

    try {
      const token = getChefToken();
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
      setOrders(previousOrders);
      toast.error('Failed to update prep time');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'received': return <CheckCircle className="w-5 h-5" />;
      case 'preparing': return <ChefHat className="w-5 h-5" />;
      case 'ready': return <Package className="w-5 h-5" />;
      case 'completed': return <Truck className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'received': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'preparing': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ready': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Group orders by status
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const receivedOrders = orders.filter(o => o.status === 'received');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  useEffect(() => {
    const rejectPendingIfPaused = async () => {
      if (acceptingOrders || pendingOrders.length === 0 || autoRejecting) return;

      const toReject = pendingOrders.filter(order => !autoRejectedIdsRef.current.has(order._id));
      if (toReject.length === 0) return;

      try {
        setAutoRejecting(true);
        await Promise.all(
          toReject.map(order => updateOrderStatus(order._id, 'cancelled'))
        );
        toReject.forEach(order => autoRejectedIdsRef.current.add(order._id));
        toast.error(`Auto-rejected ${toReject.length} order(s) (taking orders is paused)`);
        await fetchOrders();
      } catch {
        toast.error('Failed to auto-reject pending orders');
      } finally {
        setAutoRejecting(false);
      }
    };

    rejectPendingIfPaused();
  }, [acceptingOrders, pendingOrders, autoRejecting]);

  // Show loading state
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
            <div className="flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-display font-bold text-foreground">Kitchen Display</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={toggleSound} 
              variant={soundEnabled ? "default" : "outline"} 
              size="sm"
              title={soundEnabled ? "Sound ON" : "Sound OFF"}
            >
              {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </Button>
            <Button
              onClick={toggleAcceptingOrders}
              variant={acceptingOrders ? "default" : "outline"}
              size="sm"
              title={acceptingOrders ? "Taking Orders ON" : "Taking Orders OFF"}
            >
              {acceptingOrders ? (
                <>
                  <PauseCircle className="w-4 h-4 mr-2" />
                  Taking Orders
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Paused
                </>
              )}
            </Button>
            <Button
              onClick={acceptAllPending}
              variant="outline"
              size="sm"
              disabled={loading || pendingOrders.length === 0 || !acceptingOrders}
            >
              <Check className="w-4 h-4 mr-2" />
              Accept All
            </Button>
            <Button onClick={fetchOrders} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleLogout} variant="ghost" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-6 gap-4">
          <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-amber-600">{pendingOrders.length}</div>
              <div className="text-sm text-amber-700 dark:text-amber-400">Pending</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{receivedOrders.length}</div>
              <div className="text-sm text-blue-700 dark:text-blue-400">Received</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{preparingOrders.length}</div>
              <div className="text-sm text-purple-700 dark:text-purple-400">Preparing</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{readyOrders.length}</div>
              <div className="text-sm text-green-700 dark:text-green-400">Ready</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-slate-600">{completedOrders.length}</div>
              <div className="text-sm text-slate-700 dark:text-slate-400">Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{cancelledOrders.length}</div>
              <div className="text-sm text-red-700 dark:text-red-400">Rejected</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Orders - Needs Approval */}
        {pendingOrders.length > 0 && (
          <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-lg text-amber-800 dark:text-amber-200">
                  New Orders - Awaiting Approval ({pendingOrders.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingOrders.map((order) => (
                <OrderCard 
                  key={order._id} 
                  order={order} 
                  onStatusChange={updateOrderStatus}
                  onPrepTimeChange={updatePrepTime}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  showApprovalButtons
                  approvalDisabled={!acceptingOrders}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Active Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Received Column */}
          <Card className="bg-card">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-lg">Received ({receivedOrders.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
              {receivedOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No orders</p>
              ) : (
                receivedOrders.map((order) => (
                  <OrderCard 
                    key={order._id} 
                    order={order} 
                    onStatusChange={updateOrderStatus}
                    onPrepTimeChange={updatePrepTime}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Preparing Column - Enlarged */}
          <Card className="bg-card col-span-2">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-purple-500" />
                <CardTitle className="text-lg">Preparing ({preparingOrders.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 space-y-3 max-h-[800px] overflow-y-auto">
              {preparingOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No orders</p>
              ) : (
                preparingOrders.map((order) => (
                  <OrderCard 
                    key={order._id} 
                    order={order} 
                    onStatusChange={updateOrderStatus}
                    onPrepTimeChange={updatePrepTime}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Ready Column */}
          <Card className="bg-card">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-green-500" />
                <CardTitle className="text-lg">Ready for Pickup ({readyOrders.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
              {readyOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No orders</p>
              ) : (
                readyOrders.map((order) => (
                  <OrderCard 
                    key={order._id} 
                    order={order} 
                    onStatusChange={updateOrderStatus}
                    onPrepTimeChange={updatePrepTime}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Completed and Rejected Orders */}
        <div className="space-y-6">
          {/* Completed Orders Section */}
          <Card className="bg-card">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-slate-500" />
                <CardTitle className="text-lg">Completed Orders ({completedOrders.length})</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCompleted((prev) => !prev)}
              >
                {showCompleted ? 'Hide' : 'Show'}
              </Button>
            </CardHeader>
            {showCompleted && (
              <CardContent className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                {completedOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No completed orders</p>
                ) : (
                  completedOrders.map((order) => (
                    <OrderCard 
                      key={order._id} 
                      order={order} 
                      onStatusChange={updateOrderStatus}
                      onPrepTimeChange={updatePrepTime}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                    />
                  ))
                )}
              </CardContent>
            )}
          </Card>

          {/* Rejected Orders Section */}
          <Card className="bg-card">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <XIcon className="w-5 h-5 text-red-500" />
                <CardTitle className="text-lg">Rejected Orders ({cancelledOrders.length})</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRejected((prev) => !prev)}
              >
                {showRejected ? 'Hide' : 'Show'}
              </Button>
            </CardHeader>
            {showRejected && (
              <CardContent className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                {cancelledOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No rejected orders</p>
                ) : (
                  cancelledOrders.map((order) => (
                    <OrderCard 
                      key={order._id} 
                      order={order} 
                      onStatusChange={updateOrderStatus}
                      onPrepTimeChange={updatePrepTime}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                    />
                  ))
                )}
              </CardContent>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

// Order Card Component
interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: string) => void;
  onPrepTimeChange: (orderId: string, time: number) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  showApprovalButtons?: boolean;
  approvalDisabled?: boolean;
}

const OrderCard = ({ 
  order, 
  onStatusChange, 
  onPrepTimeChange,
  getStatusIcon, 
  getStatusColor,
  showApprovalButtons,
  approvalDisabled
}: OrderCardProps) => {
  const timeAgo = (date: string) => {
    const now = Date.now();
    const orderTime = new Date(date).getTime();
    const diffInMinutes = Math.floor((now - orderTime) / 60000);

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ${diffInMinutes % 60}m ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ${diffInHours % 24}h ago`;
  };

  const getNextStatus = (current: string) => {
    const statusFlow: Record<string, string> = {
      received: 'preparing',
      preparing: 'ready',
      ready: 'completed',
    };
    return statusFlow[current];
  };

  return (
    <div className="bg-white dark:bg-card rounded-2xl shadow-md border border-border p-6 mb-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-base font-bold text-orange-600 tracking-wider">
            #{order._id.slice(-6).toUpperCase()}
          </span>
          <Badge className={`${getStatusColor(order.status)} flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-xs capitalize`}> 
            {getStatusIcon(order.status)}
            {order.status}
          </Badge>
        </div>
        <span className="text-xs text-gray-400">{timeAgo(order.createdAt)}</span>
      </div>

      {/* Items */}
      <div className="space-y-1">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="font-bold text-foreground">{item.qty}x</span>
            <span className="text-foreground">{item.name}</span>
          </div>
        ))}
      </div>

      {/* Customer Info */}
      <div className="flex items-center gap-4 text-gray-500 text-sm border-t pt-3">
        <span className="flex items-center gap-1"><User className="w-4 h-4" />{order.customerName || 'Guest'}</span>
        {order.customerPhone && (
          <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{order.customerPhone}</span>
        )}
      </div>

      {/* Actions */}
      {showApprovalButtons ? (
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => onStatusChange(order._id, 'cancelled')}
            disabled={approvalDisabled}
          >
            <XIcon className="w-4 h-4 mr-1" />
            Reject
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onStatusChange(order._id, 'received')}
            disabled={approvalDisabled}
          >
            <Check className="w-4 h-4 mr-1" />
            Accept
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-2 flex-wrap">
          {/* Quick Status Selector */}
          {['received', 'preparing', 'ready', 'completed'].includes(order.status) && (
            <Select
              value={order.status}
              onValueChange={(value) => onStatusChange(order._id, value)}
            >
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          )}
          {/* Prep Time Selector */}
          <Select
            value={order.prepTimeMinutes.toString()}
            onValueChange={(value) => onPrepTimeChange(order._id, parseInt(value))}
          >
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 15, 20, 25, 30, 45, 60].map((mins) => (
                <SelectItem key={mins} value={mins.toString()}>
                  {mins} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Next Status Button */}
          {getNextStatus(order.status) && (
            <Button
              size="sm"
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow whitespace-nowrap"
              onClick={() => onStatusChange(order._id, getNextStatus(order.status))}
            >
              {order.status === 'received' && 'Start Preparing'}
              {order.status === 'preparing' && 'Mark Ready'}
              {order.status === 'ready' && 'Complete'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChefDashboard;
