import { useState, useEffect } from 'react';
import { Sprint, TeamMember, Holiday, SprintCapacity } from './types';
import { sprintApi, teamMemberApi, holidayApi } from './services/api';
import TeamManagement from './components/TeamManagement';
import SprintManagement from './components/SprintManagement';
import SprintCalendar from './components/SprintCalendar';
import CapacitySummary from './components/CapacitySummary';
import SprintHistory from './components/SprintHistory';

function App() {
  const [currentSprint, setCurrentSprint] = useState<Sprint | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [capacity, setCapacity] = useState<SprintCapacity | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'team' | 'sprint' | 'history'>('dashboard');

  const loadData = async () => {
    try {
      setLoading(true);
      const [sprint, members] = await Promise.all([
        sprintApi.getCurrent(),
        teamMemberApi.getAll(),
      ]);

      setCurrentSprint(sprint);
      setTeamMembers(members);

      if (sprint?.id) {
        const [sprintHolidays, sprintCapacity] = await Promise.all([
          holidayApi.getBySprintId(sprint.id),
          sprintApi.getCapacity(sprint.id),
        ]);
        setHolidays(sprintHolidays);
        setCapacity(sprintCapacity);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSprintChange = () => {
    loadData();
  };

  const handleTeamChange = () => {
    loadData();
  };

  const handleHolidayToggle = async (memberId: number, date: string) => {
    if (!currentSprint?.id) return;

    try {
      await holidayApi.toggle(currentSprint.id, memberId, date);
      await loadData();
    } catch (error) {
      console.error('Failed to toggle holiday:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Sprint Planning Tool</h1>
          <p className="text-blue-100 mt-1">Manage your team's sprint capacity and holidays</p>
        </div>
      </header>

      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex space-x-4 py-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-md font-medium transition ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-4 py-2 rounded-md font-medium transition ${
                activeTab === 'team'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Team Management
            </button>
            <button
              onClick={() => setActiveTab('sprint')}
              className={`px-4 py-2 rounded-md font-medium transition ${
                activeTab === 'sprint'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Sprint Management
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-md font-medium transition ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Sprint History
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {!currentSprint ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      No current sprint set. Please create a sprint and mark it as current in Sprint Management.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Current Sprint: {currentSprint.name}
                  </h2>
                  <p className="text-gray-600">
                    {new Date(currentSprint.start_date).toLocaleDateString()} -{' '}
                    {new Date(currentSprint.end_date).toLocaleDateString()}
                  </p>
                </div>

                <SprintCalendar
                  sprint={currentSprint}
                  teamMembers={teamMembers}
                  holidays={holidays}
                  onHolidayToggle={handleHolidayToggle}
                />

                {capacity && <CapacitySummary capacity={capacity} />}
              </>
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <TeamManagement members={teamMembers} onUpdate={handleTeamChange} />
        )}

        {activeTab === 'sprint' && (
          <SprintManagement onUpdate={handleSprintChange} />
        )}

        {activeTab === 'history' && (
          <SprintHistory />
        )}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p>Sprint Planning Tool - Built with React, TypeScript, and Express</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
