const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let files = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      files = files.concat(walkDir(fullPath));
    } else {
      if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
        files.push(fullPath);
      }
    }
  });
  return files;
}

const files = walkDir('./src');
let updated = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/#1e3a5f/gi, '#4f46e5');
  newContent = newContent.replace(/#16375b/gi, '#4338ca');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    updated++;
  }
});

console.log(`Updated ${updated} files with the new Vibrant Indigo color palette.`);
