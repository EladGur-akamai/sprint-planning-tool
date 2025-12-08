import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Team } from '../types';
import { teamApi } from '../services/api';

interface TeamContextType {
  currentTeam: Team | null;
  allTeams: Team[];
  setCurrentTeam: (team: Team) => void;
  loadTeams: () => Promise<void>;
  isLoading: boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

interface TeamProviderProps {
  children: ReactNode;
}

export const TeamProvider = ({ children }: TeamProviderProps) => {
  const [currentTeam, setCurrentTeamState] = useState<Team | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      const teams = await teamApi.getAll();
      setAllTeams(teams);

      // Set first team as current if no current team
      if (!currentTeam && teams.length > 0) {
        setCurrentTeamState(teams[0]);
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentTeam = (team: Team) => {
    setCurrentTeamState(team);
    // Store in localStorage for persistence
    localStorage.setItem('currentTeamId', String(team.id));
  };

  useEffect(() => {
    loadTeams();
  }, []);

  // Restore current team from localStorage on mount
  useEffect(() => {
    const storedTeamId = localStorage.getItem('currentTeamId');
    if (storedTeamId && allTeams.length > 0) {
      const team = allTeams.find(t => t.id === parseInt(storedTeamId));
      if (team) {
        setCurrentTeamState(team);
      }
    }
  }, [allTeams]);

  return (
    <TeamContext.Provider value={{ currentTeam, allTeams, setCurrentTeam, loadTeams, isLoading }}>
      {children}
    </TeamContext.Provider>
  );
};
