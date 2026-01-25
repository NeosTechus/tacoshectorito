import { useState, useEffect } from 'react';

// Restaurant business hours configuration
// Adjust these times as needed (24-hour format)
export const BUSINESS_HOURS = {
  // Day of week: 0 = Sunday, 1 = Monday, etc.
  0: { open: 10, close: 21 }, // Sunday: 10 AM - 9 PM
  1: { open: 10, close: 21 }, // Monday: 10 AM - 9 PM
  2: { open: 10, close: 21 }, // Tuesday: 10 AM - 9 PM
  3: { open: 10, close: 21 }, // Wednesday: 10 AM - 9 PM
  4: { open: 10, close: 21 }, // Thursday: 10 AM - 9 PM
  5: { open: 10, close: 22 }, // Friday: 10 AM - 10 PM
  6: { open: 10, close: 22 }, // Saturday: 10 AM - 10 PM
} as const;

// Timezone for the restaurant (Central Time for St. Louis)
export const RESTAURANT_TIMEZONE = 'America/Chicago';

export interface BusinessHoursStatus {
  isOpen: boolean;
  currentDay: number;
  currentHour: number;
  currentMinute: number;
  todayHours: { open: number; close: number };
  opensAt: string;
  closesAt: string;
  nextOpenTime: string;
  minutesUntilClose: number | null;
  minutesUntilOpen: number | null;
}

const formatTime = (hour: number): string => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${period}`;
};

const getDayName = (day: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day];
};

export const getBusinessHoursStatus = (): BusinessHoursStatus => {
  // Get current time in restaurant's timezone
  const now = new Date();
  const restaurantTime = new Date(now.toLocaleString('en-US', { timeZone: RESTAURANT_TIMEZONE }));
  
  const currentDay = restaurantTime.getDay();
  const currentHour = restaurantTime.getHours();
  const currentMinute = restaurantTime.getMinutes();
  
  const todayHours = BUSINESS_HOURS[currentDay as keyof typeof BUSINESS_HOURS];
  const isOpen = currentHour >= todayHours.open && currentHour < todayHours.close;
  
  // Calculate minutes until close
  let minutesUntilClose: number | null = null;
  if (isOpen) {
    minutesUntilClose = (todayHours.close - currentHour) * 60 - currentMinute;
  }
  
  // Calculate next opening time
  let nextOpenTime = '';
  let minutesUntilOpen: number | null = null;
  
  if (!isOpen) {
    if (currentHour < todayHours.open) {
      // Opens later today
      nextOpenTime = `today at ${formatTime(todayHours.open)}`;
      minutesUntilOpen = (todayHours.open - currentHour) * 60 - currentMinute;
    } else {
      // Opens tomorrow
      const nextDay = (currentDay + 1) % 7;
      const nextDayHours = BUSINESS_HOURS[nextDay as keyof typeof BUSINESS_HOURS];
      nextOpenTime = `${getDayName(nextDay)} at ${formatTime(nextDayHours.open)}`;
      minutesUntilOpen = ((24 - currentHour) + nextDayHours.open) * 60 - currentMinute;
    }
  }
  
  return {
    isOpen,
    currentDay,
    currentHour,
    currentMinute,
    todayHours,
    opensAt: formatTime(todayHours.open),
    closesAt: formatTime(todayHours.close),
    nextOpenTime,
    minutesUntilClose,
    minutesUntilOpen,
  };
};

export const useBusinessHours = () => {
  const [status, setStatus] = useState<BusinessHoursStatus>(getBusinessHoursStatus);
  
  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => {
      setStatus(getBusinessHoursStatus());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return status;
};

export default useBusinessHours;
