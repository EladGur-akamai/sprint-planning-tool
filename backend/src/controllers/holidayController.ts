import { Request, Response } from 'express';
import { HolidayModel } from '../models/Holiday';

export const getHolidaysBySprintId = async (req: Request, res: Response) => {
  try {
    const sprintId = parseInt(req.params.sprintId);
    const holidays = await HolidayModel.getBySprintId(sprintId);
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
};

export const getHolidaysBySprintAndMember = async (req: Request, res: Response) => {
  try {
    const sprintId = parseInt(req.params.sprintId);
    const memberId = parseInt(req.params.memberId);
    const holidays = await HolidayModel.getBySprintAndMember(sprintId, memberId);
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
};

export const createHoliday = async (req: Request, res: Response) => {
  try {
    const { sprint_id, member_id, date } = req.body;

    if (!sprint_id || !member_id || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const holiday = await HolidayModel.create({ sprint_id, member_id, date });
    res.status(201).json(holiday);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create holiday' });
  }
};

export const deleteHoliday = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const success = await HolidayModel.delete(id);
    if (!success) {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
};

export const toggleHoliday = async (req: Request, res: Response) => {
  try {
    const { sprint_id, member_id, date } = req.body;

    if (!sprint_id || !member_id || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if holiday exists
    const existing = await HolidayModel.getBySprintAndMember(sprint_id, member_id);
    const holidayExists = existing.some(h => h.date === date);

    if (holidayExists) {
      // Remove holiday
      await HolidayModel.deleteBySprintMemberAndDate(sprint_id, member_id, date);
      res.json({ action: 'removed', sprint_id, member_id, date });
    } else {
      // Add holiday
      const holiday = await HolidayModel.create({ sprint_id, member_id, date });
      res.json({ action: 'added', ...holiday });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle holiday' });
  }
};
