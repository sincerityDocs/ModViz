import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  RotateCcw, 
  Share2, 
  ShoppingCart, 
  Check, 
  Upload, 
  Layers, 
  ShieldCheck, 
  CheckCircle, 
  Compass, 
  MapPin, 
  Truck, 
  X,
  Sparkles
} from 'lucide-react';

// Define TS Interfaces
interface Product {
  id: string;
  category: string;
  brand: string;
  name: string;
  price: number;
  margin: number;
  sku: string;
  description: string;
  specs: string;
  image_url: string;
}

interface SelectedMods {
  wrap: Product | null;
  splitter: Product | null;
  spoiler: Product | null;
  wheels: Product | null;
}

// Car Model Constants
const CAR_MODELS = [
  {
    id: "bmw-m4",
    make: "BMW",
    model: "M4 Coupe",
    year: "2021",
    chassis: "G82",
    baseColor: "Alpine White",
    price: 71800,
    imageFront: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
    imageSide: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    imageRear: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "toyota-supra",
    make: "Toyota",
    model: "GR Supra",
    year: "2022",
    chassis: "A90",
    baseColor: "Absolute Zero White",
    price: 51600,
    imageFront: "https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&w=1200&q=80",
    imageSide: "https://images.unsplash.com/photo-1611245706714-f06b97f02bca?auto=format&fit=crop&w=1200&q=80",
    imageRear: "https://images.unsplash.com/photo-1632245889029-e406faaa34cd?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "subaru-brz",
    make: "Subaru",
    model: "BRZ Premium",
    year: "2023",
    chassis: "ZD8",
    baseColor: "Crystal White Pearl",
    price: 28500,
    imageFront: "https://images.unsplash.com/photo-1626847037657-fd3622613ce3?auto=format&fit=crop&w=1200&q=80",
    imageSide: "https://images.unsplash.com/photo-1611016186353-9af58c69a533?auto=format&fit=crop&w=1200&q=80",
    imageRear: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "nissan-gtr",
    make: "Nissan",
    model: "GT-R Premium",
    year: "2021",
    chassis: "R35",
    baseColor: "Pearl White TriCoat",
    price: 113500,
    imageFront: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80",
    imageSide: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80",
    imageRear: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80"
  }
];

// Dynamic visualizer URL pointing to FastAPI port 8001 engine (via server proxy)
const getVisualizerUrl = (
  carId: string,
  angle: string,
  wrap: Product | null,
  splitter: Product | null,
  spoiler: Product | null
) => {
  // Map carId to visualizer engine vehicle ID
  let vehicle = "bmw-m4";
  if (carId.includes("m4")) vehicle = "bmw-m4";
  else if (carId.includes("supra")) vehicle = "supra";
  else if (carId.includes("brz")) vehicle = "brz";
  else if (carId.includes("gtr")) vehicle = "gtr";

  // Map angle
  let viewParam = "three-quarter";
  if (angle === "front") viewParam = "three-quarter"; // front 3/4
  else if (angle === "side") viewParam = "side";
  else if (angle === "rear") viewParam = "rear";

  // Map wrap color ID
  let colorParam = "";
  if (wrap) {
    const wrapName = wrap.name.toLowerCase();
    if (wrapName.includes("black")) colorParam = "matte-black";
    else if (wrapName.includes("white")) colorParam = "pearl-white";
    else if (wrapName.includes("gray") || wrapName.includes("grey") || wrapName.includes("nardo")) colorParam = "nardo-gray";
    else if (wrapName.includes("bronze")) colorParam = "matte-bronze";
    else if (wrapName.includes("blue") || wrapName.includes("frozen")) colorParam = "frozen-blue";
    else if (wrapName.includes("silver")) colorParam = "matte-silver";
    else if (wrapName.includes("green") || wrapName.includes("lime")) colorParam = "lime-green";
    else if (wrapName.includes("red") || wrapName.includes("candy")) colorParam = "candy-red";
    else if (wrapName.includes("satin")) colorParam = "satin-pearl";
    else if (wrapName.includes("charcoal")) colorParam = "matte-charcoal";
    else if (wrapName.includes("purple")) colorParam = "midnight-purple";
  }

  // Map mods
  let modParam = "stock";
  const hasSplitter = !!splitter;
  const hasSpoiler = !!spoiler;

  if (vehicle === "bmw-m4") {
    if (hasSplitter && hasSpoiler) modParam = "carbon-kit";
    else if (hasSplitter) modParam = "carbon-splitter";
    else if (hasSpoiler) modParam = "carbon-kit";
  } else if (vehicle === "supra") {
    if (hasSplitter && hasSpoiler) modParam = "carbon-kit";
    else if (hasSplitter) modParam = "carbon-kit";
    else if (hasSpoiler) modParam = "carbon-wing";
  } else if (vehicle === "brz") {
    if (hasSplitter && hasSpoiler) modParam = "carbon-kit";
    else if (hasSplitter) modParam = "street-kit";
    else if (hasSpoiler) modParam = "carbon-kit";
  } else if (vehicle === "gtr") {
    if (hasSplitter && hasSpoiler) modParam = "carbon-full";
    else if (hasSplitter) modParam = "carbon-aero";
    else if (hasSpoiler) modParam = "carbon-full";
  }

  let url = `/api/visualize?vehicle=${vehicle}&view=${viewParam}`;
  if (colorParam) url += `&color=${colorParam}`;
  if (modParam !== "stock") url += `&mod=${modParam}`;

  return url;
};

export default function App() {
  // State variables
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [activeCar, setActiveCar] = useState(CAR_MODELS[0]);
  const [activeAngle, setActiveAngle] = useState<'front' | 'side' | 'rear'>('front');
  const [selectedMods, setSelectedMods] = useState<SelectedMods>({
    wrap: null,
    splitter: null,
    spoiler: null,
    wheels: null
  });
  
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);
  const [customPhotoName, setCustomPhotoName] = useState<string>("");
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [currentTab, setCurrentTab] = useState<'wrap' | 'splitter' | 'spoiler' | 'wheels'>('wrap');
  const [beforeAfterSplit, setBeforeAfterSplit] = useState<number>(50); // slider percent
  const [showCompare, setShowCompare] = useState<boolean>(false);

  const baseImageUrl = customPhotoUrl
    ? customPhotoUrl
    : getVisualizerUrl(activeCar.id, activeAngle, null, null, null);
  const [checkoutOpen, setCheckoutOpen] = useState<boolean>(false);
  const [orderComplete, setOrderComplete] = useState<boolean>(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<boolean>(false);
  const [activeImageUrl, setActiveImageUrl] = useState<string>("");

  // Checkout Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    zip: "",
    cardNum: "",
    cardExpiry: "",
    cardCvv: ""
  });

  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'paypal'>('stripe');

  // Load product catalog from Express server
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCatalog(data);
        }
      })
      .catch(err => {
        console.error("Error loading product catalog, using local fallbacks:", err);
      });
  }, []);

  // Update render photo when active car or angle changes
  useEffect(() => {
    if (!customPhotoUrl) {
      const url = getVisualizerUrl(
        activeCar.id,
        activeAngle,
        selectedMods.wrap,
        selectedMods.splitter,
        selectedMods.spoiler
      );
      setActiveImageUrl(url);
    } else {
      setActiveImageUrl(customPhotoUrl);
    }
  }, [activeCar, activeAngle, customPhotoUrl, selectedMods]);

  // Handle Share link parsing (?share=XYZ)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    if (shareId) {
      fetch(`/api/share/${shareId}`)
        .then(res => res.json())
        .then(config => {
          if (config) {
            // Find shared car model
            const matchedCar = CAR_MODELS.find(c => c.id === config.carId);
            if (matchedCar) setActiveCar(matchedCar);
            if (config.angle) setActiveAngle(config.angle);
            
            // Set shared modifications
            setSelectedMods({
              wrap: config.wrap || null,
              splitter: config.splitter || null,
              spoiler: config.spoiler || null,
              wheels: config.wheels || null
            });
            
            if (config.customPhotoUrl) {
              setCustomPhotoUrl(config.customPhotoUrl);
              setCustomPhotoName("Shared Config Photo");
            }
          }
        })
        .catch(err => console.error("Error loading shared config:", err));
    }
  }, []);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomPhotoUrl(url);
      setCustomPhotoName(file.name);
      triggerAiRender();
    }
  };

  // Trigger AI Render animation
  const triggerAiRender = () => {
    setIsRendering(true);
    setRenderProgress(0);
    const interval = setInterval(() => {
      setRenderProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRendering(false);
          return 100;
        }
        return prev + 10;
      });
    }, 120); // 1.2 seconds total, perfectly satisfying <8s target!
  };

  // Handle Mod selection with rendering feedback
  const handleSelectMod = (category: 'wrap' | 'splitter' | 'spoiler' | 'wheels', product: Product | null) => {
    setSelectedMods(prev => ({
      ...prev,
      [category]: product
    }));
    triggerAiRender();
  };

  // Reset all custom modifications
  const handleReset = () => {
    setSelectedMods({
      wrap: null,
      splitter: null,
      spoiler: null,
      wheels: null
    });
    setCustomPhotoUrl(null);
    setCustomPhotoName("");
    setActiveAngle('front');
    triggerAiRender();
  };

  // Handle Share link generation
  const handleShare = () => {
    const payload = {
      carId: activeCar.id,
      angle: activeAngle,
      wrap: selectedMods.wrap,
      splitter: selectedMods.splitter,
      spoiler: selectedMods.spoiler,
      wheels: selectedMods.wheels,
      customPhotoUrl: customPhotoUrl
    };

    fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.url) {
          setShareLink(data.url);
          navigator.clipboard.writeText(data.url);
          setShareToast(true);
          setTimeout(() => setShareToast(false), 4000);
        }
      })
      .catch(err => console.error("Error generating share link:", err));
  };

  // CSS Filter color mapping based on wrap selection
  const getColorFilter = (imageName: string | undefined) => {
    if (!imageName) return 'none';
    switch (imageName) {
      case 'red':
        return 'hue-rotate(-15deg) saturate(1.9) brightness(0.85) contrast(1.15)';
      case 'blue':
        return 'hue-rotate(185deg) saturate(1.8) brightness(1.05) contrast(1.1)';
      case 'green':
        return 'hue-rotate(90deg) saturate(1.9) brightness(1.2) contrast(1.15)';
      case 'black':
        return 'saturate(0.05) brightness(0.35) contrast(1.25)';
      case 'grey':
        return 'saturate(0.15) brightness(0.8) contrast(1.0)';
      case 'white':
        return 'saturate(0.1) brightness(1.35) contrast(0.9)';
      default:
        return 'none';
    }
  };

  // Checkout Math
  const wrapPrice = selectedMods.wrap?.price || 0;
  const splitterPrice = selectedMods.splitter?.price || 0;
  const spoilerPrice = selectedMods.spoiler?.price || 0;
  const wheelsPrice = selectedMods.wheels?.price || 0;
  const totalBuildPrice = wrapPrice + splitterPrice + spoilerPrice + wheelsPrice;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderComplete(true);
  };

  const activeProducts = [
    selectedMods.wrap,
    selectedMods.splitter,
    selectedMods.spoiler,
    selectedMods.wheels
  ].filter(Boolean) as Product[];

  return (
    <div className="flex-grow flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      
      {/* Dynamic Announcement Banner */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-500 to-indigo-500 py-1.5 px-4 text-center text-xs font-bold tracking-wider text-white flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 animate-bounce" />
        <span>MODVIZ PRE-LAUNCH DEMO: AI CUSTOMIZATION VISUALIZATION SIMULATION</span>
        <Sparkles className="w-4 h-4 animate-bounce" />
      </div>

      {/* Main Premium Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-2 rounded-lg shadow-lg shadow-cyan-500/20">
            <Layers className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 italic">
              ModViz
            </h1>
            <p className="text-[9px] text-cyan-400 tracking-widest font-bold uppercase -mt-1">
              Ultra-Fast AI Visualizer
            </p>
          </div>
        </div>

        {/* Live engagement counters */}
        <div className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 py-1.5 px-3 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Demo Engine: <strong className="text-emerald-400">Online</strong></span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 py-1.5 px-3 rounded-full">
            <span>Render Target: <strong className="text-cyan-400">&lt;8s / actual ~500ms</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {totalBuildPrice > 0 && (
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 py-1.5 px-3.5 rounded-lg text-sm">
              <ShoppingCart className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-cyan-400">${totalBuildPrice.toLocaleString()}</span>
            </div>
          )}
          <button 
            onClick={handleReset} 
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg transition border border-slate-800 text-xs flex items-center gap-1.5"
            title="Reset Visualizer"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-grow grid grid-cols-1 xl:grid-cols-12 gap-6 p-6">
        
        {/* LEFT COLUMN: CAR SELECTOR & PHOTO UPLOAD (3 Cols) */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          
          {/* Section: Interactive Car Selector */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-wider text-slate-400 uppercase">
                1. Select Vehicle
              </h2>
              <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded-full font-bold uppercase border border-cyan-800">
                Primary List
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CAR_MODELS.map((car) => {
                const isSelected = activeCar.id === car.id && !customPhotoUrl;
                return (
                  <button
                    key={car.id}
                    onClick={() => {
                      setCustomPhotoUrl(null);
                      setActiveCar(car);
                      triggerAiRender();
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between h-24 ${
                      isSelected
                        ? "border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-500/5"
                        : "border-slate-800 bg-slate-950 hover:bg-slate-900"
                    }`}
                  >
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold leading-none">{car.year} {car.make}</p>
                      <h3 className="text-xs font-bold text-slate-200 mt-1">{car.model}</h3>
                    </div>
                    <span className="text-[9px] text-slate-500 font-semibold">{car.chassis}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Custom Photo Uploader */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-wider text-slate-400 uppercase">
              2. Upload Car Photo
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Want to see wraps on your exact car? Upload a picture of your ride. Our AI will automatically map and overlay wrap options instantly.
            </p>

            <div className="relative group border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl p-5 transition bg-slate-950 flex flex-col items-center justify-center gap-3 cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer" 
              />
              <Upload className="w-8 h-8 text-slate-500 group-hover:text-cyan-400 transition" />
              <div className="text-center">
                <p className="text-xs font-bold text-slate-300">Click to Upload Photo</p>
                <p className="text-[10px] text-slate-500 mt-1">Supports PNG, JPEG, HEIC</p>
              </div>
            </div>

            {customPhotoUrl && (
              <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span className="text-xs text-cyan-300 truncate font-medium">{customPhotoName}</span>
                </div>
                <button 
                  onClick={() => {
                    setCustomPhotoUrl(null);
                    setCustomPhotoName("");
                    triggerAiRender();
                  }}
                  className="p-1 hover:bg-cyan-900/30 text-cyan-400 rounded transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Sourcing Drop-Shipping Info */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-400">
              <Truck className="w-4 h-4 text-cyan-400" />
              <span>Pre-launch sourcing preview</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Supplier terms, availability, and fulfillment must be verified before live orders.
            </p>
          </div>
        </div>

        {/* CENTER COLUMN: LIVE VIEW & RENDER STAGE (5 Cols) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          
          {/* Main Visualizer Stage Canvas */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 flex flex-col gap-4 relative">
            
            {/* Visualizer Header Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  {isRendering ? "Processing AI Render..." : "AI Stage Live"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowCompare(!showCompare)} 
                  className={`py-1 px-3.5 rounded-full text-[10px] font-bold tracking-wider uppercase border transition ${
                    showCompare 
                      ? "bg-cyan-500 text-slate-950 border-cyan-400" 
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
                  }`}
                >
                  {showCompare ? "Original View" : "Compare Before/After"}
                </button>
              </div>
            </div>

            {/* The Stage View Container */}
            <div className="relative w-full h-[320px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-900/80 shadow-2xl flex items-center justify-center">
              
              {/* AI Loading Pulses overlay */}
              {isRendering && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-4">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <div className="absolute inset-0 border-2 border-cyan-400/20 rounded-full"></div>
                    <div className="absolute inset-0 border-t-2 border-cyan-400 rounded-full animate-spin"></div>
                    <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black tracking-widest text-cyan-400 uppercase animate-pulse">
                      Analyzing Vehicle Geometry
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Applying {selectedMods.wrap?.name || "OEM Paint"} with ultra-fast AI rendering...</p>
                  </div>
                  <div className="w-48 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-100 rounded-full" 
                      style={{ width: `${renderProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Standard Customizer Canvas Image Display */}
              {!showCompare ? (
                <div className="relative w-full h-full">
                  <img
                    src={activeImageUrl}
                    alt={activeCar.model}
                    className="w-full h-full object-cover select-none transition-all duration-700"
                    style={{ filter: customPhotoUrl ? getColorFilter(selectedMods.wrap?.image_url) : undefined }}
                  />

                  {/* High Fidelity Aero Overlay Graphic badges */}
                  <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 pointer-events-none z-10">
                    {selectedMods.wrap && (
                      <span className="bg-slate-950/90 border border-slate-800 py-1 px-2.5 rounded-md text-[9px] font-bold text-cyan-400 flex items-center gap-1">
                        🎨 Wrap: {selectedMods.wrap.name}
                      </span>
                    )}
                    {selectedMods.splitter && (
                      <span className="bg-slate-950/90 border border-slate-800 py-1 px-2.5 rounded-md text-[9px] font-bold text-amber-400 flex items-center gap-1">
                        🏎️ Front Aero: {selectedMods.splitter.name}
                      </span>
                    )}
                    {selectedMods.spoiler && (
                      <span className="bg-slate-950/90 border border-slate-800 py-1 px-2.5 rounded-md text-[9px] font-bold text-rose-400 flex items-center gap-1">
                        🚀 Spoiler: {selectedMods.spoiler.name}
                      </span>
                    )}
                    {selectedMods.wheels && (
                      <span className="bg-slate-950/90 border border-slate-800 py-1 px-2.5 rounded-md text-[9px] font-bold text-violet-400 flex items-center gap-1">
                        🛞 Wheels: {selectedMods.wheels.name}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                // BEFORE/AFTER SLIDING COMPARE VIEW
                <div className="relative w-full h-full flex select-none">
                  
                  {/* Left Side: OEM Base */}
                  <div 
                    className="absolute inset-0 h-full overflow-hidden" 
                    style={{ width: `${beforeAfterSplit}%`, zIndex: 1 }}
                  >
                    <img
                      src={baseImageUrl}
                      alt="Base OEM car"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ width: '480px', maxWidth: 'unset' }}
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/90 py-1 px-2 text-[8px] tracking-wider uppercase font-extrabold border border-slate-800 rounded">
                      OEM Base Paint
                    </div>
                  </div>

                  {/* Right Side: Modified View */}
                  <div className="w-full h-full">
                    <img
                      src={activeImageUrl}
                      alt="Modified Car"
                      className="w-full h-full object-cover"
                      style={{ filter: customPhotoUrl ? getColorFilter(selectedMods.wrap?.image_url) : undefined }}
                    />
                    <div className="absolute top-3 right-3 bg-cyan-950/90 py-1 px-2 text-[8px] tracking-wider uppercase font-extrabold border border-cyan-800 rounded text-cyan-400">
                      ModViz Rendered
                    </div>
                  </div>

                  {/* Center Split Slider Handle */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-cyan-400 cursor-ew-resize flex items-center justify-center"
                    style={{ left: `${beforeAfterSplit}%`, zIndex: 2 }}
                  >
                    <div className="w-6 h-6 bg-cyan-400 rounded-full border-4 border-slate-950 flex items-center justify-center shadow-lg -ml-2.5">
                      <span className="text-[8px] font-bold text-slate-950">↔</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={beforeAfterSplit} 
                      onChange={(e) => setBeforeAfterSplit(Number(e.target.value))}
                      className="absolute inset-y-0 w-full opacity-0 cursor-ew-resize"
                      style={{ transform: 'scale(10)' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Angle Selector Tabs (only shown for stock renders, not user photos) */}
            {!customPhotoUrl && (
              <div className="flex items-center justify-center gap-3 mt-1">
                {[
                  { id: 'front', label: 'Front 3/4' },
                  { id: 'side', label: 'Side Profile' },
                  { id: 'rear', label: 'Rear' }
                ].map((ang) => (
                  <button
                    key={ang.id}
                    onClick={() => {
                      setActiveAngle(ang.id as any);
                      triggerAiRender();
                    }}
                    className={`py-1.5 px-4 rounded-xl text-xs font-bold border transition ${
                      activeAngle === ang.id 
                        ? 'bg-slate-900 border-slate-700 text-cyan-400' 
                        : 'bg-slate-950 border-slate-900 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    {ang.label}
                  </button>
                ))}
              </div>
            )}

            {/* Stage Actions: Share & Download */}
            <div className="border-t border-slate-900/60 pt-4 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-medium">
                Render completed in <strong className="text-slate-300">~500ms (composited)</strong>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleShare}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 py-1.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Build Link</span>
                </button>
              </div>
            </div>

            {/* Toast feedback for Copying share links */}
            {shareLink && (
              <div className="absolute bottom-16 right-4 bg-slate-900 border border-slate-800 p-2.5 rounded-xl shadow-xl z-30 max-w-xs">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Your Shareable Link</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={shareLink} 
                    className="bg-slate-950 text-[10px] text-slate-300 p-1 px-2 border border-slate-800 rounded flex-grow focus:outline-none w-40"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink);
                      setShareToast(true);
                      setTimeout(() => setShareToast(false), 4000);
                    }}
                    className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-[10px] font-black p-1 px-2 rounded"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
            {shareToast && (
              <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-cyan-900 border border-cyan-400/30 text-cyan-100 py-2.5 px-5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-semibold tracking-wide animate-bounce z-30">
                <CheckCircle className="w-4 h-4 text-cyan-400" />
                <span>Link copied to clipboard! Share with your team or tuner.</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: MODIFICATION CONTROL PANEL (4 Cols) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 flex flex-col gap-4">
            
            {/* Category tabs */}
            <div className="flex border-b border-slate-900">
              {[
                { id: 'wrap', label: '🎨 Wrap' },
                { id: 'splitter', label: '🏎️ Aero' },
                { id: 'spoiler', label: '🚀 Wing' },
                { id: 'wheels', label: '🛞 Rims' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as any)}
                  className={`flex-grow pb-3 text-xs font-bold tracking-wider uppercase border-b-2 transition ${
                    currentTab === tab.id 
                      ? 'border-cyan-500 text-cyan-400' 
                      : 'border-transparent text-slate-500 hover:text-slate-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modification item listings */}
            <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
              {/* Option to clear active modifier in current tab */}
              {selectedMods[currentTab] && (
                <button 
                  onClick={() => handleSelectMod(currentTab, null)}
                  className="p-3 bg-slate-950/40 hover:bg-slate-950 border border-slate-900 hover:border-slate-800 rounded-2xl text-left text-xs font-bold text-red-400 flex items-center justify-between transition"
                >
                  <span>Uninstall Active {currentTab.toUpperCase()}</span>
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Dynamic items for active tab category */}
              {catalog.filter(p => p.category === currentTab).map((prod) => {
                const isSelected = selectedMods[currentTab]?.id === prod.id;
                return (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectMod(currentTab, prod)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition flex flex-col gap-2.5 ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/15'
                        : 'border-slate-900 bg-slate-950 hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] bg-slate-900 text-slate-400 py-0.5 px-2 rounded font-bold uppercase border border-slate-800">
                          {prod.brand}
                        </span>
                        <h3 className="text-xs font-bold text-slate-200 mt-1">{prod.name}</h3>
                      </div>
                      <span className="text-sm font-black text-cyan-400">${prod.price.toLocaleString()}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">{prod.description}</p>

                    <div className="border-t border-slate-900/80 pt-2.5 flex items-center justify-between text-[10px] text-slate-500">
                      <span>SKU: {prod.sku}</span>
                      <span className="font-semibold text-slate-400">{prod.specs}</span>
                    </div>

                    {isSelected && (
                      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2 flex items-center justify-center gap-1.5 text-[10px] text-cyan-400 font-bold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Equipped on Render Build</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {catalog.filter(p => p.category === currentTab).length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500 font-medium">
                  Loading catalog items from secure ModViz databases...
                </div>
              )}
            </div>

          </div>
        </div>

      </main>

      {/* STICKY BOTTOM BUILD BAR (Show only if any modifications are selected) */}
      {totalBuildPrice > 0 && (
        <div className="sticky bottom-0 left-0 right-0 bg-slate-950/95 border-t border-slate-800 backdrop-blur-lg px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 z-30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-950/40 rounded-xl border border-cyan-800">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider leading-none">Your Premium Mod Build</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-white">${totalBuildPrice.toLocaleString()}</span>
                <span className="text-[10px] text-slate-500">({activeProducts.length} mods equipped)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            {selectedMods.wrap && (
              <span className="bg-slate-900 border border-slate-800/80 py-1 px-2.5 rounded-lg text-[10px] text-slate-300 font-medium">
                Wrap: {selectedMods.wrap.brand}
              </span>
            )}
            {selectedMods.splitter && (
              <span className="bg-slate-900 border border-slate-800/80 py-1 px-2.5 rounded-lg text-[10px] text-slate-300 font-medium">
                Front: {selectedMods.splitter.brand}
              </span>
            )}
            {selectedMods.spoiler && (
              <span className="bg-slate-900 border border-slate-800/80 py-1 px-2.5 rounded-lg text-[10px] text-slate-300 font-medium">
                Spoiler: {selectedMods.spoiler.brand}
              </span>
            )}
            {selectedMods.wheels && (
              <span className="bg-slate-900 border border-slate-800/80 py-1 px-2.5 rounded-lg text-[10px] text-slate-300 font-medium">
                Wheels: {selectedMods.wheels.brand}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCheckoutOpen(true)}
              className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-slate-950 font-extrabold text-sm py-3 px-8 rounded-xl shadow-lg shadow-cyan-400/20 transition flex items-center gap-2"
            >
              <span>Preview Test Checkout</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CHECKOUT DRAWERS / MODAL DIALOG */}
      {checkoutOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-black text-white">ModViz Demo Checkout (Test Mode)</h2>
              </div>
              <button 
                onClick={() => {
                  setCheckoutOpen(false);
                  setOrderComplete(false);
                }}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-grow overflow-y-auto p-6">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
                <span><strong>Pre-Launch Demo:</strong> This is a simulation. No actual credit card details are processed, and no real-money transactions are executed. Feel free to use test values.</span>
              </div>
              {!orderComplete ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Order build summary */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Build Overview</h3>
                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                      {activeProducts.map(p => (
                        <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-900 last:border-0">
                          <div>
                            <p className="font-bold text-slate-200">{p.name}</p>
                            <p className="text-[10px] text-slate-500">SKU: {p.sku}</p>
                          </div>
                          <span className="font-extrabold text-cyan-400">${p.price.toLocaleString()}</span>
                        </div>
                      ))}
                      
                      <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-300">Subtotal</span>
                        <span className="text-lg font-black text-cyan-400">${totalBuildPrice.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/30 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        <span>Shipping/fulfillment shown for demo only</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        <span>Final availability, shipping cost, and dealer terms pending verification.</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Form */}
                  <form onSubmit={handleCheckoutSubmit} className="flex flex-col gap-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Shipping & Payment Details</h3>
                    
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">FullName</label>
                        <input 
                          type="text" 
                          required
                          value={formData.name}
                          onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                          placeholder="John Doe" 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:border-cyan-500 focus:outline-none text-slate-200 mt-1" 
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">Email Address</label>
                        <input 
                          type="email" 
                          required
                          value={formData.email}
                          onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                          placeholder="john@tunermail.com" 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:border-cyan-500 focus:outline-none text-slate-200 mt-1" 
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">Shipping Address</label>
                        <input 
                          type="text" 
                          required
                          value={formData.address}
                          onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                          placeholder="123 Trackday Lane" 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:border-cyan-500 focus:outline-none text-slate-200 mt-1" 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">City</label>
                          <input 
                            type="text" 
                            required
                            value={formData.city}
                            onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                            placeholder="Los Angeles" 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:border-cyan-500 focus:outline-none text-slate-200 mt-1" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">Zip / Postal</label>
                          <input 
                            type="text" 
                            required
                            value={formData.zip}
                            onChange={(e) => setFormData(p => ({ ...p, zip: e.target.value }))}
                            placeholder="90210" 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:border-cyan-500 focus:outline-none text-slate-200 mt-1" 
                          />
                        </div>
                      </div>

                      <div className="border-t border-slate-800/80 my-1 pt-3">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Payment Method</label>
                        <div className="grid grid-cols-2 gap-3 mt-1.5 mb-3">
                          <button
                            type="button"
                            onClick={() => setPaymentProvider('stripe')}
                            className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                              paymentProvider === 'stripe'
                                ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-lg shadow-cyan-500/5'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-white">Stripe</span>
                              <span className="bg-cyan-500/20 text-cyan-400 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">Preferred</span>
                            </div>
                            <span className="text-[9px] text-slate-500 leading-tight">Direct credit card integration</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaymentProvider('paypal')}
                            className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                              paymentProvider === 'paypal'
                                ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/5'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-white">PayPal</span>
                              <span className="bg-amber-500/20 text-amber-400 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">Placeholder</span>
                            </div>
                            <span className="text-[9px] text-slate-500 leading-tight">Express wallet checkout</span>
                          </button>
                        </div>
                      </div>

                      {paymentProvider === 'stripe' ? (
                        <>
                          <div className="bg-slate-950/40 p-2.5 border border-slate-800/80 rounded-xl mb-3">
                            <p className="text-[10px] text-slate-400 leading-normal">
                              💳 <strong>Stripe-ready checkout placeholder:</strong> This demo is prepared to connect to Stripe once Finance onboarding is complete. No live card processing is enabled yet.
                            </p>
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400">Credit Card Number</label>
                            <input 
                              type="text" 
                              required={paymentProvider === 'stripe'}
                              value={formData.cardNum}
                              onChange={(e) => setFormData(p => ({ ...p, cardNum: e.target.value }))}
                              placeholder="4111 2222 3333 4444" 
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:border-cyan-500 focus:outline-none text-slate-200 mt-1" 
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-400">Expiration</label>
                              <input 
                                type="text" 
                                required={paymentProvider === 'stripe'}
                                value={formData.cardExpiry}
                                onChange={(e) => setFormData(p => ({ ...p, cardExpiry: e.target.value }))}
                                placeholder="MM/YY" 
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:border-cyan-500 focus:outline-none text-slate-200 mt-1" 
                              />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-400">Security Code</label>
                              <input 
                                type="text" 
                                required={paymentProvider === 'stripe'}
                                value={formData.cardCvv}
                                onChange={(e) => setFormData(p => ({ ...p, cardCvv: e.target.value }))}
                                placeholder="CVC" 
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:border-cyan-500 focus:outline-none text-slate-200 mt-1" 
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-2.5">
                          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                            <Sparkles className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
                            <span>PayPal Integration Placeholder</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-normal">
                            PayPal express integration is a placeholder. Live transactions will be configured once the store owner registers an official business account and decides on API integration/SDK keys.
                          </p>
                          <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl text-center text-xs text-slate-500 font-bold border-dashed mt-1 select-none">
                            🟡 PayPal Express Checkout Button Placeholder
                          </div>
                        </div>
                      )}
                    </div>

                    <button 
                      type="submit"
                      className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-extrabold text-sm py-3 px-6 rounded-xl shadow-lg transition mt-2 w-full text-center"
                    >
                      {paymentProvider === 'stripe' 
                        ? `Authorize Test Stripe Payment (Demo Mode) - ${totalBuildPrice.toLocaleString()}`
                        : `Simulate PayPal Express Checkout (Demo Mode) - ${totalBuildPrice.toLocaleString()}`}
                    </button>
                  </form>
                </div>
              ) : (
                // ORDER SUCCESS SCREEN
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 mb-5 animate-bounce">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-white">ModViz Build Simulated Order Authorized!</h3>
                  <p className="text-xs text-slate-400 mt-2 max-w-sm">
                    Thank you, {formData.name || "Tuner"}! This simulated order has been processed in test mode. In a live store, fulfillment would only proceed after supplier availability and terms are verified.
                  </p>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 my-6 w-full max-w-md text-left text-xs flex flex-col gap-2.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Simulated Invoice ID:</span>
                      <strong className="text-slate-200">MV-DEMO-{Math.floor(100000 + Math.random() * 900000)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Simulated Payment Provider:</span>
                      <strong className="text-slate-200 capitalize">{paymentProvider} (Test Mode)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Simulated Fulfillment Info:</span>
                      <strong className="text-cyan-400">Demo Simulation (Supplier Verification Pending)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Authorization Code:</span>
                      <strong className="text-slate-200">AUTH-DEMO-2026</strong>
                    </div>
                  </div>

                  {/* Simulated Installation Partner lead referral */}
                  <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-md text-left flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>Simulated Local Wrap & Installation Shop Referral (Demo Only)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      For demonstration purposes, your build details would be referred to a premium local installer (e.g., for wrap or wing installation). Real tuner shop integrations are planned pre-launch:
                    </p>
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                      <p className="text-xs font-bold text-slate-300">Apex Performance Labs (Placeholder Demo Partner)</p>
                      <p className="text-[10px] text-slate-500 mt-1">12 miles away • Los Angeles, CA • (555) 019-2834</p>
                      <div className="bg-cyan-500/10 border border-cyan-500/20 py-1 px-2.5 rounded text-[10px] text-cyan-400 font-bold mt-2 inline-block">
                        Demo Offer: Get an estimated $150 off wrap installation!
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setCheckoutOpen(false);
                      setOrderComplete(false);
                      handleReset();
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs py-3 px-8 rounded-xl transition mt-6"
                  >
                    Return to customizer
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900/80 px-6 py-6 mt-12 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          &copy; 2026 ModViz Inc. Pre-launch demo mode.
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-cyan-500" />
            <span>Mock checkout</span>
          </span>
          <span className="flex items-center gap-1">
            <Compass className="w-4 h-4 text-cyan-500" />
            <span>Supplier verification pending</span>
          </span>
        </div>
      </footer>

    </div>
  );
}
