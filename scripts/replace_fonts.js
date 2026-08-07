const fs = require('fs');

const filesToPatch = [
  'app/(public)/index.web.tsx',
  'app/(public)/login.tsx',
  'app/(public)/signup.tsx'
];

for (const f of filesToPatch) {
  if (!fs.existsSync(f)) continue;
  let content = fs.readFileSync(f, 'utf8');

  // Replace font injector URL
  content = content.replace(
    /family=Syne:wght@400;600;700;800;900&family=DM\+Sans:wght@400;500;600;700/g,
    'family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700'
  );
  
  content = content.replace(
    /family=Syne:wght@400;600;700;800&family=DM\+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400/g,
    'family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700'
  );

  // Replace font families globally
  content = content.replace(/'Syne'/g, "'Outfit'");
  content = content.replace(/'DM Sans'/g, "'Inter'");

  fs.writeFileSync(f, content, 'utf8');
}

console.log('Fonts replaced successfully!');
