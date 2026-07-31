const { test, expect } = require('@playwright/test');
const { workflowModules } = require('../../utility/config');

test('ADSE workflow excludes disabled modules and preserves baseline order', async () => {
  const modules = workflowModules();
  const names = modules.map(module => module.name);
  expect(names).not.toContain('Drivers');
  expect(names).not.toContain('Staff Categories');
  expect(names).toEqual([
    'Academic Session',
    'Classes and Sections',
    'Subject Assignment',
    'Vehicles',
    'Transport Routes',
    'Fee Types',
    'Faculty',
    'Students'
  ]);
});
