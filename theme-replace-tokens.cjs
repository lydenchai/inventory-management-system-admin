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
      .replace(/zinc-50(?!0)/g, 'gray-50')
      .replace(/zinc-100/g, 'gray-100')
      .replace(/zinc-200/g, 'gray-200')
      .replace(/zinc-300/g, 'gray-300')
      .replace(/zinc-400/g, 'gray-400')
      .replace(/zinc-800/g, 'indigo-500')
      .replace(/zinc-900/g, 'indigo-600')
      .replace(/text-black/g, 'text-gray-900') // Map black text to gray-900
      .replace(/text-gray-600/g, 'text-gray-500'); // Ensure secondary text is gray-500

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated ${filePath}`);
      modifiedFiles++;
    }
  }
});

console.log(`Finished updating ${modifiedFiles} files.`);
