const htmlPdf = require('html-pdf-node');
const fs = require('fs');
const path = require('path');

// Centralized Site & Gateway Destination URLs Configuration
const SITE_URLS = {
  home: 'https://mrpunyapal.dev',
  projects: 'https://mrpunyapal.dev/projects',
  opensource: 'https://mrpunyapal.dev/opensource',
  talks: 'https://mrpunyapal.dev/talks',
  github: 'https://github.com/MrPunyapal',
  linkedin: 'https://linkedin.com/in/mrpunyapal',
  twitter: 'https://x.com/MrPunyapal',
  email: 'mailto:mrpunyapal@gmail.com'
};

const templatePath = path.resolve(__dirname, 'resume-print.html');
let htmlContent = fs.readFileSync(templatePath, 'utf8');

// Inject centralized URLs into template tokens
Object.keys(SITE_URLS).forEach(key => {
  const token = new RegExp(`{{SITE_URLS.${key}}}`, 'g');
  htmlContent = htmlContent.replace(token, SITE_URLS[key]);
});

let file = { content: htmlContent };
let options = {
  format: 'A4',
  margin: { top: '8mm', right: '10mm', bottom: '8mm', left: '10mm' },
  printBackground: true,
  preferCSSPageSize: true
};

htmlPdf.generatePdf(file, options).then(pdfBuffer => {
  const outputPath = path.resolve(__dirname, '../public/resume.pdf');
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log('PDF Generated Successfully at ' + outputPath);
}).catch(err => {
  console.error('Error generating PDF:', err);
});
