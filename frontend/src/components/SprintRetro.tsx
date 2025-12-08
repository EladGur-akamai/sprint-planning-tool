import { useState, useEffect } from 'react';
import { RetroItem, RetroItemType, Sprint, TeamMember } from '../types';
import { retroApi } from '../services/api';

interface Props {
  sprint: Sprint;
  teamMembers: TeamMember[];
}

const RETRO_TYPES: { value: RetroItemType; label: string; emoji: string; color: string }[] = [
  { value: 'what_went_well', label: 'What Went Well', emoji: '✅', color: 'green' },
  { value: 'what_went_wrong', label: 'What Went Wrong', emoji: '❌', color: 'red' },
  { value: 'lesson_learned', label: 'Lesson Learned', emoji: '💡', color: 'yellow' },
  { value: 'todo', label: 'Action Item', emoji: '📝', color: 'blue' },
];

function SprintRetro({ sprint, teamMembers }: Props) {
  const [retroItems, setRetroItems] = useState<RetroItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<number | ''>('');
  const [selectedType, setSelectedType] = useState<RetroItemType>('what_went_well');
  const [newItemContent, setNewItemContent] = useState('');

  useEffect(() => {
    loadRetroItems();
  }, [sprint.id]);

  const loadRetroItems = async () => {
    try {
      setLoading(true);
      const items = await retroApi.getBySprintId(sprint.id!);
      setRetroItems(items);
    } catch (error) {
      console.error('Failed to load retro items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !newItemContent.trim()) return;

    try {
      await retroApi.create({
        sprint_id: sprint.id!,
        member_id: selectedMember as number,
        type: selectedType,
        content: newItemContent.trim(),
      });
      setNewItemContent('');
      loadRetroItems();
    } catch (error) {
      console.error('Failed to add retro item:', error);
      alert('Failed to add retro item');
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await retroApi.delete(id);
      loadRetroItems();
    } catch (error) {
      console.error('Failed to delete retro item:', error);
      alert('Failed to delete retro item');
    }
  };

  const getMemberName = (memberId: number) => {
    const member = teamMembers.find(m => m.id === memberId);
    return member ? member.name : 'Unknown';
  };

  const groupedItems = RETRO_TYPES.reduce((acc, typeConfig) => {
    acc[typeConfig.value] = retroItems.filter(item => item.type === typeConfig.value);
    return acc;
  }, {} as Record<RetroItemType, RetroItem[]>);

  if (loading) {
    return <div className="text-center py-8">Loading retrospective...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border border-purple-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Sprint Retrospective: {sprint.name}
        </h2>
        <p className="text-sm text-gray-600">
          Reflect on the sprint and share insights with your team
        </p>
      </div>

      {/* Add New Item Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Retrospective Item</h3>
        <form onSubmit={handleAddItem} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Team Member
              </label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value ? Number(e.target.value) : '')}
                required
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select team member...</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as RetroItemType)}
                required
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {RETRO_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.emoji} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={newItemContent}
              onChange={(e) => setNewItemContent(e.target.value)}
              required
              rows={3}
              placeholder="Share your thoughts, learnings, or action items..."
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md hover:shadow-lg font-semibold"
          >
            Add Item
          </button>
        </form>
      </div>

      {/* Retrospective Items by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {RETRO_TYPES.map((typeConfig) => (
          <div key={typeConfig.value} className="bg-white rounded-lg shadow-md p-6">
            <h3 className={`text-lg font-bold mb-4 text-${typeConfig.color}-700 flex items-center gap-2`}>
              <span className="text-2xl">{typeConfig.emoji}</span>
              {typeConfig.label}
              <span className="ml-auto text-sm font-normal text-gray-500">
                ({groupedItems[typeConfig.value].length})
              </span>
            </h3>

            {groupedItems[typeConfig.value].length === 0 ? (
              <p className="text-gray-400 text-sm italic">No items yet</p>
            ) : (
              <div className="space-y-3">
                {groupedItems[typeConfig.value].map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border-l-4 border-${typeConfig.color}-400 bg-${typeConfig.color}-50`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-sm text-gray-700">
                        {getMemberName(item.member_id)}
                      </span>
                      <button
                        onClick={() => handleDeleteItem(item.id!)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                    <p className="text-gray-800">{item.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SprintRetro;
