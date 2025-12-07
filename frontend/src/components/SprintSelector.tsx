import { Sprint } from '../types';
import { format, parseISO } from 'date-fns';

interface Props {
  sprints: Sprint[];
  selectedSprint: Sprint | null;
  currentSprintId: number | null;
  onSprintChange: (sprintId: number) => void;
  onCreateSprint?: () => void;
  onDeleteSprint?: (sprintId: number) => void;
}

function SprintSelector({
  sprints,
  selectedSprint,
  currentSprintId,
  onSprintChange,
  onCreateSprint,
  onDeleteSprint
}: Props) {
  if (sprints.length === 0) {
    return null;
  }

  const sortedSprints = [...sprints].sort((a, b) => {
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });

  const formatSprintLabel = (sprint: Sprint): string => {
    return `${sprint.name}`;
  };

  const formatSprintDates = (sprint: Sprint): string => {
    const startDate = format(parseISO(sprint.start_date), 'MMM d');
    const endDate = format(parseISO(sprint.end_date), 'MMM d, yyyy');
    return `${startDate} - ${endDate}`;
  };

  const handleDelete = (e: React.MouseEvent, sprintId: number) => {
    e.stopPropagation();
    if (onDeleteSprint) {
      onDeleteSprint(sprintId);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 mb-6 border border-blue-100">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <label htmlFor="sprint-selector" className="block text-sm font-semibold text-gray-700 mb-2">
            📅 Select Sprint
          </label>
          <div className="relative">
            <select
              id="sprint-selector"
              value={selectedSprint?.id || ''}
              onChange={(e) => onSprintChange(Number(e.target.value))}
              className="w-full px-4 py-3 pr-10 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium shadow-sm hover:border-blue-300 transition-colors cursor-pointer appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%232563eb'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5rem'
              }}
            >
              {sortedSprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {formatSprintLabel(sprint)} • {formatSprintDates(sprint)}
                  {sprint.id === currentSprintId ? ' ⭐ CURRENT' : ''}
                </option>
              ))}
            </select>
          </div>
          {selectedSprint && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-gray-600">{formatSprintDates(selectedSprint)}</span>
              {selectedSprint.id === currentSprintId && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                  ⭐ Active Sprint
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {onCreateSprint && (
            <button
              onClick={onCreateSprint}
              className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
              title="Create New Sprint"
            >
              <span className="text-lg">+</span>
              <span>New Sprint</span>
            </button>
          )}
          {onDeleteSprint && selectedSprint && sortedSprints.length > 1 && (
            <button
              onClick={(e) => handleDelete(e, selectedSprint.id!)}
              className="px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all border border-red-200 font-medium"
              title="Delete Sprint"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SprintSelector;
