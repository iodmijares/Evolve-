import { MenstrualPhase, MealType } from "../types";

export const calculateMenstrualPhase = (
  lastPeriodStartDate: string,
  cycleLength: number
): { phase: MenstrualPhase; dayOfCycle: number; timelinePercentage: number } | null => {
  if (!lastPeriodStartDate || !cycleLength) return null;

  const startDate = new Date(lastPeriodStartDate);
  // Add timezone offset to treat date as local
  startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset());

  if (isNaN(startDate.getTime())) return null;

  const today = new Date();
  // Reset time part to compare dates only
  startDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - startDate.getTime();
  if (diffTime < 0) return null; // Today is before the last period start date

  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const dayOfCycle = (diffDays % cycleLength) + 1;

  // Simplified phase lengths
  const menstrualEnd = 5;
  const follicularEnd = 13;
  const ovulatoryEnd = 16;
  
  let phase: MenstrualPhase;
  if (dayOfCycle <= menstrualEnd) {
    phase = 'Menstrual';
  } else if (dayOfCycle <= follicularEnd) {
    phase = 'Follicular';
  } else if (dayOfCycle <= ovulatoryEnd) {
    phase = 'Ovulatory';
  } else {
    phase = 'Luteal';
  }

  const timelinePercentage = Math.min(100, (dayOfCycle / cycleLength) * 100);

  return { phase, dayOfCycle, timelinePercentage };
};

export const calculatePhaseForDate = (
  targetDate: Date,
  lastPeriodStartDate: string,
  cycleLength: number
): { phase: MenstrualPhase; dayOfCycle: number; isPredictedPeriod: boolean } | null => {
  if (!lastPeriodStartDate || cycleLength <= 0) return null;

  const startDate = new Date(lastPeriodStartDate);
  // Treat date as local by adjusting for timezone
  startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset());
  startDate.setHours(0, 0, 0, 0);
  
  if (isNaN(startDate.getTime())) return null;

  const cleanTargetDate = new Date(targetDate);
  cleanTargetDate.setHours(0, 0, 0, 0);

  const diffDaysTotal = Math.floor((cleanTargetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Modulo operator to find the day in the current or future cycle
  const dayOfCycle = (diffDaysTotal % cycleLength + cycleLength) % cycleLength + 1;

  // Simplified phase lengths
  const menstrualEnd = 5;
  const follicularEnd = 13;
  const ovulatoryEnd = 16;
  
  let phase: MenstrualPhase;
  if (dayOfCycle <= menstrualEnd) {
      phase = 'Menstrual';
  } else if (dayOfCycle <= follicularEnd) {
      phase = 'Follicular';
  } else if (dayOfCycle <= ovulatoryEnd) {
      phase = 'Ovulatory';
  } else {
      phase = 'Luteal';
  }

  const isPredictedPeriod = dayOfCycle >= 1 && dayOfCycle <= menstrualEnd;

  return { phase, dayOfCycle, isPredictedPeriod };
};

export const getMealTypeByTime = (): 'Breakfast' | 'Lunch' | 'Dinner' => {
    const hour = new Date().getHours();
    if (hour < 11) { // Before 11 AM
        return 'Breakfast';
    } else if (hour < 16) { // 11 AM to 4 PM
        return 'Lunch';
    } else { // After 4 PM
        return 'Dinner';
    }
};