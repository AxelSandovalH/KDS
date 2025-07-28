import React, { useState, useEffect } from 'react';
import OrderCard from './OrderCard';
import QueueSidebar from './QueueSidebar';
import ordersData from '../data/mockOrders';

// Utilidad para formatear el tiempo (MM:SS)
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function KDSLayout() {
  const [orders, setOrders] = useState(
    ordersData.map(order => ({
      ...order,
      startTime: Date.now(), // Añadimos timestamp de inicio
      status: 'COOKING', // Estado inicial - verde
      initialDuration: 15 * 60, // 15 minutos en segundos
    }))
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lastEnterTime, setLastEnterTime] = useState(0);

  // Efecto para actualizar timers cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.status === 'READY') {
            return order;
          }

          const elapsedSeconds = Math.floor((Date.now() - order.startTime) / 1000);
          let remainingSeconds = order.initialDuration - elapsedSeconds;
          let status = order.status;

          // Lógica para estados OVERDUE - rojo
          if (remainingSeconds <= 0) {
            remainingSeconds = 0;
            status = 'OVERDUE';
          }

          // Lógica para ALMOST_DONE (5 minutos restantes) - verde
          if (status === 'COOKING' && remainingSeconds <= 5 * 60) {
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
  }, []);

  const handleNext = () => {
    if (orders.length === 0) return;
    setSelectedIndex((prev) => (prev + 1) % orders.length);
  };

  const handlePrevious = () => {
    if (orders.length === 0) return;
    setSelectedIndex((prev) => (prev - 1 + orders.length) % orders.length);
  };

  const handleMarkDone = () => {
    if (orders.length === 0) return;
    
    const now = Date.now();
    const delta = now - lastEnterTime;
    const newOrders = [...orders];

    if (delta < 300) { // Doble click en 300ms
      newOrders[selectedIndex] = {
        ...newOrders[selectedIndex],
        status: 'ALMOST_DONE',
        initialDuration: 5 * 60, // Reset a 5 minutos
        startTime: Date.now(), // Reiniciamos el timer
      };
      setOrders(newOrders);
    } else {
      // Primer clic - marcar como READY
      newOrders[selectedIndex].status = 'READY';
      setOrders(newOrders);
      
      // Esperar 300ms para verificar si hay doble clic antes de eliminar
      setTimeout(() => {
        setOrders(prevOrders => {
          // Verificar si la orden aún existe y está en READY
          if (prevOrders[selectedIndex] && prevOrders[selectedIndex].status === 'READY') {
            const filteredOrders = prevOrders.filter((_, idx) => idx !== selectedIndex);
            
            // Ajustar el índice seleccionado si es necesario
            if (filteredOrders.length > 0) {
              setSelectedIndex(prev => {
                if (prev >= filteredOrders.length) {
                  return filteredOrders.length - 1;
                }
                return prev;
              });
            } else {
              setSelectedIndex(0);
            }
            
            return filteredOrders;
          }
          return prevOrders;
        });
      }, 300); // Esperar el tiempo del doble clic antes de eliminar
    }

    setLastEnterTime(now);
  };

  // Resetear timer de la orden seleccionada
  const handleResetTimer = () => {
    if (orders.length === 0) return;
    
    setOrders(prevOrders => 
      prevOrders.map((order, idx) => 
        idx === selectedIndex ? {
          ...order,
          status: 'COOKING',
          initialDuration: 15 * 60,
          startTime: Date.now(),
        } : order
      )
    );
  };

  // Teclado físico
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrevious();
      else if (e.key === 'Enter') handleMarkDone();
      else if (e.key === 'r' || e.key === 'R') handleResetTimer();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [orders, selectedIndex, lastEnterTime]);

  return (
    <div className="flex h-screen bg-gray-900">
      <main className="flex-1 grid grid-cols-3 gap-3 p-4">
        {orders.map((order, idx) => (
          <OrderCard 
            key={order.id} 
            order={order} 
            isSelected={idx === selectedIndex}
            onResetTimer={handleResetTimer}
          />
        ))}
      </main>
      <QueueSidebar queue={orders} />
    </div>
  );
}