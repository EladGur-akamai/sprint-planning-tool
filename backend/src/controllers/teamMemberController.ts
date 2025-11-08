import { Request, Response } from 'express';
import { TeamMemberModel } from '../models/TeamMember';

export const getAllMembers = async (req: Request, res: Response) => {
  try {
    const members = await TeamMemberModel.getAll();
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
};

export const getMemberById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const member = await TeamMemberModel.getById(id);
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team member' });
  }
};

export const createMember = async (req: Request, res: Response) => {
  try {
    const { name, role, default_capacity } = req.body;

    if (!name || !role || default_capacity === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const member = await TeamMemberModel.create({ name, role, default_capacity });
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create team member' });
  }
};

export const updateMember = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;

    const success = await TeamMemberModel.update(id, updates);
    if (!success) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const updated = await TeamMemberModel.getById(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update team member' });
  }
};

export const deleteMember = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const success = await TeamMemberModel.delete(id);
    if (!success) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete team member' });
  }
};
