// build.js
const ejs = require('ejs');
const fs = require('fs-extra');
const path = require('path');

// Paths
const viewsDir = path.join(__dirname, 'views');
const outputDir = path.join(__dirname, 'dist');

// Ensure output directory exists
fs.ensureDirSync(outputDir);

// Compile each .ejs file in views/
fs.readdirSync(viewsDir).forEach(file => {
  if (path.extname(file) === '.ejs') {
    const filePath = path.join(viewsDir, file);
    const outputFile = path.join(outputDir, path.basename(file, '.ejs') + '.html');

    // Render EJS to HTML
    const html = ejs.render(fs.readFileSync(filePath, 'utf-8'), {
      // Pass any dynamic data here
      title: 'Project_Poetry_Subs_V1',
    });

    // Write to dist/
    fs.writeFileSync(outputFile, html);
    console.log(`✅ Compiled ${file} → ${outputFile}`);
  }
});