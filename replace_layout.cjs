const fs = require('fs');
const path = require('path');
const dir = './src/pages';
fs.readdirSync(dir).filter(f => f.endsWith('.jsx')).forEach(f => {
  const p = path.join(dir, f);
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes('className="flex-1 overflow-auto min-h-0"')) {
    c = c.replace('className="flex-1 overflow-auto min-h-0"', 'className="overflow-auto min-h-0 flex flex-col"');
    fs.writeFileSync(p, c);
    console.log('Updated ' + f);
  }
});
