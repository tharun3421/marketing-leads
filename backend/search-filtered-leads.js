const fs = require('fs');
const content = fs.readFileSync('C:/Users/user/.gemini/antigravity/scratch/marketing-lead-collector/frontend/src/components/Portals/TechnicalPortal.jsx', 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('filteredLeads')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
