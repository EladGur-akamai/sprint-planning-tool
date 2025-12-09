import { useState, useEffect } from 'react';
import { sprintApi, sprintTemplateApi } from '../services/api';
import { SprintTemplate } from '../types';
import { useTeam } from '../contexts/TeamContext';
import { format, addDays, addWeeks } from 'date-fns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  sprintCount: number;
}

function SprintCreateModal({ isOpen, onClose, onCreated, sprintCount }: Props) {
  const { currentTeam } = useTeam();
  const [useTemplate, setUseTemplate] = useState(false);
  const [templates, setTemplates] = useState<SprintTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [customizeDates, setCustomizeDates] = useState(false);

  const [formData, setFormData] = useState({
    name: `Sprint ${sprintCount + 1}`,
    start_date: '',
    end_date: '',
    is_current: false,
    load_factor: 0.8,
  });

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      const data = await sprintTemplateApi.getAll();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        setFormData({
          name: template.name,
          start_date: template.start_date,
          end_date: template.end_date,
          is_current: false,
          load_factor: template.load_factor,
        });
      }
    }
  }, [selectedTemplate, templates]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam?.id) return;

    try {
      if (useTemplate && selectedTemplate && !customizeDates) {
        // Adopt template as-is
        await sprintTemplateApi.adopt(selectedTemplate, currentTeam.id);
      } else {
        // Create custom sprint or adopt with custom dates
        const startDate = new Date(formData.start_date);
        let endDate;

        if (formData.end_date) {
          endDate = new Date(formData.end_date);
        } else {
          endDate = addDays(addWeeks(startDate, 2), -1);
        }

        if (useTemplate && selectedTemplate && customizeDates) {
          // Adopt template with custom dates
          await sprintTemplateApi.adopt(selectedTemplate, currentTeam.id, {
            start_date: format(startDate, 'yyyy-MM-dd'),
            end_date: format(endDate, 'yyyy-MM-dd'),
          });
        } else {
          // Create completely custom sprint
          await sprintApi.create({
            team_id: currentTeam.id,
            name: formData.name,
            start_date: format(startDate, 'yyyy-MM-dd'),
            end_date: format(endDate, 'yyyy-MM-dd'),
            is_current: formData.is_current,
            load_factor: formData.load_factor,
          });
        }
      }

      onCreated();
      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to create sprint:', error);
      alert('Failed to create sprint');
    }
  };

  const resetForm = () => {
    setFormData({ name: `Sprint ${sprintCount + 2}`, start_date: '', end_date: '', is_current: false, load_factor: 0.8 });
    setUseTemplate(false);
    setSelectedTemplate(null);
    setCustomizeDates(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Create New Sprint</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          {templates.length > 0 && (
            <div className="flex items-center bg-blue-50 p-3 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="use_template"
                checked={useTemplate}
                onChange={(e) => {
                  setUseTemplate(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedTemplate(null);
                    setCustomizeDates(false);
                  }
                }}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="use_template" className="ml-3 block text-sm font-medium text-gray-900">
                Adopt a global sprint template
              </label>
            </div>
          )}

          {useTemplate ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Sprint Template
                </label>
                <select
                  value={selectedTemplate || ''}
                  onChange={(e) => setSelectedTemplate(Number(e.target.value))}
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({format(new Date(template.start_date), 'MMM d')} - {format(new Date(template.end_date), 'MMM d, yyyy')})
                    </option>
                  ))}
                </select>
              </div>

              {selectedTemplate && (
                <div className="flex items-center bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <input
                    type="checkbox"
                    id="customize_dates"
                    checked={customizeDates}
                    onChange={(e) => setCustomizeDates(e.target.checked)}
                    className="h-5 w-5 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <label htmlFor="customize_dates" className="ml-3 block text-sm font-medium text-gray-900">
                    Customize dates (optional)
                  </label>
                </div>
              )}

              {customizeDates && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}
            </>
          ) : (
            <>
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
            </>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Load Factor (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="5"
              value={formData.load_factor * 100}
              onChange={(e) => setFormData({ ...formData, load_factor: Number(e.target.value) / 100 })}
              required
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-2">
              Accounts for meetings, overhead, and realistic productivity (default: 80%)
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
