import { Request, Response } from 'express';
import { SprintModel } from '../models/Sprint';
import { HolidayModel } from '../models/Holiday';
import { TeamMemberModel } from '../models/TeamMember';
import { eachDayOfInterval, parseISO, format, getDay } from 'date-fns';

// Helper function for Israel work week (Sunday-Thursday)
const isIsraeliWeekend = (date: Date): boolean => {
  const day = getDay(date); // 0 = Sunday, 6 = Saturday
  return day === 5 || day === 6; // Friday or Saturday
};

export const getAllSprints = async (req: Request, res: Response) => {
  try {
    const sprints = await SprintModel.getAll();
    res.json(sprints);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sprints' });
  }
};

export const getSprintById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const sprint = await SprintModel.getById(id);
    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }
    res.json(sprint);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sprint' });
  }
};

export const getCurrentSprint = async (req: Request, res: Response) => {
  try {
    const sprint = await SprintModel.getCurrent();
    if (!sprint) {
      return res.status(404).json({ error: 'No current sprint found' });
    }
    res.json(sprint);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch current sprint' });
  }
};

export const createSprint = async (req: Request, res: Response) => {
  try {
    const { name, start_date, end_date, is_current } = req.body;

    if (!name || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sprint = await SprintModel.create({
      name,
      start_date,
      end_date,
      is_current: is_current || false,
    });
    res.status(201).json(sprint);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create sprint' });
  }
};

export const updateSprint = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;

    const success = await SprintModel.update(id, updates);
    if (!success) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    const updated = await SprintModel.getById(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update sprint' });
  }
};

export const deleteSprint = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const success = await SprintModel.delete(id);
    if (!success) {
      return res.status(404).json({ error: 'Sprint not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sprint' });
  }
};

export const getSprintCapacity = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const sprint = await SprintModel.getById(id);

    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    const members = await TeamMemberModel.getAll();
    const holidays = await HolidayModel.getBySprintId(id);

    // Calculate working days (Sun-Thu) in sprint - Israel work week
    const days = eachDayOfInterval({
      start: parseISO(sprint.start_date),
      end: parseISO(sprint.end_date),
    });

    const workingDays = days.filter(day => !isIsraeliWeekend(day));
    const totalWorkingDays = workingDays.length;

    // Calculate capacity for each member
    const memberCapacities = members.map(member => {
      const memberHolidays = holidays.filter(h => h.member_id === member.id);
      const holidayCount = memberHolidays.length;
      const availableDays = totalWorkingDays - holidayCount;
      const capacity = (member.default_capacity * availableDays) / 10;

      return {
        member_id: member.id,
        member_name: member.name,
        default_capacity: member.default_capacity,
        total_working_days: totalWorkingDays,
        holidays: holidayCount,
        available_days: availableDays,
        capacity: Math.round(capacity * 10) / 10, // Round to 1 decimal
      };
    });

    const totalCapacity = memberCapacities.reduce((sum, m) => sum + m.capacity, 0);

    res.json({
      sprint_id: id,
      sprint_name: sprint.name,
      total_working_days: totalWorkingDays,
      member_capacities: memberCapacities,
      total_capacity: Math.round(totalCapacity * 10) / 10,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate sprint capacity' });
  }
};
