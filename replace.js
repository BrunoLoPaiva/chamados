const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      content = content.replace(/rounded-2xl/g, 'rounded-lg')
                       .replace(/rounded-xl/g, 'rounded-md')
                       .replace(/rounded-t-2xl/g, 'rounded-t-lg')
                       .replace(/rounded-b-2xl/g, 'rounded-b-lg')
                       .replace(/rounded-l-2xl/g, 'rounded-l-lg')
                       .replace(/rounded-r-2xl/g, 'rounded-r-lg')
                       .replace(/rounded-t-xl/g, 'rounded-t-md');
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

replaceInDir(path.join(__dirname, 'src'));
