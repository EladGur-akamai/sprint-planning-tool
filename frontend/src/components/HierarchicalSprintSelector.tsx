import React, { useState, useEffect } from 'react';
import { Sprint } from '../types';
import { sprintApi, sprintTemplateApi } from '../services/api';
import { format } from 'date-fns';

interface HierarchicalSprintSelectorProps {
  teamId?: number;
  selectedSprint: Sprint | null;
  onSprintChange: (sprintId: number) => void;
  onSetCurrent?: (sprintId: number) => void;
}

export const HierarchicalSprintSelector: React.FC<HierarchicalSprintSelectorProps> = ({
  teamId,
  selectedSprint,
  onSprintChange,
  onSetCurrent,
}) => {
  const [availableQuarters, setAvailableQuarters] = useState<Array<{ year: number; quarter: number }>>([]);
  const [allSprints, setAllSprints] = useState<Sprint[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);
  const [quarterSprints, setQuarterSprints] = useState<Sprint[]>([]);
  const [hasTemplates, setHasTemplates] = useState(false);

  useEffect(() => {
    loadData();
  }, [teamId]);

  useEffect(() => {
    if (selectedYear && selectedQuarter) {
      filterSprintsByQuarter(selectedYear, selectedQuarter);
    }
  }, [selectedYear, selectedQuarter, allSprints]);

  // Set default selections when data loads
  useEffect(() => {
    if (availableQuarters.length > 0 && !selectedYear) {
      // Default to current sprint's year/quarter, or latest available
      if (selectedSprint && selectedSprint.year && selectedSprint.quarter) {
        setSelectedYear(selectedSprint.year);
        setSelectedQuarter(selectedSprint.quarter);
      } else {
        const latest = availableQuarters[0];
        setSelectedYear(latest.year);
        setSelectedQuarter(latest.quarter);
      }
    }
  }, [availableQuarters, selectedSprint]);

  const loadData = async () => {
    try {
      // Load all sprints for the team
      const sprints = await sprintApi.getAll(teamId);
      setAllSprints(sprints);

      // Check if there are any templates
      const quarters = await sprintTemplateApi.getAvailableQuarters();
      setHasTemplates(quarters.length > 0);

      if (quarters.length > 0) {
        setAvailableQuarters(quarters);
      } else {
        // If no templates, create quarters from existing sprints with year/quarter metadata
        const sprintsWithQuarters = sprints.filter(s => s.year && s.quarter);
        if (sprintsWithQuarters.length > 0) {
          const uniqueQuarters = Array.from(
            new Set(sprintsWithQuarters.map(s => `${s.year}-${s.quarter}`))
          ).map(key => {
            const [year, quarter] = key.split('-').map(Number);
            return { year, quarter };
          }).sort((a, b) => b.year - a.year || b.quarter - a.quarter);
          setAvailableQuarters(uniqueQuarters);
        }
      }
    } catch (err) {
      console.error('Failed to load sprint data:', err);
    }
  };

  const filterSprintsByQuarter = (year: number, quarter: number) => {
    const filtered = allSprints.filter(
      sprint => sprint.year === year && sprint.quarter === quarter
    );
    setQuarterSprints(filtered.sort((a, b) => a.start_date.localeCompare(b.start_date)));
  };

  // Get legacy sprints (those without year/quarter metadata)
  const legacySprints = allSprints.filter(sprint => !sprint.year || !sprint.quarter);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    // Reset quarter when year changes
    const quartersForYear = availableQuarters.filter(q => q.year === year);
    if (quartersForYear.length > 0) {
      setSelectedQuarter(quartersForYear[0].quarter);
    }
  };

  const handleQuarterChange = (quarter: number) => {
    setSelectedQuarter(quarter);
  };

  const handleSprintChange = (sprintId: number) => {
    onSprintChange(sprintId);
  };

  // Get unique years
  const availableYears = Array.from(new Set(availableQuarters.map(q => q.year))).sort((a, b) => b - a);

  // Get quarters for selected year
  const quartersForSelectedYear = selectedYear
    ? availableQuarters.filter(q => q.year === selectedYear).map(q => q.quarter).sort()
    : [];

  // If no templates and no sprints with year/quarter metadata, fall back to simple selector
  if (availableQuarters.length === 0 && legacySprints.length === allSprints.length) {
    const sortedSprints = [...allSprints].sort((a, b) => b.start_date.localeCompare(a.start_date));

    return (
      <div className="mb-3">
        <label htmlFor="sprint-selector" className="form-label">
          Sprint
        </label>
        <select
          id="sprint-selector"
          className="form-select"
          value={selectedSprint?.id || ''}
          onChange={(e) => handleSprintChange(Number(e.target.value))}
        >
          <option value="">Select a sprint...</option>
          {sortedSprints.map((sprint) => (
            <option key={sprint.id} value={sprint.id}>
              {sprint.name} • {format(new Date(sprint.start_date), 'MMM d')} -{' '}
              {format(new Date(sprint.end_date), 'MMM d, yyyy')}
              {sprint.is_current ? ' ⭐ CURRENT' : ''}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="hierarchical-sprint-selector">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Year Selector */}
        <div className="md:col-span-2">
          <label htmlFor="year-selector" className="block text-sm font-semibold text-gray-700 mb-2">
            Year
          </label>
          <div className="relative">
            <select
              id="year-selector"
              className="w-full px-4 py-2.5 pr-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium appearance-none cursor-pointer transition-all hover:border-blue-400"
              value={selectedYear || ''}
              onChange={(e) => handleYearChange(Number(e.target.value))}
            >
              <option value="">Year...</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Quarter Selector */}
        <div className="md:col-span-2">
          <label htmlFor="quarter-selector" className="block text-sm font-semibold text-gray-700 mb-2">
            Quarter
          </label>
          <div className="relative">
            <select
              id="quarter-selector"
              className={`w-full px-4 py-2.5 pr-10 border-2 rounded-lg focus:outline-none focus:ring-2 bg-white font-medium appearance-none transition-all ${
                !selectedYear
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-900 cursor-pointer hover:border-blue-400 focus:ring-blue-500 focus:border-blue-500'
              }`}
              value={selectedQuarter || ''}
              onChange={(e) => handleQuarterChange(Number(e.target.value))}
              disabled={!selectedYear}
            >
              <option value="">Quarter...</option>
              {quartersForSelectedYear.map((quarter) => (
                <option key={quarter} value={quarter}>
                  Q{quarter}
                </option>
              ))}
            </select>
            <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 ${!selectedYear ? 'text-gray-300' : 'text-gray-500'}`}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Sprint Selector */}
        <div className="md:col-span-8">
          <label htmlFor="sprint-selector" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Sprint
          </label>
          <div className="relative">
            <select
              id="sprint-selector"
              className={`w-full px-4 py-2.5 pr-10 border-2 rounded-lg focus:outline-none focus:ring-2 bg-white font-medium appearance-none transition-all ${
                !selectedQuarter && legacySprints.length === 0
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-900 cursor-pointer hover:border-blue-400 focus:ring-blue-500 focus:border-blue-500'
              }`}
              value={selectedSprint?.id || ''}
              onChange={(e) => handleSprintChange(Number(e.target.value))}
              disabled={!selectedQuarter && legacySprints.length === 0}
            >
              <option value="">Select a sprint...</option>
              {legacySprints.length > 0 && (
                <optgroup label="⚠️ Legacy Sprints (no quarter)">
                  {legacySprints.sort((a, b) => b.start_date.localeCompare(a.start_date)).map((sprint) => (
                    <option key={sprint.id} value={sprint.id}>
                      {sprint.name} • {format(new Date(sprint.start_date), 'MMM d')} - {format(new Date(sprint.end_date), 'MMM d, yyyy')}
                      {sprint.is_current ? ' ⭐ CURRENT' : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              {selectedQuarter && quarterSprints.length > 0 && (
                <optgroup label={`📅 ${selectedYear} Q${selectedQuarter} Sprints`}>
                  {quarterSprints.map((sprint) => (
                    <option key={sprint.id} value={sprint.id}>
                      {sprint.name} • {format(new Date(sprint.start_date), 'MMM d')} - {format(new Date(sprint.end_date), 'MMM d, yyyy')}
                      {sprint.is_current ? ' ⭐ CURRENT' : ''}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 ${(!selectedQuarter && legacySprints.length === 0) ? 'text-gray-300' : 'text-gray-500'}`}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Set as Current Button */}
      {selectedSprint && !selectedSprint.is_current && onSetCurrent && (
        <div className="mt-3">
          <button
            onClick={() => onSetCurrent(selectedSprint.id!)}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all shadow-md font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Mark as Current Sprint
          </button>
        </div>
      )}

      {!hasTemplates && quarterSprints.length === 0 && selectedYear && selectedQuarter && (
        <div className="alert alert-info mt-3">
          No sprints found for {selectedYear} Q{selectedQuarter}. Create a sprint using the button above!
        </div>
      )}
    </div>
  );
};
