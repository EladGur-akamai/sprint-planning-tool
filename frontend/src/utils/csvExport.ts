import { SprintCapacity } from '../types';

export const exportCapacityToCSV = (capacity: SprintCapacity) => {
  const headers = [
    'Team Member',
    'Default Capacity',
    'Total Working Days',
    'Holidays',
    'Available Days',
    'Capacity (Story Points)',
  ];

  const rows = capacity.member_capacities.map(mc => [
    mc.member_name,
    mc.default_capacity,
    mc.total_working_days,
    mc.holidays,
    mc.available_days,
    mc.capacity,
  ]);

  // Add total row
  rows.push([
    'TOTAL',
    '',
    '',
    '',
    '',
    capacity.total_capacity,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${capacity.sprint_name}_capacity.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
