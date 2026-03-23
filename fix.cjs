const fs = require('fs');
const path = require('path');

const replacements = {
  'Ã¡': 'á',
  'Ã©': 'é',
  'Ã³': 'ó',
  'Ã­': 'í',
  'Ãº': 'ú',
  'Ã±': 'ñ',
  'Ã‘': 'Ñ',
  'Ã‰': 'É',
  'Ã“': 'Ó',
  'Ãš': 'Ú',
  'Â¡': '¡',
  'Â¿': '¿',
  'âœ¨': '✨',
  'ðŸš€': '🚀',
  'ðŸŽ¨': '🎨',
  '🏛ï¸ ': '🏛️',
  'MÃ¡gico': 'Mágico',
  'DiseÃ±a': 'Diseña',
  'diseÃ±o': 'diseño',
  'elÃ©ctrico': 'eléctrico',
  'NeÃ³n': 'Neón',
  'OrientaciÃ³n': 'Orientación',
  'TipografÃ­a': 'Tipografía',
  'PÃ©rez': 'Pérez',
  'lÃ­mite': 'límite',
  'automÃ¡ticamente': 'automáticamente',
  'InformaciÃ³n': 'Información',
  'BÃ¡sica': 'Básica',
  'GÃ³mez': 'Gómez',
  'TelÃ©fono': 'Teléfono',
  'BiografÃ­a': 'Biografía',
  'pasiÃ³n': 'pasión',
  'AÃ±ade': 'Añade',
  'AÃ±adir': 'Añadir',
  'UbicaciÃ³n': 'Ubicación',
  'PaÃ­s': 'País',
  'EspaÃ±a': 'España',
  'aquÃ­': 'aquí',
  'DescripciÃ³n': 'Descripción',
  'aÃ±adiendo': 'añadiendo',
  'MÃ©xico': 'México',
  'MÃ¡x': 'Máx',
  'estÃ©s': 'estés',
  'mÃ¡s': 'más',
  'CategorÃ­a': 'Categoría',
  'TÃ©cnica': 'Técnica',
  'tÃ©cnicos': 'técnicos',
  'construcciÃ³n': 'construcción',
  'SesiÃ³n': 'Sesión',
  'AquÃ­': 'Aquí',
  'Ãºnico': 'único',
  'presentaciÃ³n': 'presentación'
};

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [bad, good] of Object.entries(replacements)) {
    if (content.includes(bad)) {
      content = content.split(bad).join(good);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      fixFile(fullPath);
    }
  }
}

walk(path.join(__dirname, 'src'));
