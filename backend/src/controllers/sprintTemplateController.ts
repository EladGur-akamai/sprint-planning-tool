import { Request, Response } from 'express';
import { SprintTemplateModel } from '../models/SprintTemplate';
import { parseISO } from 'date-fns';

export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await SprintTemplateModel.getAll();
    res.json(templates);
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const template = await SprintTemplateModel.getById(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    console.error('Failed to fetch template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
};

export const getTemplatesByQuarter = async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.params.year);
    const quarter = parseInt(req.params.quarter);

    if (quarter < 1 || quarter > 4) {
      return res.status(400).json({ error: 'Quarter must be between 1 and 4' });
    }

    const templates = await SprintTemplateModel.getByQuarter(year, quarter);
    res.json(templates);
  } catch (error) {
    console.error('Failed to fetch templates by quarter:', error);
    res.status(500).json({ error: 'Failed to fetch templates by quarter' });
  }
};

export const getAvailableQuarters = async (req: Request, res: Response) => {
  try {
    const quarters = await SprintTemplateModel.getAvailableQuarters();
    res.json(quarters);
  } catch (error) {
    console.error('Failed to fetch available quarters:', error);
    res.status(500).json({ error: 'Failed to fetch available quarters' });
  }
};

export const generateQuarterTemplates = async (req: Request, res: Response) => {
  try {
    const { year, quarter, duration_weeks, first_sprint_start } = req.body;

    if (!year || !quarter || !duration_weeks || !first_sprint_start) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (quarter < 1 || quarter > 4) {
      return res.status(400).json({ error: 'Quarter must be between 1 and 4' });
    }

    if (duration_weeks < 1 || duration_weeks > 8) {
      return res.status(400).json({ error: 'Duration must be between 1 and 8 weeks' });
    }

    const firstSprintStart = parseISO(first_sprint_start);
    const templates = await SprintTemplateModel.generateQuarterTemplates(
      year,
      quarter,
      duration_weeks,
      firstSprintStart
    );

    res.status(201).json(templates);
  } catch (error) {
    console.error('Failed to generate quarter templates:', error);
    res.status(500).json({ error: 'Failed to generate quarter templates', details: (error as Error).message });
  }
};

export const adoptTemplate = async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);
    const { team_id, start_date, end_date } = req.body;

    if (!team_id) {
      return res.status(400).json({ error: 'team_id is required' });
    }

    const customDates = (start_date || end_date) ? { start_date, end_date } : undefined;
    const sprint = await SprintTemplateModel.adoptTemplateForTeam(templateId, team_id, customDates);

    res.status(201).json(sprint);
  } catch (error) {
    console.error('Failed to adopt template:', error);
    res.status(500).json({ error: 'Failed to adopt template', details: (error as Error).message });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;

    const success = await SprintTemplateModel.update(id, updates);
    if (!success) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const updated = await SprintTemplateModel.getById(id);
    res.json(updated);
  } catch (error) {
    console.error('Failed to update template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const success = await SprintTemplateModel.delete(id);
    if (!success) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
};
