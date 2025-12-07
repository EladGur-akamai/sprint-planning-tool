// Script to sync production data to local SQLite database
import Database from 'better-sqlite3';
import path from 'path';

const PROD_API = 'http://66.228.63.81:3001/api';
const LOCAL_DB = path.join(__dirname, '../sprint-planning.db');

async function syncFromProduction() {
  console.log('🔄 Syncing data from production...\n');

  try {
    // Fetch data from production
    console.log('📥 Fetching production data...');
    const [sprints, members, holidays] = await Promise.all([
      fetch(`${PROD_API}/sprints`).then(r => r.json()),
      fetch(`${PROD_API}/members`).then(r => r.json()),
      fetch(`${PROD_API}/holidays`).then(r => r.json()).catch(() => []),
    ]);

    console.log(`   - ${sprints.length} sprints`);
    console.log(`   - ${members.length} team members`);
    console.log(`   - ${holidays.length} holidays\n`);

    // Open local database
    const db = new Database(LOCAL_DB);
    db.pragma('foreign_keys = ON');

    // Clear existing data
    console.log('🗑️  Clearing local database...');
    db.exec(`
      DELETE FROM holidays;
      DELETE FROM sprints;
      DELETE FROM team_members;
    `);

    // Insert team members
    console.log('👥 Inserting team members...');
    const insertMember = db.prepare(`
      INSERT INTO team_members (id, name, role, default_capacity, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const member of members) {
      insertMember.run(
        member.id,
        member.name,
        member.role,
        member.default_capacity,
        member.created_at
      );
    }
    console.log(`   ✅ Inserted ${members.length} team members\n`);

    // Insert sprints
    console.log('📅 Inserting sprints...');
    const insertSprint = db.prepare(`
      INSERT INTO sprints (id, name, start_date, end_date, is_current, load_factor, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const sprint of sprints) {
      insertSprint.run(
        sprint.id,
        sprint.name,
        sprint.start_date,
        sprint.end_date,
        sprint.is_current ? 1 : 0,
        sprint.load_factor || 0.8,
        sprint.created_at
      );
    }
    console.log(`   ✅ Inserted ${sprints.length} sprints\n`);

    // Insert holidays
    if (holidays.length > 0) {
      console.log('🏖️  Inserting holidays...');
      const insertHoliday = db.prepare(`
        INSERT INTO holidays (id, sprint_id, member_id, date)
        VALUES (?, ?, ?, ?)
      `);

      for (const holiday of holidays) {
        insertHoliday.run(
          holiday.id,
          holiday.sprint_id,
          holiday.member_id,
          holiday.date
        );
      }
      console.log(`   ✅ Inserted ${holidays.length} holidays\n`);
    }

    db.close();

    console.log('✅ Sync completed successfully!\n');
    console.log('You can now run `npm run dev` to start the local server with production data.');

  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

syncFromProduction();
