const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'frontend', 'src', 'components', 'Portals');
const query = process.argv[2] || 'adBudgetPerDay';

console.log(`Searching for "${query}" in ${dir}...`);

fs.readdirSync(dir).forEach(file => {
  if (!file.endsWith('.jsx')) return;
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes(query)) {
      console.log(`${file}:${idx + 1}: ${line.trim()}`);
    }
  });
});
