import { useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface Order {
  _id: string;
  customerName: string;
  items: { name: string; qty: number }[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

// Generate a loud, urgent alert sound for pending orders using Web Audio API
const playPendingOrderSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a loud alert pattern with alternating tones
    const playTone = (frequency: number, startTime: number, duration: number, volume = 0.9) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(volume, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.02, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    // Loud, alternating pattern
    playTone(1400, now, 0.2, 0.9);
    playTone(900, now + 0.25, 0.2, 0.9);
    playTone(1400, now + 0.5, 0.2, 0.9);
    playTone(900, now + 0.75, 0.2, 0.9);

    // Clean up after sounds finish
    setTimeout(() => {
      audioContext.close();
    }, 1500);
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

export const useOrderNotifications = (
  orders: Order[],
  isAuthenticated: boolean,
  soundEnabled: boolean
) => {
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);
  const soundIntervalRef = useRef<number | null>(null);

  const unlockAudio = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Play a near-silent blip to unlock audio on user gesture.
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.0001;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.05);

      setTimeout(() => {
        audioContext.close();
      }, 200);
    } catch (error) {
      console.error('Error unlocking audio context:', error);
    }
  }, []);

  const checkForNewOrders = useCallback(() => {
    if (!isAuthenticated || orders.length === 0) return;

    const currentOrderIds = new Set(orders.map(o => o._id));
    
    // Skip notification on initial load
    if (isInitialLoadRef.current) {
      previousOrderIdsRef.current = currentOrderIds;
      isInitialLoadRef.current = false;
      return;
    }

    // Find new pending orders (requires admin approval)
    const newPendingOrders = orders.filter(
      order => !previousOrderIdsRef.current.has(order._id) && order.status === 'pending'
    );

    if (newPendingOrders.length > 0) {
      // Play urgent sound if enabled
      if (soundEnabled) {
        playPendingOrderSound();
      }

      // Show toast for each new pending order
      newPendingOrders.forEach(order => {
        const itemsSummary = order.items
          .map(item => `${item.qty}x ${item.name}`)
          .join(', ');
        
        toast.warning(
          `🔔 New Order Needs Approval!`,
          {
            description: `${order.customerName || 'Guest'}: ${itemsSummary} - $${order.totalAmount.toFixed(2)}`,
            duration: 15000,
            action: {
              label: 'Review',
              onClick: () => {
                // Scroll to top where pending orders section is
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }
          }
        );
      });

      // Update page title with urgent indicator
      const originalTitle = document.title;
      document.title = `🚨 ${newPendingOrders.length} Order${newPendingOrders.length > 1 ? 's' : ''} Waiting!`;
      
      setTimeout(() => {
        document.title = originalTitle;
      }, 10000);
    }

    // Update the reference for next comparison
    previousOrderIdsRef.current = currentOrderIds;
  }, [orders, isAuthenticated, soundEnabled]);

  useEffect(() => {
    if (!isAuthenticated || !soundEnabled) {
      if (soundIntervalRef.current) {
        window.clearInterval(soundIntervalRef.current);
        soundIntervalRef.current = null;
      }
      return;
    }

    const pendingCount = orders.filter(order => order.status === 'pending').length;
    if (pendingCount > 0) {
      if (!soundIntervalRef.current) {
        playPendingOrderSound();
        soundIntervalRef.current = window.setInterval(() => {
          playPendingOrderSound();
        }, 1500);
      }
    } else if (soundIntervalRef.current) {
      window.clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
  }, [orders, isAuthenticated, soundEnabled]);

  // Reset on unmount
  useEffect(() => {
    return () => {
      if (soundIntervalRef.current) {
        window.clearInterval(soundIntervalRef.current);
      }
      isInitialLoadRef.current = true;
      previousOrderIdsRef.current = new Set();
    };
  }, []);

  return { checkForNewOrders, unlockAudio };
};
