import { useState } from 'react';
import { sprintApi } from '../services/api';
import { format, addDays, addWeeks } from 'date-fns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  sprintCount: number;
}

function SprintCreateModal({ isOpen, onClose, onCreated, sprintCount }: Props) {
  const [formData, setFormData] = useState({
    name: `Sprint ${sprintCount + 1}`,
    start_date: '',
    is_current: false,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const startDate = new Date(formData.start_date);
      const endDate = addDays(addWeeks(startDate, 2), -1);

      await sprintApi.create({
        name: formData.name,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        is_current: formData.is_current,
      });

      onCreated();
      setFormData({ name: `Sprint ${sprintCount + 2}`, start_date: '', is_current: false });
      onClose();
    } catch (error) {
      console.error('Failed to create sprint:', error);
      alert('Failed to create sprint');
    }
  };

  const handleClose = () => {
    setFormData({ name: `Sprint ${sprintCount + 1}`, start_date: '', is_current: false });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Create New Sprint</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sprint Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Sprint 1"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Start Date (Sunday)
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-2">
              Sprint will run for 2 weeks (10 working days, Sun-Thu)
            </p>
          </div>
          <div className="flex items-center bg-blue-50 p-3 rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id="is_current"
              checked={formData.is_current}
              onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_current" className="ml-3 block text-sm font-medium text-gray-900">
              Set as current active sprint
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-semibold"
            >
              Create Sprint
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SprintCreateModal;
