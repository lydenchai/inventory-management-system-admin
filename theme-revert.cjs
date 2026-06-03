const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedFiles = 0;

walkDir(path.join(__dirname, 'src'), function(filePath) {
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    let newContent = content
      .replace(/#4F46E5/g, '#1e3a5f')
      .replace(/#4f46e5/g, '#1e3a5f')
      .replace(/#4338CA/g, '#16375b')
      .replace(/#4338ca/g, '#16375b')
      .replace(/indigo-600/g, '[#1e3a5f]')
      .replace(/indigo-700/g, '[#16375b]');

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated ${filePath}`);
      modifiedFiles++;
    }
  }
});

console.log(`Finished updating ${modifiedFiles} files.`);
