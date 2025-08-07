import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Filter, Check } from 'lucide-react';

interface DateRangeFilterProps {
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
  className?: string;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ 
  onDateRangeChange, 
  className = '',
  initialStartDate = null,
  initialEndDate = null
}) => {
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate);
  const [appliedStartDate, setAppliedStartDate] = useState<Date | null>(initialStartDate);
  const [appliedEndDate, setAppliedEndDate] = useState<Date | null>(initialEndDate);

  // Update internal state when props change (for URL sync)
  useEffect(() => {
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
    setAppliedStartDate(initialStartDate);
    setAppliedEndDate(initialEndDate);
  }, [initialStartDate, initialEndDate]);

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
  };

  const applyFilters = () => {
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    onDateRangeChange(startDate, endDate);
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setAppliedStartDate(null);
    setAppliedEndDate(null);
    onDateRangeChange(null, null);
  };

  const hasActiveFilters = appliedStartDate || appliedEndDate;
  const hasPendingChanges = startDate !== appliedStartDate || endDate !== appliedEndDate;

  const applyPreset = (presetStartDate: Date | null, presetEndDate: Date | null) => {
    setStartDate(presetStartDate);
    setEndDate(presetEndDate);
    setAppliedStartDate(presetStartDate);
    setAppliedEndDate(presetEndDate);
    onDateRangeChange(presetStartDate, presetEndDate);
  };

  const getPresetDates = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const last3Months = new Date(today);
    last3Months.setMonth(last3Months.getMonth() - 3);

    return {
      today: { start: today, end: today },
      yesterday: { start: yesterday, end: yesterday },
      lastWeek: { start: lastWeek, end: today },
      lastMonth: { start: lastMonth, end: today },
      last3Months: { start: last3Months, end: today }
    };
  };

  const presets = getPresetDates();

  return (
    <div className={className}>
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Quick Presets</label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset(presets.today.start, presets.today.end)}
                className="text-xs"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset(presets.yesterday.start, presets.yesterday.end)}
                className="text-xs"
              >
                Yesterday
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset(presets.lastWeek.start, presets.lastWeek.end)}
                className="text-xs"
              >
                Last 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset(presets.lastMonth.start, presets.lastMonth.end)}
                className="text-xs"
              >
                Last 30 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset(presets.last3Months.start, presets.last3Months.end)}
                className="text-xs"
              >
                Last 3 Months
              </Button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <DatePicker
                selected={startDate}
                onChange={handleStartDateChange}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                maxDate={new Date()}
                placeholderText="Select start date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                dateFormat="MMM dd, yyyy"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <DatePicker
                selected={endDate}
                onChange={handleEndDateChange}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate || undefined}
                maxDate={new Date()}
                placeholderText="Select end date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                dateFormat="MMM dd, yyyy"
              />
            </div>
          </div>
          
                     {/* Action Buttons */}
           <div className="flex items-center justify-between pt-2 border-t border-gray-100">
             <div className="text-sm text-gray-600">
               {hasActiveFilters ? (
                 <>
                   {appliedStartDate && appliedEndDate && (
                     <span>
                       Showing archives from{' '}
                       <span className="font-medium">
                         {appliedStartDate.toLocaleDateString()}
                       </span>{' '}
                       to{' '}
                       <span className="font-medium">
                         {appliedEndDate.toLocaleDateString()}
                       </span>
                     </span>
                   )}
                   {appliedStartDate && !appliedEndDate && (
                     <span>
                       Showing archives from{' '}
                       <span className="font-medium">
                         {appliedStartDate.toLocaleDateString()}
                       </span>{' '}
                       onwards
                     </span>
                   )}
                   {!appliedStartDate && appliedEndDate && (
                     <span>
                       Showing archives up to{' '}
                       <span className="font-medium">
                         {appliedEndDate.toLocaleDateString()}
                       </span>
                     </span>
                   )}
                 </>
               ) : (
                 <span>No date filter applied</span>
               )}
             </div>
             <div className="flex items-center gap-2">
               {hasPendingChanges && (
                 <Button
                   size="sm"
                   onClick={applyFilters}
                   className="bg-blue-600 hover:bg-blue-700 text-white"
                 >
                   <Check className="w-4 h-4 mr-1" />
                   Apply
                 </Button>
               )}
               {hasActiveFilters && (
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={clearFilters}
                   className="text-gray-500 hover:text-gray-700"
                 >
                   <X className="w-4 h-4 mr-1" />
                   Clear
                 </Button>
               )}
             </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DateRangeFilter;
