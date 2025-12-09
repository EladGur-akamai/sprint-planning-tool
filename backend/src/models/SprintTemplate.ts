import { queryAll, queryOne, queryInsert, queryRun } from '../database/queries';
import { addWeeks, addDays, format, startOfQuarter, endOfQuarter } from 'date-fns';
import { SprintModel } from './Sprint';

export interface SprintTemplate {
  id?: number;
  name: string;
  year: number;
  quarter: number;
  sprint_number: number;
  start_date: string;
  end_date: string;
  duration_weeks: number;
  load_factor: number;
  created_at?: string;
}

export class SprintTemplateModel {
  static async getAll(): Promise<SprintTemplate[]> {
    return queryAll<SprintTemplate>('SELECT * FROM sprint_templates ORDER BY year DESC, quarter DESC, sprint_number ASC');
  }

  static async getById(id: number): Promise<SprintTemplate | undefined> {
    return queryOne<SprintTemplate>('SELECT * FROM sprint_templates WHERE id = ?', [id]);
  }

  static async getByQuarter(year: number, quarter: number): Promise<SprintTemplate[]> {
    return queryAll<SprintTemplate>(
      'SELECT * FROM sprint_templates WHERE year = ? AND quarter = ? ORDER BY sprint_number ASC',
      [year, quarter]
    );
  }

  static async getAvailableQuarters(): Promise<Array<{ year: number; quarter: number }>> {
    const result = await queryAll<{ year: number; quarter: number }>(
      'SELECT DISTINCT year, quarter FROM sprint_templates ORDER BY year DESC, quarter DESC'
    );
    return result;
  }

  static async create(template: Omit<SprintTemplate, 'id' | 'created_at'>): Promise<SprintTemplate> {
    const result = await queryInsert<SprintTemplate>(
      'INSERT INTO sprint_templates (name, year, quarter, sprint_number, start_date, end_date, duration_weeks, load_factor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        template.name,
        template.year,
        template.quarter,
        template.sprint_number,
        template.start_date,
        template.end_date,
        template.duration_weeks,
        template.load_factor,
      ]
    );
    return { ...template, ...result };
  }

  static async update(id: number, template: Partial<Omit<SprintTemplate, 'id' | 'created_at'>>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (template.name !== undefined) {
      fields.push('name = ?');
      values.push(template.name);
    }
    if (template.year !== undefined) {
      fields.push('year = ?');
      values.push(template.year);
    }
    if (template.quarter !== undefined) {
      fields.push('quarter = ?');
      values.push(template.quarter);
    }
    if (template.sprint_number !== undefined) {
      fields.push('sprint_number = ?');
      values.push(template.sprint_number);
    }
    if (template.start_date !== undefined) {
      fields.push('start_date = ?');
      values.push(template.start_date);
    }
    if (template.end_date !== undefined) {
      fields.push('end_date = ?');
      values.push(template.end_date);
    }
    if (template.duration_weeks !== undefined) {
      fields.push('duration_weeks = ?');
      values.push(template.duration_weeks);
    }
    if (template.load_factor !== undefined) {
      fields.push('load_factor = ?');
      values.push(template.load_factor);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const result = await queryRun(`UPDATE sprint_templates SET ${fields.join(', ')} WHERE id = ?`, values);
    return result.changes > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await queryRun('DELETE FROM sprint_templates WHERE id = ?', [id]);
    return result.changes > 0;
  }

  /**
   * Generate sprint templates for a quarter
   * @param year - The year (e.g., 2025)
   * @param quarter - The quarter (1-4)
   * @param durationWeeks - Duration of each sprint in weeks
   * @param firstSprintStart - Start date of the first sprint
   * @returns Array of created sprint templates
   */
  static async generateQuarterTemplates(
    year: number,
    quarter: number,
    durationWeeks: number,
    firstSprintStart: Date
  ): Promise<SprintTemplate[]> {
    // Calculate quarter end date
    const quarterStart = startOfQuarter(new Date(year, (quarter - 1) * 3, 1));
    const quarterEnd = endOfQuarter(quarterStart);

    const templates: SprintTemplate[] = [];
    let sprintNumber = 1;
    let currentStart = firstSprintStart;

    // Generate sprints until we reach the quarter end
    while (currentStart < quarterEnd) {
      const endDate = addDays(addWeeks(currentStart, durationWeeks), -1);

      // Don't create sprints that end after the quarter
      if (endDate > quarterEnd) {
        break;
      }

      const template = await this.create({
        name: `${year} Q${quarter} Sprint ${sprintNumber}`,
        year,
        quarter,
        sprint_number: sprintNumber,
        start_date: format(currentStart, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        duration_weeks: durationWeeks,
        load_factor: 0.8,
      });

      templates.push(template);
      currentStart = addWeeks(currentStart, durationWeeks);
      sprintNumber++;
    }

    return templates;
  }

  /**
   * Adopt a template for a team - creates a team-specific sprint from the template
   * @param templateId - The template ID to adopt
   * @param teamId - The team ID adopting the template
   * @param customDates - Optional custom dates to override template dates
   * @returns The created sprint
   */
  static async adoptTemplateForTeam(
    templateId: number,
    teamId: number,
    customDates?: { start_date?: string; end_date?: string }
  ) {
    const template = await this.getById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const sprint = await SprintModel.create({
      team_id: teamId,
      name: template.name,
      start_date: customDates?.start_date || template.start_date,
      end_date: customDates?.end_date || template.end_date,
      is_current: false,
      load_factor: template.load_factor,
    });

    // Update the sprint to include template metadata
    await queryRun(
      'UPDATE sprints SET template_id = ?, year = ?, quarter = ? WHERE id = ?',
      [templateId, template.year, template.quarter, sprint.id]
    );

    return { ...sprint, template_id: templateId, year: template.year, quarter: template.quarter };
  }
}
