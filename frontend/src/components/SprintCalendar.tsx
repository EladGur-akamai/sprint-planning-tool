import { Sprint, TeamMember, Holiday } from '../types';
import { eachDayOfInterval, parseISO, format, getDay, isSameDay, startOfDay } from 'date-fns';

interface Props {
  sprint: Sprint;
  teamMembers: TeamMember[];
  holidays: Holiday[];
  onHolidayToggle: (memberId: number, date: string) => void;
}

// Helper function for Israel work week (Sunday-Thursday)
const isIsraeliWeekend = (date: Date): boolean => {
  const day = getDay(date); // 0 = Sunday, 6 = Saturday
  return day === 5 || day === 6; // Friday or Saturday
};

function SprintCalendar({ sprint, teamMembers, holidays, onHolidayToggle }: Props) {
  const days = eachDayOfInterval({
    start: parseISO(sprint.start_date),
    end: parseISO(sprint.end_date),
  });

  const workingDays = days.filter(day => !isIsraeliWeekend(day));
  const today = startOfDay(new Date());

  const isHoliday = (memberId: number, date: string): boolean => {
    return holidays.some(h => h.member_id === memberId && h.date === date);
  };

  const isToday = (date: Date): boolean => {
    return isSameDay(date, today);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Sprint Calendar (Sun-Thu Working Days)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Click on a cell to toggle holiday for a team member on that day. Weekend days (Fri-Sat) are excluded.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2 bg-gray-50 text-left text-sm font-semibold text-gray-700 sticky left-0 z-10">
                  Team Member
                </th>
                {workingDays.map((day, idx) => {
                  const isTodayColumn = isToday(day);
                  return (
                    <th
                      key={idx}
                      className={`border px-3 py-2 text-center text-xs font-medium min-w-[80px] ${
                        isTodayColumn
                          ? 'bg-blue-100 border-blue-400 text-blue-900'
                          : 'bg-gray-50 border-gray-300 text-gray-700'
                      }`}
                    >
                      <div>{format(day, 'EEE')}</div>
                      <div className="font-bold">{format(day, 'MMM d')}</div>
                      {isTodayColumn && <div className="text-[10px] text-blue-600 font-semibold">TODAY</div>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {teamMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={workingDays.length + 1}
                    className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                  >
                    No team members yet. Add team members to start planning.
                  </td>
                </tr>
              ) : (
                teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white z-10">
                      <div>{member.name}</div>
                      <div className="text-xs text-gray-500">{member.role}</div>
                    </td>
                    {workingDays.map((day, idx) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const isOff = isHoliday(member.id!, dateStr);
                      const isTodayColumn = isToday(day);
                      return (
                        <td
                          key={idx}
                          onClick={() => onHolidayToggle(member.id!, dateStr)}
                          className={`border px-3 py-3 text-center cursor-pointer transition-colors ${
                            isTodayColumn
                              ? isOff
                                ? 'bg-red-200 hover:bg-red-300 border-blue-400'
                                : 'bg-blue-100 hover:bg-blue-200 border-blue-400'
                              : isOff
                              ? 'bg-red-100 hover:bg-red-200 border-gray-300'
                              : 'bg-green-50 hover:bg-green-100 border-gray-300'
                          }`}
                          title={isOff ? 'Click to mark as working' : 'Click to mark as holiday'}
                        >
                          {isOff ? (
                            <span className="text-red-600 font-semibold">✗</span>
                          ) : (
                            <span className={isTodayColumn ? 'text-blue-600 font-semibold' : 'text-green-600 font-semibold'}>✓</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-50 border border-gray-300 rounded flex items-center justify-center">
              <span className="text-green-600 font-semibold text-xs">✓</span>
            </div>
            <span className="text-gray-700">Working Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-100 border border-gray-300 rounded flex items-center justify-center">
              <span className="text-red-600 font-semibold text-xs">✗</span>
            </div>
            <span className="text-gray-700">Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-100 border border-blue-400 rounded flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-xs">✓</span>
            </div>
            <span className="text-gray-700">Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SprintCalendar;
