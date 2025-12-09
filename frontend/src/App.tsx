import { useState, useEffect } from 'react';
import { Sprint, TeamMember, Holiday, SprintCapacity, Team } from './types';
import { sprintApi, holidayApi, teamApi } from './services/api';
import { TeamProvider, useTeam } from './contexts/TeamContext';
import { TeamSidebar } from './components/TeamSidebar';
import { TeamManagementModal } from './components/TeamManagementModal';
import TeamManagement from './components/TeamManagement';
import SprintCalendar from './components/SprintCalendar';
import CapacitySummary from './components/CapacitySummary';
import { HierarchicalSprintSelector } from './components/HierarchicalSprintSelector';
import { SprintTemplateManager } from './components/SprintTemplateManager';
import SprintCreateModal from './components/SprintCreateModal';
import SprintRetro from './components/SprintRetro';
import RetroInsights from './components/RetroInsights';

function AppContent() {
  const { currentTeam, isLoading: teamLoading } = useTeam();
  const [allSprints, setAllSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [capacity, setCapacity] = useState<SprintCapacity | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'planning' | 'team' | 'retro' | 'templates'>('planning');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);

  const loadData = async () => {
    if (!currentTeam?.id) return;

    try {
      setLoading(true);
      const [currentSprintData, allSprintsData, members] = await Promise.all([
        sprintApi.getCurrent(currentTeam.id),
        sprintApi.getAll(currentTeam.id),
        teamApi.getMembers(currentTeam.id),
      ]);

      setAllSprints(allSprintsData);
      setTeamMembers(members);

      const sprintToSelect = currentSprintData || (allSprintsData.length > 0 ? allSprintsData[0] : null);
      setSelectedSprint(sprintToSelect);

      if (sprintToSelect?.id) {
        const [sprintHolidays, sprintCapacity] = await Promise.all([
          holidayApi.getBySprintId(sprintToSelect.id),
          sprintApi.getCapacity(sprintToSelect.id),
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

  const loadSprintData = async (sprintId: number) => {
    try {
      const sprint = allSprints.find(s => s.id === sprintId);
      if (!sprint) return;

      setSelectedSprint(sprint);

      const [sprintHolidays, sprintCapacity] = await Promise.all([
        holidayApi.getBySprintId(sprintId),
        sprintApi.getCapacity(sprintId),
      ]);
      setHolidays(sprintHolidays);
      setCapacity(sprintCapacity);
    } catch (error) {
      console.error('Failed to load sprint data:', error);
    }
  };

  const handleSprintSelection = (sprintId: number) => {
    loadSprintData(sprintId);
  };

  useEffect(() => {
    if (currentTeam) {
      loadData();
    }
  }, [currentTeam]);

  const handleSprintChange = () => {
    loadData();
  };

  const handleTeamChange = () => {
    loadData();
  };

  const handleCreateSprint = () => {
    setShowCreateModal(true);
  };

  const handleDeleteSprint = async (sprintId: number) => {
    if (!confirm('Are you sure you want to delete this sprint? This action cannot be undone.')) {
      return;
    }

    try {
      await sprintApi.delete(sprintId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete sprint:', error);
      alert('Failed to delete sprint');
    }
  };

  const handleSetCurrent = async (sprintId: number) => {
    if (!confirm('Mark this sprint as the current active sprint?')) {
      return;
    }

    try {
      await sprintApi.update(sprintId, { is_current: true });
      await loadData();
    } catch (error) {
      console.error('Failed to set sprint as current:', error);
      alert('Failed to set sprint as current');
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditTeam(team);
    setShowTeamModal(true);
  };

  const handleCloseTeamModal = () => {
    setShowTeamModal(false);
    setEditTeam(null);
  };

  const handleHolidayToggle = async (memberId: number, date: string) => {
    if (!selectedSprint?.id) return;

    try {
      await holidayApi.toggle(selectedSprint.id, memberId, date);
      await loadSprintData(selectedSprint.id);
    } catch (error) {
      console.error('Failed to toggle holiday:', error);
    }
  };

  if (teamLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!currentTeam) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">No team available. Please create a team first.</div>
      </div>
    );
  }

  return (
    <>
      <TeamSidebar onAddTeam={() => setShowTeamModal(true)} onEditTeam={handleEditTeam} />
      <TeamManagementModal
        isOpen={showTeamModal}
        onClose={handleCloseTeamModal}
        editTeam={editTeam}
      />

      <div className="min-h-screen bg-gray-100 ml-64">
        <header className="bg-blue-600 text-white shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold">{currentTeam.name}</h1>
            <p className="text-blue-100 mt-1">Manage your team's sprint capacity and holidays</p>
          </div>
        </header>

      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex space-x-4 py-3">
            <button
              onClick={() => setActiveTab('planning')}
              className={`px-4 py-2 rounded-md font-medium transition ${
                activeTab === 'planning'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Sprint Planning
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
              onClick={() => setActiveTab('retro')}
              className={`px-4 py-2 rounded-md font-medium transition ${
                activeTab === 'retro'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Retrospective
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-md font-medium transition ${
                activeTab === 'templates'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Sprint Templates
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'planning' && (
          <div className="space-y-6">
            {allSprints.length === 0 ? (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-1">No Sprints Yet</h3>
                    <p className="text-sm text-yellow-700 mb-4">
                      Get started by creating your first sprint to begin planning!
                    </p>
                    <button
                      onClick={handleCreateSprint}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md font-medium"
                    >
                      + Create First Sprint
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                  <HierarchicalSprintSelector
                    teamId={currentTeam?.id}
                    selectedSprint={selectedSprint}
                    onSprintChange={handleSprintSelection}
                    onSetCurrent={handleSetCurrent}
                  />
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={handleCreateSprint}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md font-medium"
                    >
                      + Create Sprint
                    </button>
                    {selectedSprint && (
                      <button
                        onClick={() => handleDeleteSprint(selectedSprint.id!)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md font-medium"
                      >
                        Delete Sprint
                      </button>
                    )}
                  </div>
                </div>

                {selectedSprint && <RetroInsights currentSprint={selectedSprint} allSprints={allSprints} />}

                {selectedSprint && (
                  <>
                    <SprintCalendar
                      sprint={selectedSprint}
                      teamMembers={teamMembers}
                      holidays={holidays}
                      onHolidayToggle={handleHolidayToggle}
                    />

                    {capacity && <CapacitySummary capacity={capacity} onUpdate={() => loadSprintData(selectedSprint.id!)} />}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <TeamManagement members={teamMembers} onUpdate={handleTeamChange} />
        )}

        {activeTab === 'retro' && (
          <div className="space-y-6">
            {allSprints.length === 0 ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <p className="text-yellow-700">No sprints available. Please create a sprint first.</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                  <HierarchicalSprintSelector
                    teamId={currentTeam?.id}
                    selectedSprint={selectedSprint}
                    onSprintChange={handleSprintSelection}
                    onSetCurrent={handleSetCurrent}
                  />
                </div>

                {selectedSprint ? (
                  <SprintRetro sprint={selectedSprint} teamMembers={teamMembers} />
                ) : (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                    <p className="text-yellow-700">Please select a sprint to view its retrospective.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-6">
            <SprintTemplateManager />
          </div>
        )}
      </main>

        <SprintCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleSprintChange}
          sprintCount={allSprints.length}
        />

        <footer className="bg-white border-t mt-12">
          <div className="container mx-auto px-4 py-6 text-center text-gray-600">
            <p>Team Extreme - Built with love by Elad Gur</p>
          </div>
        </footer>
      </div>
    </>
  );
}

function App() {
  return (
    <TeamProvider>
      <AppContent />
    </TeamProvider>
  );
}

export default App;
