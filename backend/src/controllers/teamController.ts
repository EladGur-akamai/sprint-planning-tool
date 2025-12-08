import { Request, Response } from 'express';
import { TeamModel } from '../models/Team';

export const getAllTeams = async (req: Request, res: Response) => {
  try {
    const teams = await TeamModel.getAll();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
};

export const getTeamById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const team = await TeamModel.getById(id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
};

export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name, logo_url } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    const team = await TeamModel.create({
      name,
      logo_url: logo_url || null,
    });
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create team' });
  }
};

export const updateTeam = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;

    const success = await TeamModel.update(id, updates);
    if (!success) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const updated = await TeamModel.getById(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update team' });
  }
};

export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    // Prevent deletion of default team
    if (id === 1) {
      return res.status(400).json({ error: 'Cannot delete default team' });
    }

    const success = await TeamModel.delete(id);
    if (!success) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete team' });
  }
};

export const getTeamMembers = async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.id);
    const members = await TeamModel.getMembersByTeamId(teamId);
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
};

export const addTeamMember = async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.id);
    const { member_id } = req.body;

    if (!member_id) {
      return res.status(400).json({ error: 'member_id is required' });
    }

    await TeamModel.addMemberToTeam(teamId, member_id);
    res.status(201).json({ message: 'Member added to team' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add member to team' });
  }
};

export const removeTeamMember = async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memberId);

    const success = await TeamModel.removeMemberFromTeam(teamId, memberId);
    if (!success) {
      return res.status(404).json({ error: 'Member not found in team' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member from team' });
  }
};

export const uploadTeamLogo = async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.id);
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const imgbbApiKey = process.env.IMGBB_API_KEY;
    if (!imgbbApiKey) {
      return res.status(500).json({ error: 'ImgBB API key not configured' });
    }

    // Upload to ImgBB
    const formData = new URLSearchParams();
    formData.append('key', imgbbApiKey);
    formData.append('image', image);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ImgBB error response:', errorText);
      throw new Error('Failed to upload image to ImgBB');
    }

    const data = await response.json() as { data: { url: string } };
    const logoUrl = data.data.url;

    // Update team with new logo URL
    const success = await TeamModel.update(teamId, { logo_url: logoUrl });
    if (!success) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const updated = await TeamModel.getById(teamId);
    res.json(updated);
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ error: 'Failed to upload logo', details: (error as Error).message });
  }
};
