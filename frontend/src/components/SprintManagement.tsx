import { useState, useEffect } from 'react';
import { Sprint } from '../types';
import { sprintApi } from '../services/api';
import { format, addDays, addWeeks } from 'date-fns';

interface Props {
  onUpdate: () => void;
}

function SprintManagement({ onUpdate }: Props) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    is_current: false,
  });

  const loadSprints = async () => {
    try {
      const data = await sprintApi.getAll();
      setSprints(data);
    } catch (error) {
      console.error('Failed to load sprints:', error);
    }
  };

  useEffect(() => {
    loadSprints();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', start_date: '', is_current: false });
    setIsAdding(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const startDate = new Date(formData.start_date);
      const endDate = addDays(addWeeks(startDate, 2), -1); // 2 weeks - 1 day

      await sprintApi.create({
        name: formData.name,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        is_current: formData.is_current,
      });

      await loadSprints();
      onUpdate();
      resetForm();
    } catch (error) {
      console.error('Failed to create sprint:', error);
      alert('Failed to create sprint');
    }
  };

  const handleSetCurrent = async (id: number) => {
    try {
      await sprintApi.update(id, { is_current: true });
      await loadSprints();
      onUpdate();
    } catch (error) {
      console.error('Failed to set current sprint:', error);
      alert('Failed to set current sprint');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this sprint?')) return;
    try {
      await sprintApi.delete(id);
      await loadSprints();
      onUpdate();
    } catch (error) {
      console.error('Failed to delete sprint:', error);
      alert('Failed to delete sprint');
    }
  };

  // Generate default sprint name
  const generateSprintName = () => {
    const nextNumber = sprints.length + 1;
    return `Sprint ${nextNumber}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Sprint Management</h2>
        {!isAdding && (
          <button
            onClick={() => {
              setFormData({
                ...formData,
                name: generateSprintName(),
              });
              setIsAdding(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Create New Sprint
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Create New Sprint</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sprint Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date (Sunday)
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Sprint will run for 2 weeks (10 working days, Sun-Thu)
              </p>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_current"
                checked={formData.is_current}
                onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_current" className="ml-2 block text-sm text-gray-900">
                Set as current sprint
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Create Sprint
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sprint Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                End Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sprints.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No sprints yet. Create your first sprint to get started!
                </td>
              </tr>
            ) : (
              sprints.map((sprint) => (
                <tr key={sprint.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {sprint.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sprint.start_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sprint.end_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {sprint.is_current ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Current
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!sprint.is_current && (
                      <button
                        onClick={() => handleSetCurrent(sprint.id!)}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Set as Current
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(sprint.id!)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SprintManagement;
