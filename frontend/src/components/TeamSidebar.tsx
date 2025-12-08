import { useState } from 'react';
import { useTeam } from '../contexts/TeamContext';
import { Team } from '../types';

interface TeamSidebarProps {
  onAddTeam: () => void;
  onEditTeam: (team: Team) => void;
}

export const TeamSidebar = ({ onAddTeam, onEditTeam }: TeamSidebarProps) => {
  const { currentTeam, allTeams, setCurrentTeam } = useTeam();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-gray-900 text-white transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } flex flex-col shadow-lg z-50`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {!isCollapsed && <h2 className="text-lg font-semibold">Teams</h2>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-gray-800 rounded"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Teams List */}
      <div className="flex-1 overflow-y-auto py-4">
        {allTeams.map((team) => (
          <div
            key={team.id}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors group ${
              currentTeam?.id === team.id ? 'bg-gray-800 border-l-4 border-blue-500' : ''
            }`}
          >
            {/* Team Logo */}
            <button
              onClick={() => setCurrentTeam(team)}
              className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden"
              title={team.name}
            >
              {team.logo_url ? (
                <img
                  src={team.logo_url}
                  alt={team.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold">
                  {team.name.charAt(0).toUpperCase()}
                </span>
              )}
            </button>

            {/* Team Name */}
            {!isCollapsed && (
              <>
                <button
                  onClick={() => setCurrentTeam(team)}
                  className="flex-1 text-sm font-medium truncate text-left"
                  title={team.name}
                >
                  {team.name}
                </button>

                {/* Edit Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTeam(team);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-opacity"
                  title="Edit team"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add Team Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onAddTeam}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors ${
            isCollapsed ? 'px-2' : ''
          }`}
          title="Add new team"
        >
          <span className="text-xl">+</span>
          {!isCollapsed && <span className="text-sm font-medium">Add Team</span>}
        </button>
      </div>
    </div>
  );
};
