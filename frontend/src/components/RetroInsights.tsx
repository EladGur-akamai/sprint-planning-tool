import { useState, useEffect } from 'react';
import { RetroItem, Sprint } from '../types';
import { retroApi } from '../services/api';

interface Props {
  currentSprint: Sprint;
  allSprints: Sprint[];
}

function RetroInsights({ currentSprint, allSprints }: Props) {
  const [retroItems, setRetroItems] = useState<RetroItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [previousSprint, setPreviousSprint] = useState<Sprint | null>(null);

  useEffect(() => {
    findPreviousSprint();
  }, [currentSprint, allSprints]);

  const findPreviousSprint = () => {
    // Sort sprints by start_date ascending (oldest first)
    const sortedSprints = [...allSprints].sort((a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

    // Find the sprint that comes before the current one
    const currentIndex = sortedSprints.findIndex(s => s.id === currentSprint.id);
    if (currentIndex > 0) {
      // Get the sprint at index - 1 (the one before chronologically)
      const prevSprint = sortedSprints[currentIndex - 1];
      setPreviousSprint(prevSprint);
      if (prevSprint.id) {
        loadRetroItems(prevSprint.id);
      }
    } else {
      setLoading(false);
    }
  };

  const loadRetroItems = async (sprintId: number) => {
    try {
      setLoading(true);
      const items = await retroApi.getBySprintId(sprintId);
      setRetroItems(items);
    } catch (error) {
      console.error('Failed to load retro items:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (!previousSprint) return null;
  if (retroItems.length === 0) return null;

  const wentWell = retroItems.filter(item => item.type === 'what_went_well');
  const wentWrong = retroItems.filter(item => item.type === 'what_went_wrong');
  const lessons = retroItems.filter(item => item.type === 'lesson_learned');
  const todos = retroItems.filter(item => item.type === 'todo');

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 mb-6 border border-purple-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        📚 Previous Sprint Insights
        <span className="text-sm font-normal text-gray-600 ml-2">({previousSprint.name})</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wentWell.length > 0 && (
          <div>
            <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
              <span>✅</span> What Went Well
            </h4>
            <ul className="space-y-2">
              {wentWell.slice(0, 3).map((item) => (
                <li key={item.id} className="text-sm text-gray-700 bg-white rounded px-3 py-2">
                  • {item.content}
                </li>
              ))}
            </ul>
          </div>
        )}

        {wentWrong.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
              <span>❌</span> What Went Wrong
            </h4>
            <ul className="space-y-2">
              {wentWrong.slice(0, 3).map((item) => (
                <li key={item.id} className="text-sm text-gray-700 bg-white rounded px-3 py-2">
                  • {item.content}
                </li>
              ))}
            </ul>
          </div>
        )}

        {lessons.length > 0 && (
          <div>
            <h4 className="font-semibold text-yellow-700 mb-2 flex items-center gap-2">
              <span>💡</span> Lessons Learned
            </h4>
            <ul className="space-y-2">
              {lessons.slice(0, 3).map((item) => (
                <li key={item.id} className="text-sm text-gray-700 bg-white rounded px-3 py-2">
                  • {item.content}
                </li>
              ))}
            </ul>
          </div>
        )}

        {todos.length > 0 && (
          <div>
            <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
              <span>📝</span> Action Items
            </h4>
            <ul className="space-y-2">
              {todos.slice(0, 3).map((item) => (
                <li key={item.id} className="text-sm text-gray-700 bg-white rounded px-3 py-2">
                  • {item.content}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default RetroInsights;
