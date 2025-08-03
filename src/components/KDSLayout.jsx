import React, { useState, useEffect, useCallback } from 'react';
import OrderCard from './OrderCard';
import QueueSidebar from './QueueSidebar';
import io from 'socket.io-client';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function KDSLayout() {
  const [allOrders, setAllOrders] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lastEnterTime, setLastEnterTime] = useState(0);
  const [displayStartIndex, setDisplayStartIndex] = useState(0);
  const [socket, setSocket] = useState(null);
  const MAX_DISPLAYED_ORDERS = 6;

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Load initial orders from database
  useEffect(() => {
    const fetchInitialOrders = async () => {
      try {
        const response = await fetch('http://localhost:5000/orders');
        if (response.ok) {
          const orders = await response.json();
          const ordersWithTimers = orders.map(order => ({
            ...order,
            startTime: Date.now() - (15 * 60 - (order.initialDuration || 15 * 60)) * 1000,
            timeRemaining: formatTime(order.initialDuration || 15 * 60),
            startTimeFormatted: order.startedAt
          }));
          setAllOrders(ordersWithTimers);
        }
      } catch (error) {
        console.error('Error loading initial orders:', error);
      }
    };

    fetchInitialOrders();
  }, []);

  // Socket.IO event handlers
  useEffect(() => {
    if (!socket) return;

    const handlers = {
      connect: () => console.log('Connected to WebSocket server'),
      new_order: (newOrder) => {
        setAllOrders(prevOrders => {
          const orderWithTimerInfo = {
            ...newOrder,
            startTime: Date.now(),
            initialDuration: newOrder.initialDuration || (15 * 60),
            status: newOrder.status || 'COOKING',
            timeRemaining: formatTime(newOrder.initialDuration || 15 * 60),
            startTimeFormatted: newOrder.startedAt
          };
          
          const updatedOrders = [...prevOrders, orderWithTimerInfo];
          
          if (prevOrders.length === 0 && updatedOrders.length > 0) {
            adjustDisplayWindow(0, updatedOrders.length);
          } else if (selectedIndex >= displayStartIndex + MAX_DISPLAYED_ORDERS) {
            adjustDisplayWindow(selectedIndex, updatedOrders.length);
          }
          
          return updatedOrders;
        });
      },
      order_updated: (updatedOrder) => {
        setAllOrders(prevOrders => prevOrders.map(order =>
          order.id === updatedOrder.id ? { 
            ...order, 
            ...updatedOrder,
            timeRemaining: formatTime(updatedOrder.initialDuration - Math.floor((Date.now() - order.startTime) / 1000))
          } : order
        ));
      },
      order_removed: ({ id }) => {
        setAllOrders(prevOrders => {
          const filteredOrders = prevOrders.filter(order => order.id !== id);
          adjustDisplayWindow(Math.min(selectedIndex, filteredOrders.length - 1), filteredOrders.length);
          return filteredOrders;
        });
      },
      disconnect: () => console.log('Disconnected from WebSocket server')
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket, selectedIndex, displayStartIndex]);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setAllOrders(prevOrders =>
        prevOrders.map(order => {
          if (order.status === 'READY') return order;

          const elapsedSeconds = Math.floor((Date.now() - order.startTime) / 1000);
          let remainingSeconds = Math.max(0, order.initialDuration - elapsedSeconds);
          
          let status = order.status;
          if (remainingSeconds <= 0) {
            status = 'OVERDUE';
            if (order.status !== 'OVERDUE' && socket) {
              socket.emit('update_order_status', {
                order_id: order.id,
                status: 'OVERDUE'
              });
            }
          } else if (remainingSeconds <= 5 * 60 && status === 'COOKING') {
            status = 'ALMOST_DONE';
          }

          return {
            ...order,
            status,
            timeRemaining: formatTime(remainingSeconds),
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [socket]);

  const adjustDisplayWindow = useCallback((targetSelectedIndex, totalOrdersLength) => {
    if (totalOrdersLength === 0) {
      setSelectedIndex(0);
      setDisplayStartIndex(0);
      return;
    }

    setSelectedIndex(Math.min(targetSelectedIndex, totalOrdersLength - 1));
    
    setDisplayStartIndex(prev => {
      let newDisplayStart = prev;
      
      if (targetSelectedIndex >= prev + MAX_DISPLAYED_ORDERS) {
        newDisplayStart = targetSelectedIndex - MAX_DISPLAYED_ORDERS + 1;
      } else if (targetSelectedIndex < prev) {
        newDisplayStart = targetSelectedIndex;
      }
      
      newDisplayStart = Math.max(0, newDisplayStart);
      newDisplayStart = Math.min(newDisplayStart, Math.max(0, totalOrdersLength - MAX_DISPLAYED_ORDERS));
      
      return totalOrdersLength <= MAX_DISPLAYED_ORDERS ? 0 : newDisplayStart;
    });
  }, [MAX_DISPLAYED_ORDERS]);

  const handleNext = useCallback(() => {
    if (allOrders.length === 0) return;
    adjustDisplayWindow((selectedIndex + 1) % allOrders.length, allOrders.length);
  }, [allOrders.length, selectedIndex, adjustDisplayWindow]);

  const handlePrevious = useCallback(() => {
    if (allOrders.length === 0) return;
    adjustDisplayWindow((selectedIndex - 1 + allOrders.length) % allOrders.length, allOrders.length);
  }, [allOrders.length, selectedIndex, adjustDisplayWindow]);

  const handleMarkDone = useCallback(() => {
    if (allOrders.length === 0 || selectedIndex < 0 || selectedIndex >= allOrders.length) return;

    const now = Date.now();
    const delta = now - lastEnterTime;
    const order = allOrders[selectedIndex];

    if (delta < 300) { // Double click - Mark as ALMOST_DONE
      const updatedOrder = {
        ...order,
        status: 'ALMOST_DONE',
        initialDuration: 5 * 60,
        startTime: Date.now()
      };
      
      socket?.emit('update_order_status', {
        order_id: order.id,
        status: 'ALMOST_DONE',
        initial_duration: 5 * 60
      });
      
      setAllOrders(prevOrders => 
        prevOrders.map(o => o.id === order.id ? updatedOrder : o)
      );
    } else { // Single click - Mark as READY
      const updatedOrder = { ...order, status: 'READY' };
      
      socket?.emit('update_order_status', {
        order_id: order.id,
        status: 'READY'
      });
      
      setAllOrders(prevOrders => 
        prevOrders.map(o => o.id === order.id ? updatedOrder : o)
      );

      setTimeout(() => {
        setAllOrders(prevOrders => {
          if (prevOrders.some(o => o.id === order.id && o.status === 'READY')) {
            socket?.emit('remove_order', { id: order.id });
            return prevOrders.filter(o => o.id !== order.id);
          }
          return prevOrders;
        });
      }, 300);
    }

    setLastEnterTime(now);
  }, [selectedIndex, lastEnterTime, allOrders, socket]);

  const handleResetTimer = useCallback(() => {
    if (allOrders.length === 0 || selectedIndex < 0 || selectedIndex >= allOrders.length) return;

    const order = allOrders[selectedIndex];
    const updatedOrder = {
      ...order,
      status: 'COOKING',
      initialDuration: 15 * 60,
      startTime: Date.now()
    };

    socket?.emit('update_order_status', {
      order_id: order.id,
      status: 'COOKING',
      initial_duration: 15 * 60
    });

    setAllOrders(prevOrders =>
      prevOrders.map(o => o.id === order.id ? updatedOrder : o)
    );
  }, [allOrders, selectedIndex, socket]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrevious();
      else if (e.key === 'Enter') handleMarkDone();
      else if (e.key === 'r' || e.key === 'R') handleResetTimer();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious, handleMarkDone, handleResetTimer]);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeSelectedIndex = useCallback((absoluteIndex) => {
    return absoluteIndex - displayStartIndex;
  }, [displayStartIndex]);

  const ordersToShowInGrid = allOrders.slice(displayStartIndex, displayStartIndex + MAX_DISPLAYED_ORDERS);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <header className="flex justify-between items-center p-6 bg-gray-900 border-b border-gray-800">
        <h1 className="text-2xl font-bold">Kitchen Display System</h1>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 001.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xl font-mono">{getCurrentTime()}</span>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <main className="flex-1 grid grid-cols-3 grid-rows-2 gap-6 p-6">
          {Array.from({ length: MAX_DISPLAYED_ORDERS }).map((_, gridIndex) => {
            const order = ordersToShowInGrid[gridIndex];
            const isSelected = getRelativeSelectedIndex(selectedIndex) === gridIndex;
            
            return order ? (
              <OrderCard
                key={order.id}
                order={order}
                isSelected={isSelected}
                displayTableNumber={order.table}
              />
            ) : (
              <div key={`empty-${gridIndex}`} className="bg-gray-800 rounded-2xl border-2 border-dashed border-gray-600 flex items-center justify-center">
                <span className="text-gray-500 text-lg">Empty Slot</span>
              </div>
            );
          })}
        </main>

        <QueueSidebar
          queue={allOrders}
          displayedCount={MAX_DISPLAYED_ORDERS}
          className="w-64 border-l border-gray-800"
          selectedIndex={selectedIndex}
        />
      </div>
    </div>
  );
}