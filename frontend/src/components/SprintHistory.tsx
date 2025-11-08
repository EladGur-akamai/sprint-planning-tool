import { useState, useEffect } from 'react';
import { Sprint, SprintCapacity } from '../types';
import { sprintApi } from '../services/api';
import { exportCapacityToCSV } from '../utils/csvExport';

function SprintHistory() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [capacity, setCapacity] = useState<SprintCapacity | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSprints();
  }, []);

  const loadSprints = async () => {
    try {
      const data = await sprintApi.getAll();
      setSprints(data);
    } catch (error) {
      console.error('Failed to load sprints:', error);
    }
  };

  const loadSprintCapacity = async (sprint: Sprint) => {
    if (!sprint.id) return;
    setLoading(true);
    try {
      const data = await sprintApi.getCapacity(sprint.id);
      setCapacity(data);
      setSelectedSprint(sprint);
    } catch (error) {
      console.error('Failed to load sprint capacity:', error);
      alert('Failed to load sprint capacity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Sprint History</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sprints.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            No sprints available yet.
          </div>
        ) : (
          sprints.map((sprint) => (
            <div
              key={sprint.id}
              className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all hover:shadow-lg ${
                selectedSprint?.id === sprint.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => loadSprintCapacity(sprint)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{sprint.name}</h3>
                {sprint.is_current && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Current
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {new Date(sprint.start_date).toLocaleDateString()} -{' '}
                {new Date(sprint.end_date).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Click to view capacity details
              </p>
            </div>
          ))
        )}
      </div>

      {loading && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-600">Loading capacity data...</div>
        </div>
      )}

      {!loading && selectedSprint && capacity && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedSprint.name}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(selectedSprint.start_date).toLocaleDateString()} -{' '}
                  {new Date(selectedSprint.end_date).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => exportCapacityToCSV(capacity)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition text-sm"
              >
                Export to CSV
              </button>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Sprint Capacity</div>
              <div className="text-3xl font-bold text-blue-600">
                {capacity.total_capacity} <span className="text-lg text-gray-600">Story Points</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team Member
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Default Capacity
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Working Days
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Holidays
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available Days
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity (SP)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {capacity.member_capacities.map((mc) => (
                    <tr key={mc.member_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {mc.member_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {mc.default_capacity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {mc.total_working_days}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        <span
                          className={`px-2 py-1 rounded-full ${
                            mc.holidays > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {mc.holidays}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {mc.available_days}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                        {mc.capacity}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-bold">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      TOTAL
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {capacity.total_working_days}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {capacity.total_capacity}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SprintHistory;
