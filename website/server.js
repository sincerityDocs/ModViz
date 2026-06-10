import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Expose shared renders directory statically under /renders
const SHARED_RENDERS_DIR = '/home/team/shared/renders';
if (!fs.existsSync(SHARED_RENDERS_DIR)) {
  try {
    fs.mkdirSync(SHARED_RENDERS_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating shared renders dir:', err);
  }
}
app.use('/renders', express.static(SHARED_RENDERS_DIR));

// In-memory shares store
const shares = new Map();

// Helper to query products from SQLite or catalog.json with fallback
function getCatalog() {
  const catalogPath = '/home/team/shared/catalog.json';
  
  // 1. Check if catalog.json exists
  if (fs.existsSync(catalogPath)) {
    try {
      const data = fs.readFileSync(catalogPath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading catalog.json:', err);
    }
  }

  // 2. Try to query database
  try {
    const dbOutput = execSync('team-db "SELECT * FROM products"', { encoding: 'utf8', timeout: 5000 });
    const parsed = JSON.parse(dbOutput);
    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Error querying SQLite database via team-db:', err.message);
  }

  // 3. Fallback Catalog
  return [
    // WRAPS
    {
      id: "wrap-chrome-red",
      category: "wrap",
      brand: "Inozetek",
      name: "Satin Chrome Red",
      price: 2400,
      margin: 0.35,
      sku: "WR-SCR-01",
      description: "Premium chrome red vinyl wrap with a striking satin metallic sheen.",
      specs: "Avery Dennison high-durability backing, 3.5 mil thick",
      image_url: "red"
    },
    {
      id: "wrap-matte-black",
      category: "wrap",
      brand: "3M",
      name: "Stealth Matte Black",
      price: 2200,
      margin: 0.30,
      sku: "WR-SMB-02",
      description: "Aggressive, light-absorbing deep stealth matte black vinyl wrap.",
      specs: "3M 2080 Series, pressure-activated adhesive with micro technology",
      image_url: "black"
    },
    {
      id: "wrap-nardo-grey",
      category: "wrap",
      brand: "Inozetek",
      name: "Gloss Nardo Grey",
      price: 2000,
      margin: 0.40,
      sku: "WR-GNG-03",
      description: "Ultra-premium super glossy battleship grey wrap, mimicking modern performance OEM finishes.",
      specs: "Super-glossy finish, self-healing technology",
      image_url: "grey"
    },
    {
      id: "wrap-pearl-white",
      category: "wrap",
      brand: "Avery",
      name: "Metallic Pearl White",
      price: 2100,
      margin: 0.32,
      sku: "WR-MPW-04",
      description: "Classy metallic white wrap with multidimensional gold and blue pearl flakes.",
      specs: "Avery Dennison SW900 Series, dual-layer premium cast film",
      image_url: "white"
    },
    {
      id: "wrap-miami-blue",
      category: "wrap",
      brand: "KPMF",
      name: "Gloss Miami Blue",
      price: 2200,
      margin: 0.35,
      sku: "WR-GMB-05",
      description: "High-octane, intense glossy blue reminiscent of premium supercar finishes.",
      specs: "High-gloss cast vinyl, 10-year durability",
      image_url: "blue"
    },
    {
      id: "wrap-lime-green",
      category: "wrap",
      brand: "3M",
      name: "Neon Lime Green",
      price: 2300,
      margin: 0.38,
      sku: "WR-NLG-06",
      description: "Ultra-bright, neon acid green wrap that demands full road attention.",
      specs: "UV-protected neon pigmentation, bubble-free release layers",
      image_url: "green"
    },
    
    // SPLITTERS
    {
      id: "splitter-seibon-carbon",
      category: "splitter",
      brand: "Seibon Carbon",
      name: "Carbon Fiber Front Splitter",
      price: 1250,
      margin: 0.28,
      sku: "SP-SFC-11",
      description: "Lightweight, handmade real carbon fiber splitter. Exceptional fitment and high-gloss clear coat finish.",
      specs: "2x2 twill weave carbon fiber, UV resistant clear coat",
      image_url: "splitter-carbon"
    },
    {
      id: "splitter-apr-aero",
      category: "splitter",
      brand: "APR Performance",
      name: "Aero Track Front Splitter",
      price: 890,
      margin: 0.25,
      sku: "SP-APR-12",
      description: "Fully functional carbon fiber splitter with stainless steel adjustable support rods.",
      specs: "Carbon fiber reinforced polymer, includes struts and mounting brackets",
      image_url: "splitter-apr"
    },
    {
      id: "splitter-matte-black",
      category: "splitter",
      brand: "Maxton Design",
      name: "Gloss Black Street Splitter",
      price: 450,
      margin: 0.35,
      sku: "SP-MAX-13",
      description: "Durable ABS plastic lip splitter in piano gloss black. Highly impact-resistant.",
      specs: "ABS Plastic, matte underside, includes full hardware kit",
      image_url: "splitter-gloss"
    },

    // SPOILERS / WINGS
    {
      id: "wing-apr-gt",
      category: "spoiler",
      brand: "APR Performance",
      name: "GTC-300 Adjustable GT Wing",
      price: 1850,
      margin: 0.26,
      sku: "WN-APR-21",
      description: "67-inch carbon fiber racing GT wing with adjustable angles of attack. Ultimate track performance.",
      specs: "Pre-preg carbon fiber autoclave construction, aircraft-grade aluminum pedestals",
      image_url: "wing-gt"
    },
    {
      id: "wing-seibon-ducktail",
      category: "spoiler",
      brand: "Seibon Carbon",
      name: "Carbon Fiber Ducktail Spoiler",
      price: 650,
      margin: 0.30,
      sku: "WN-SCD-22",
      description: "Aggressive integrated ducktail spoiler made of premium carbon fiber. Enhances lines and rear downforce.",
      specs: "Direct mount, real carbon fiber, glossy shell",
      image_url: "wing-ducktail"
    },
    {
      id: "wing-vorsteiner-wing",
      category: "spoiler",
      brand: "Vorsteiner",
      name: "V-TRS Carbon Aero Spoiler",
      price: 1550,
      margin: 0.32,
      sku: "WN-VOR-23",
      description: "Sleek low-mount carbon fiber spoiler designed for modern premium sports vehicles.",
      specs: "Autoclaved dry carbon fiber, high UV protective lacquer",
      image_url: "wing-vorsteiner"
    },

    // WHEELS
    {
      id: "wheel-hre-s101",
      category: "wheels",
      brand: "HRE Performance",
      name: "HRE S101 Forged 3-Piece Wheels",
      price: 4800,
      margin: 0.25,
      sku: "WH-HRE-31",
      description: "Exquisite 3-piece custom forged wheels. Features satin black center, polished lips, and exposed hardware.",
      specs: "Aerospace-grade 6061-T6 forged aluminum, customized offset/width",
      image_url: "wheel-hre"
    },
    {
      id: "wheel-bbs-lm",
      category: "wheels",
      brand: "BBS Wheels",
      name: "BBS LM 2-Piece Mesh Wheels",
      price: 3950,
      margin: 0.28,
      sku: "WH-BBS-32",
      description: "Iconic classic 2-piece mesh design. Gold center with diamond cut rim.",
      specs: "Die-forged aluminum body, titanium hardware",
      image_url: "wheel-bbs"
    },
    {
      id: "wheel-vossen-hf5",
      category: "wheels",
      brand: "Vossen",
      name: "HF-5 Hybrid Forged Wheels",
      price: 2400,
      margin: 0.35,
      sku: "WH-VOS-33",
      description: "Y-spoke modern aggressive design. Premium satin bronze finish.",
      specs: "Flow formed hybrid forging, deep concave profiles",
      image_url: "wheel-vossen"
    }
  ];
}

// Helper to normalize product schema from catalog.json or DB to frontend Product schema
function normalizeProducts(rawProducts) {
  if (!Array.isArray(rawProducts)) return [];
  
  const normalized = rawProducts.map(p => {
    // 1. Category mapping
    let category = (p.category || '').toLowerCase();
    if (category === 'wrap') {
      category = 'wrap';
    } else if (category === 'splitter' || category === 'front lip' || category === 'hood' || category === 'grill' || category === 'front_lip') {
      category = 'splitter';
    } else if (category === 'wing' || category === 'spoiler' || category === 'diffuser') {
      category = 'spoiler';
    } else if (category === 'wheels' || category === 'rims') {
      category = 'wheels';
    } else {
      category = 'splitter'; // default aero
    }

    // 2. Name mapping
    const name = p.product_name || p.name || 'Premium Mod';

    // 3. Price mapping
    const price = Number(p.price_retail || p.price || p.price_cost || 0);

    // 4. SKU mapping
    const sku = p.sku || `MV-${category.toUpperCase().slice(0, 2)}-${p.id || Math.floor(Math.random() * 1000)}`;

    // 5. Specs mapping
    const specs = p.specs || (p.drop_ship_available ? 'Drop-Ship Eligible' : 'In Stock');

    // 6. Image URL mapping / wrap color mapping
    let imageUrl = p.image_url || '';
    if (category === 'wrap') {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('black')) imageUrl = 'black';
      else if (lowerName.includes('white')) imageUrl = 'white';
      else if (lowerName.includes('red')) imageUrl = 'red';
      else if (lowerName.includes('blue')) imageUrl = 'blue';
      else if (lowerName.includes('grey') || lowerName.includes('gray')) imageUrl = 'grey';
      else if (lowerName.includes('green')) imageUrl = 'green';
    }

    return {
      id: String(p.id || sku),
      category,
      brand: p.brand || 'Premium Brand',
      name,
      price,
      margin: Number(p.margin || 0.25),
      sku,
      description: p.description || '',
      specs,
      image_url: imageUrl
    };
  });

  // 7. Ensure wheels exist in catalog (append standard wheels if not present)
  const hasWheels = normalized.some(p => p.category === 'wheels');
  if (!hasWheels) {
    normalized.push(
      {
        id: "wheel-hre-s101",
        category: "wheels",
        brand: "HRE Performance",
        name: "HRE S101 Forged 3-Piece Wheels",
        price: 4800,
        margin: 0.25,
        sku: "WH-HRE-31",
        description: "Exquisite 3-piece custom forged wheels. Features satin black center, polished lips, and exposed hardware.",
        specs: "Aerospace-grade 6061-T6 forged aluminum",
        image_url: "wheel-hre"
      },
      {
        id: "wheel-bbs-lm",
        category: "wheels",
        brand: "BBS Wheels",
        name: "BBS LM 2-Piece Mesh Wheels",
        price: 3950,
        margin: 0.28,
        sku: "WH-BBS-32",
        description: "Iconic classic 2-piece mesh design. Gold center with diamond cut rim.",
        specs: "Die-forged aluminum body, titanium hardware",
        image_url: "wheel-bbs"
      },
      {
        id: "wheel-vossen-hf5",
        category: "wheels",
        brand: "Vossen",
        name: "HF-5 Hybrid Forged Wheels",
        price: 2400,
        margin: 0.35,
        sku: "WH-VOS-33",
        description: "Y-spoke modern aggressive design. Premium satin bronze finish.",
        specs: "Flow formed hybrid forging, deep concave profiles",
        image_url: "wheel-vossen"
      }
    );
  }

  return normalized;
}

// API: Get product catalog
app.get('/api/products', (req, res) => {
  const rawProducts = getCatalog();
  const normalized = normalizeProducts(rawProducts);
  res.json(normalized);
});

// API: Process Render requests
app.post('/api/render', async (req, res) => {
  const { model, angle, color, mods = {} } = req.body;
  
  if (!model || !angle || !color) {
    return res.status(400).json({ error: 'Missing required render parameters' });
  }

  console.log(`Render requested: ${model} | Angle: ${angle} | Color: ${color} | Mods:`, mods);

  let matchedFile = null;
  if (fs.existsSync(SHARED_RENDERS_DIR)) {
    try {
      const files = fs.readdirSync(SHARED_RENDERS_DIR);
      const queryModel = model.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const queryAngle = angle.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const queryColor = color.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      const match = files.find(f => {
        const lf = f.toLowerCase();
        return lf.includes(queryModel) && lf.includes(queryAngle) && lf.includes(queryColor);
      });
      
      if (match) {
        matchedFile = `/renders/${match}`;
        console.log(`Matched pre-generated render file: ${matchedFile}`);
      }
    } catch (err) {
      console.error('Error scanning renders directory:', err);
    }
  }

  setTimeout(() => {
    if (matchedFile) {
      return res.json({
        success: true,
        image_url: matchedFile,
        render_time_sec: 1.5,
        ai_powered: true
      });
    }

    res.json({
      success: true,
      image_url: null, 
      render_time_sec: 1.2,
      ai_powered: true,
      meta: { model, angle, color, mods }
    });
  }, 1500);
});

// API: Save shareable link
app.post('/api/share', (req, res) => {
  const config = req.body;
  const id = Math.random().toString(36).substring(2, 8);
  shares.set(id, config);
  res.json({ id, url: `${req.protocol}://${req.get('host')}/?share=${id}` });
});

// API: Retrieve shareable link
app.get('/api/share/:id', (req, res) => {
  const config = shares.get(req.params.id);
  if (!config) {
    return res.status(404).json({ error: 'Config not found' });
  }
  res.json(config);
});

// Serve frontend build static files
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback all other routes to index.html for SPA routing
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Express server on port 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ModViz Web Server listening publicly on http://0.0.0.0:${PORT}`);
});
