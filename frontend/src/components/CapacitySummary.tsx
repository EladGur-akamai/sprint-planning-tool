import { useState } from 'react';
import { SprintCapacity } from '../types';
import { exportCapacityToCSV } from '../utils/csvExport';
import { sprintApi } from '../services/api';

interface Props {
  capacity: SprintCapacity;
  onUpdate: () => void;
}

function CapacitySummary({ capacity, onUpdate }: Props) {
  const [loadFactor, setLoadFactor] = useState(capacity.load_factor || 0.8);
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveLoadFactor = async () => {
    try {
      await sprintApi.update(capacity.sprint_id, { load_factor: loadFactor });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update load factor:', error);
      alert('Failed to update load factor');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Capacity Summary</h3>
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
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Load Factor:</span>
            {isEditing ? (
              <>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={Math.round(loadFactor * 100)}
                  onChange={(e) => setLoadFactor(Number(e.target.value) / 100)}
                  className="w-20 px-2 py-1 border-2 border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">%</span>
                <button
                  onClick={handleSaveLoadFactor}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setLoadFactor(capacity.load_factor || 0.8);
                    setIsEditing(false);
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="text-lg font-bold text-blue-600">{Math.round(loadFactor * 100)}%</span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="ml-2 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                >
                  Edit
                </button>
              </>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Accounts for meetings, overhead, and realistic productivity
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

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Calculation Formula:</h4>
          <p className="text-xs text-gray-600">
            Capacity = (Default Capacity × Available Days × Load Factor) ÷ 10
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Where Available Days = Total Working Days - Holidays
          </p>
          <p className="text-xs text-gray-500">
            Load Factor ({Math.round(loadFactor * 100)}%) = Realistic productivity accounting for meetings and overhead
          </p>
        </div>
      </div>
    </div>
  );
}

export default CapacitySummary;
