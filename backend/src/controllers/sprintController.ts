import { Request, Response } from 'express';
import { SprintModel } from '../models/Sprint';
import { HolidayModel } from '../models/Holiday';
import { TeamMemberModel } from '../models/TeamMember';
import { TeamModel } from '../models/Team';
import { eachDayOfInterval, parseISO, format, getDay } from 'date-fns';

// Helper function for Israel work week (Sunday-Thursday)
const isIsraeliWeekend = (date: Date): boolean => {
  const day = getDay(date); // 0 = Sunday, 6 = Saturday
  return day === 5 || day === 6; // Friday or Saturday
};

export const getAllSprints = async (req: Request, res: Response) => {
  try {
    const teamId = req.query.teamId ? parseInt(req.query.teamId as string) : undefined;
    const sprints = await SprintModel.getAll(teamId);
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
    const teamId = req.query.teamId ? parseInt(req.query.teamId as string) : undefined;
    const sprint = await SprintModel.getCurrent(teamId);
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
    const { team_id, name, start_date, end_date, is_current, load_factor } = req.body;

    if (!name || !start_date || !end_date || !team_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sprint = await SprintModel.create({
      team_id,
      name,
      start_date,
      end_date,
      is_current: is_current || false,
      load_factor: load_factor !== undefined ? load_factor : 0.8,
    });
    res.status(201).json(sprint);
  } catch (error) {
    console.error('Failed to create sprint:', error);
    res.status(500).json({ error: 'Failed to create sprint', details: (error as Error).message });
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

    // Get only team members assigned to this sprint's team
    const members = await TeamModel.getMembersByTeamId(sprint.team_id);
    const holidays = await HolidayModel.getBySprintId(id);

    // Calculate working days (Sun-Thu) in sprint - Israel work week
    const days = eachDayOfInterval({
      start: parseISO(sprint.start_date),
      end: parseISO(sprint.end_date),
    });

    const workingDays = days.filter(day => !isIsraeliWeekend(day));
    const totalWorkingDays = workingDays.length;

    // Calculate capacity for each member with load factor
    const loadFactor = sprint.load_factor || 0.8;

    const memberCapacities = members.map(member => {
      const memberHolidays = holidays.filter(h => h.member_id === member.id);
      const holidayCount = memberHolidays.length;
      const availableDays = totalWorkingDays - holidayCount;
      const capacity = (member.default_capacity * availableDays * loadFactor) / 10;

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
      load_factor: loadFactor,
      member_capacities: memberCapacities,
      total_capacity: Math.round(totalCapacity * 10) / 10,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate sprint capacity' });
  }
};
