import { Request, Response } from 'express';
import { RetroItemModel } from '../models/RetroItem';

export const getRetroItemsBySprintId = async (req: Request, res: Response) => {
  try {
    const sprintId = parseInt(req.params.sprintId);
    const items = await RetroItemModel.getBySprintId(sprintId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch retro items' });
  }
};

export const createRetroItem = async (req: Request, res: Response) => {
  try {
    const { sprint_id, member_id, team_id, type, content } = req.body;

    if (!sprint_id || !member_id || !team_id || !type || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const item = await RetroItemModel.create({
      sprint_id,
      member_id,
      team_id,
      type,
      content,
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create retro item' });
  }
};

export const updateRetroItem = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;

    const success = await RetroItemModel.update(id, updates);
    if (!success) {
      return res.status(404).json({ error: 'Retro item not found' });
    }

    const updated = await RetroItemModel.getById(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update retro item' });
  }
};

export const deleteRetroItem = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const success = await RetroItemModel.delete(id);
    if (!success) {
      return res.status(404).json({ error: 'Retro item not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete retro item' });
  }
};
