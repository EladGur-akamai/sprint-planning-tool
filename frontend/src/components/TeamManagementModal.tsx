import { useState, useEffect } from 'react';
import { Team, TeamMember } from '../types';
import { teamApi, teamMemberApi } from '../services/api';
import { useTeam } from '../contexts/TeamContext';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTeam?: Team | null;
}

export const TeamManagementModal = ({ isOpen, onClose, editTeam }: TeamManagementModalProps) => {
  const { loadTeams, setCurrentTeam } = useTeam();
  const [name, setName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: '', default_capacity: 10 });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, editTeam]);

  const loadData = async () => {
    try {
      // Load all team members
      const members = await teamMemberApi.getAll();
      setAllMembers(members);

      if (editTeam) {
        setName(editTeam.name);
        setLogoPreview(editTeam.logo_url);

        // Load team members for editing
        const teamMembers = await teamApi.getMembers(editTeam.id!);
        setSelectedMembers(teamMembers.map(m => m.id!));
      } else {
        setName('');
        setLogoFile(null);
        setLogoPreview(null);
        setSelectedMembers([]);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo file size must be less than 5MB');
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleMember = (memberId: number) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let team: Team;

      if (editTeam) {
        // Update existing team
        team = await teamApi.update(editTeam.id!, { name });
      } else {
        // Create new team
        team = await teamApi.create({ name, logo_url: null });
      }

      // Upload logo if provided
      if (logoFile && team.id) {
        team = await teamApi.uploadLogo(team.id, logoFile);
      }

      // Update team members
      if (team.id) {
        const currentMembers = editTeam ? await teamApi.getMembers(editTeam.id!) : [];
        const currentMemberIds = currentMembers.map(m => m.id!);

        // Add new members
        for (const memberId of selectedMembers) {
          if (!currentMemberIds.includes(memberId)) {
            await teamApi.addMember(team.id, memberId);
          }
        }

        // Remove deselected members
        for (const memberId of currentMemberIds) {
          if (!selectedMembers.includes(memberId)) {
            await teamApi.removeMember(team.id, memberId);
          }
        }
      }

      // Reload teams and set as current if new
      await loadTeams();
      if (!editTeam && team.id) {
        setCurrentTeam(team);
      }

      onClose();
    } catch (err) {
      console.error('Failed to save team:', err);
      setError('Failed to save team');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editTeam?.id) return;

    if (!confirm(`Are you sure you want to delete "${editTeam.name}"? This will delete all associated sprints and retro items.`)) {
      return;
    }

    setIsLoading(true);
    try {
      await teamApi.delete(editTeam.id);
      await loadTeams();
      onClose();
    } catch (err) {
      console.error('Failed to delete team:', err);
      setError('Failed to delete team');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMember = async () => {
    if (!newMember.name.trim() || !newMember.role.trim()) {
      setError('Please enter both name and role for the new member');
      return;
    }

    try {
      const created = await teamMemberApi.create(newMember);

      // Reload all members
      const members = await teamMemberApi.getAll();
      setAllMembers(members);

      // Auto-select the newly created member
      setSelectedMembers([...selectedMembers, created.id!]);

      // Reset form and hide
      setNewMember({ name: '', role: '', default_capacity: 10 });
      setShowAddMember(false);
      setError(null);
    } catch (err) {
      console.error('Failed to create member:', err);
      setError('Failed to create member');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">
            {editTeam ? 'Edit Team' : 'Create New Team'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Enter team name"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Logo
            </label>
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-gray-400">
                    {name ? name.charAt(0).toUpperCase() : '?'}
                  </span>
                )}
              </div>

              {/* File Input */}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="text-sm text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max file size: 5MB. Recommended: Square image (e.g., 200x200px)
                </p>
              </div>
            </div>
          </div>

          {/* Member Assignment */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Team Members
              </label>
              <button
                type="button"
                onClick={() => setShowAddMember(!showAddMember)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showAddMember ? '- Cancel' : '+ Create New Member'}
              </button>
            </div>

            {/* Inline Member Creation Form */}
            {showAddMember && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-3 space-y-3">
                <div>
                  <input
                    type="text"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    placeholder="Member name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    placeholder="Role (e.g., Developer, Designer)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={newMember.default_capacity}
                    onChange={(e) => setNewMember({ ...newMember, default_capacity: Number(e.target.value) })}
                    placeholder="Default capacity (days)"
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateMember}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Add Member
                </button>
              </div>
            )}

            <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
              {allMembers.length === 0 ? (
                <p className="text-gray-500 text-sm p-4">No team members available. Create one above!</p>
              ) : (
                allMembers.map((member) => (
                  <label
                    key={member.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id!)}
                      onChange={() => toggleMember(member.id!)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.role}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              {editTeam && editTeam.id !== 1 && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md disabled:opacity-50"
                >
                  Delete Team
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : editTeam ? 'Save Changes' : 'Create Team'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
