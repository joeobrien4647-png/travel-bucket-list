import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import * as d3 from "d3";
import { Plus, MapPin, Calendar, PoundSterling, Plane, Star, Edit2, Trash2, X, ChevronDown, ChevronUp, Globe, Heart, Filter, ArrowUpDown, Clock, ChevronLeft, ChevronRight, AlertTriangle, RotateCcw, Search, BarChart3, Sparkles, Undo2, Download, Shuffle, Link2, Wallet, Columns, Printer, Moon, Sun, Layout, Check } from "lucide-react";

const COLORS = {
  bg: "#FAF7F2",
  card: "#FFFFFF",
  navy: "#1B2838",
  gold: "#C8A951",
  goldLight: "#F5EFD8",
  warmGrey: "#8B7E74",
  sand: "#E8DFD0",
  cream: "#FFF9F0",
  text: "#2D2A26",
  textMuted: "#8B8178",
  dream: "#7C9EB2",
  planning: "#D4A843",
  booked: "#6B9B76",
  done: "#9B8BB4",
  border: "#E8E2D8",
};

const STATUS_CONFIG = {
  Dream: { color: COLORS.dream, emoji: "✨", label: "Dream" },
  Planning: { color: COLORS.planning, emoji: "📋", label: "Planning" },
  Booked: { color: COLORS.booked, emoji: "✈️", label: "Booked" },
  Done: { color: COLORS.done, emoji: "✅", label: "Done" },
};

const BEST_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CATEGORIES = ["Adventure", "Beach & Relaxation", "City Break", "Cultural", "Food & Wine", "Honeymoon", "Road Trip", "Safari & Wildlife", "Ski & Snow", "Wellness"];

const CATEGORY_GRADIENTS = {
  "Adventure": "linear-gradient(135deg, #1a5276, #2e86c1)",
  "Beach & Relaxation": "linear-gradient(135deg, #0e6655, #48c9b0)",
  "City Break": "linear-gradient(135deg, #6c3483, #af7ac5)",
  "Cultural": "linear-gradient(135deg, #b9770e, #f4d03f)",
  "Food & Wine": "linear-gradient(135deg, #922b21, #e74c3c)",
  "Honeymoon": "linear-gradient(135deg, #cb4335, #f1948a)",
  "Road Trip": "linear-gradient(135deg, #1b4f72, #5dade2)",
  "Safari & Wildlife": "linear-gradient(135deg, #784212, #dc7633)",
  "Ski & Snow": "linear-gradient(135deg, #2e4053, #85929e)",
  "Wellness": "linear-gradient(135deg, #196f3d, #82e0aa)",
};

const getTripImage = (trip) => {
  const seed = (trip.destination || trip.name).toLowerCase().replace(/[^a-z0-9]/g, "-");
  return `https://picsum.photos/seed/${seed}/800/500`;
};

function useAnimatedNumber(target, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = null;
    const ease = t => 1 - Math.pow(1 - t, 3);
    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.round(target * ease(progress)));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return value;
}

const DARK_COLORS = {
  bg: "#0D1117", card: "#161B22", navy: "#E6EDF3", gold: "#D4A843", goldLight: "#2D2A1F",
  warmGrey: "#8B949E", sand: "#21262D", cream: "#1C2128", text: "#E6EDF3", textMuted: "#8B949E",
  dream: "#7C9EB2", planning: "#D4A843", booked: "#6B9B76", done: "#9B8BB4", border: "#30363D",
};

const ThemeContext = createContext(COLORS);
function useTheme() { return useContext(ThemeContext); }

const STATUS_ORDER = ["Dream", "Planning", "Booked", "Done"];
const LONDON = { lat: 51.51, lng: -0.13 };

const CONTINENT_ORDER = ["Europe", "Asia", "Americas", "Africa", "Oceania", "Antarctica"];
const CONTINENT_EMOJI = { Europe: "\u{1F1EA}\u{1F1FA}", Asia: "\u{1F30F}", Americas: "\u{1F30E}", Africa: "\u{1F30D}", Oceania: "\u{1F3DD}\u{FE0F}", Antarctica: "\u{1F9CA}" };

function getContinent(trip) {
  const d = (trip.destination || trip.name || "").toLowerCase();
  if (/antarctica/.test(d)) return "Antarctica";
  if (/new zealand|australia|fiji|samoa/.test(d)) return "Oceania";
  if (/italy|france|spain|portugal|croatia|norway|denmark|sweden|iceland|switzerland|greece|hungary|austria|turkey|scotland|\buk\b|ireland|faroe|germany|netherlands|belgium|czech|poland|finland/.test(d)) return "Europe";
  if (/japan|vietnam|maldives|sri lanka|indonesia|bali|south korea|thailand|cambodia|india|borneo|china|nepal|oman|jordan|philippines|malaysia|singapore/.test(d)) return "Asia";
  if (/morocco|south africa|tanzania|rwanda|namibia|kenya|egypt|ethiopia|madagascar|botswana/.test(d)) return "Africa";
  if (/usa|canada|argentin|peru|costa rica|antigua|colombia|mexico|ecuador|brazil|chile|cuba|panama/.test(d)) return "Americas";
  if (/lapland/.test(d)) return "Europe";
  const { lat, lng } = trip;
  if (!lat && !lng) return "Europe";
  if (lat < -60) return "Antarctica";
  if (lng > 100 && lat < 0) return "Oceania";
  if (lat > 35 && lng > -25 && lng < 45) return "Europe";
  if (lng < -25) return "Americas";
  if (lng > 25 && lat > 0) return "Asia";
  return "Africa";
}

const DEFAULT_CHECKLIST_ITEMS = ["Flights", "Accommodation", "Transport", "Activities", "Visa & Docs", "Packing"];

function getTripChecklist(trip) {
  return trip.checklist || DEFAULT_CHECKLIST_ITEMS.map(item => ({ item, done: false }));
}

function getFlightHours(trip) {
  if (!trip.lat || !trip.lng) return null;
  const R = 6371;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(trip.lat - LONDON.lat);
  const dLng = toRad(trip.lng - LONDON.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(LONDON.lat)) * Math.cos(toRad(trip.lat)) * Math.sin(dLng / 2) ** 2;
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  if (dist < 200) return null;
  return Math.round(dist / 800 * 2) / 2;
}

const ACHIEVEMENTS = [
  { id: "first_planning", label: "Getting Started", desc: "First trip moved to Planning", icon: "\u{1F4CB}", check: (trips) => trips.some(t => t.status === "Planning") },
  { id: "first_booked", label: "First Booking!", desc: "Booked your first trip", icon: "\u2708\uFE0F", check: (trips) => trips.some(t => t.status === "Booked") },
  { id: "first_done", label: "Memory Made", desc: "Completed your first trip", icon: "\u2705", check: (trips) => trips.some(t => t.status === "Done") },
  { id: "five_planned", label: "Master Planner", desc: "5 trips with planned dates", icon: "\u{1F4C5}", check: (trips) => trips.filter(t => t.plannedYear).length >= 5 },
  { id: "ten_destinations", label: "Globe Trotter", desc: "10+ destinations on the list", icon: "\u{1F30D}", check: (trips) => new Set(trips.map(t => t.destination)).size >= 10 },
  { id: "hundred_nights", label: "Century Club", desc: "100+ total nights planned", icon: "\u{1F319}", check: (trips) => trips.reduce((s, t) => s + (t.nights || 0), 0) >= 100 },
  { id: "big_budget", label: "Big Dreams", desc: "\u00A350,000+ total budget", icon: "\u{1F4B0}", check: (trips) => trips.reduce((s, t) => s + (t.costEstimate || 0), 0) >= 50000 },
  { id: "half_booked", label: "Halfway There", desc: "50% of trips booked or done", icon: "\u{1F3AF}", check: (trips) => trips.filter(t => t.status === "Booked" || t.status === "Done").length >= trips.length / 2 },
  { id: "all_categories", label: "Renaissance Travellers", desc: "Trips in every category", icon: "\u{1F3C5}", check: (trips) => new Set(trips.map(t => t.category)).size >= 8 },
  { id: "five_continents", label: "Continental", desc: "Trips planned across 5+ continents", icon: "\u{1F3C6}", check: (trips) => new Set(trips.map(t => getContinent(t))).size >= 5 },
];

const DEFAULT_TRIPS = [
  { id: 1, name: "Tuscany Wedding Recce", destination: "Tuscany, Italy", lat: 43.35, lng: 11.35, status: "Planning", category: "Food & Wine", costEstimate: 1200, currency: "£", bestMonths: [3,4,9,10], nights: 4, notes: "Scout La Conca area, try local vineyards for wedding wine", priority: 5, people: "Joe & Sophie" },
  { id: 2, name: "Iceland Ring Road", destination: "Iceland", lat: 64.96, lng: -19.02, status: "Dream", category: "Adventure", costEstimate: 4500, currency: "£", bestMonths: [5,6,7,8], nights: 10, notes: "Northern lights best Sep-Mar, but midnight sun in summer. Full ring road needs 10+ days.", priority: 4, people: "Joe & Sophie" },
  { id: 3, name: "Japanese Alps & Tokyo", destination: "Japan", lat: 36.20, lng: 137.25, status: "Dream", category: "Cultural", costEstimate: 6000, currency: "£", bestMonths: [2,3,4,10,11], nights: 14, notes: "Cherry blossom late March/early April. Mix Tokyo, Kyoto, Takayama, Hakone.", priority: 5, people: "Joe & Sophie" },
  { id: 4, name: "Amalfi Coast Long Weekend", destination: "Amalfi, Italy", lat: 40.63, lng: 14.60, status: "Dream", category: "Beach & Relaxation", costEstimate: 2000, currency: "£", bestMonths: [4,5,6,9,10], nights: 4, notes: "Positano, Ravello, lemon groves. Good combo with Tuscany trip.", priority: 3, people: "Joe & Sophie" },
  { id: 5, name: "Patagonia Trek", destination: "Patagonia, Argentina", lat: -50.94, lng: -73.10, status: "Dream", category: "Adventure", costEstimate: 5500, currency: "£", bestMonths: [10,11,12,1,2,3], nights: 12, notes: "Torres del Paine W Trek. Southern hemisphere summer = Nov-Mar.", priority: 3, people: "Joe & Sophie" },
  { id: 6, name: "Dolomites Hut-to-Hut Trek", destination: "Dolomites, Italy", lat: 46.41, lng: 11.84, status: "Dream", category: "Adventure", costEstimate: 2500, currency: "£", bestMonths: [6,7,8,9], nights: 7, notes: "Multi-day rifugio trek. Alta Via 1 or 2. Incredible food at each mountain hut. Pairs well with a Tuscany trip.", priority: 4, people: "Joe & Sophie" },
  { id: 7, name: "Vietnam North to South", destination: "Vietnam", lat: 16.05, lng: 108.22, status: "Dream", category: "Cultural", costEstimate: 3000, currency: "£", bestMonths: [10,11,12], nights: 14, notes: "Hanoi → Ha Long Bay → Hoi An → Ho Chi Minh. Street food capital of the world. Incredibly cheap once there.", priority: 4, people: "Joe & Sophie" },
  { id: 8, name: "New Zealand South Island Road Trip", destination: "New Zealand", lat: -44.50, lng: 168.70, status: "Dream", category: "Road Trip", costEstimate: 6500, currency: "£", bestMonths: [11,12,1,2,3], nights: 16, notes: "Milford Track (bucket list walk), Queenstown, Wanaka, Fox Glacier, Abel Tasman. Campervan recommended.", priority: 4, people: "Joe & Sophie" },
  { id: 9, name: "Douro Valley & Lisbon", destination: "Portugal", lat: 41.16, lng: -7.79, status: "Dream", category: "Food & Wine", costEstimate: 1200, currency: "£", bestMonths: [4,5,6,9,10], nights: 5, notes: "Port wine region + Lisbon city break. Easy long weekend from London. Pastéis de nata pilgrimage.", priority: 3, people: "Joe & Sophie" },
  { id: 10, name: "Croatian Coast by Boat", destination: "Croatia", lat: 43.51, lng: 16.44, status: "Dream", category: "Beach & Relaxation", costEstimate: 2000, currency: "£", bestMonths: [5,6,9], nights: 7, notes: "Dubrovnik → Hvar → Split sailing route. Avoid July/August crowds. Stunning islands, affordable seafood.", priority: 3, people: "Joe & Sophie" },
  { id: 11, name: "Morocco: Atlas Mountains & Marrakech", destination: "Morocco", lat: 31.63, lng: -8.00, status: "Dream", category: "Adventure", costEstimate: 1500, currency: "£", bestMonths: [3,4,5,10,11], nights: 6, notes: "Toubkal trek or Berber village walks + Marrakech souks. Short flight from London, incredible value.", priority: 3, people: "Joe & Sophie" },
  { id: 12, name: "Maldives", destination: "Maldives", lat: 3.20, lng: 73.22, status: "Dream", category: "Beach & Relaxation", costEstimate: 5000, currency: "£", bestMonths: [1,2,3,4], nights: 8, notes: "Overwater villa, snorkelling, total switch-off. Dry season Jan-Apr. Book well in advance for best rates.", priority: 3, people: "Joe & Sophie" },
  { id: 13, name: "Sri Lanka", destination: "Sri Lanka", lat: 7.87, lng: 80.77, status: "Dream", category: "Cultural", costEstimate: 3500, currency: "£", bestMonths: [12,1,2,3], nights: 12, notes: "Incredible variety: temples, tea country, safari, beaches. Sigiriya, Ella train, Yala NP, south coast. Much better value than Maldives.", priority: 4, people: "Joe & Sophie" },
  { id: 14, name: "Norwegian Fjords", destination: "Norway", lat: 61.40, lng: 6.75, status: "Dream", category: "Adventure", costEstimate: 3000, currency: "£", bestMonths: [6,7,8], nights: 7, notes: "Geirangerfjord, Trolltunga hike, kayaking. Summer for midnight sun hiking, winter for northern lights.", priority: 3, people: "Joe & Sophie" },
  { id: 15, name: "South Africa: Cape & Safari", destination: "South Africa", lat: -33.92, lng: 18.42, status: "Dream", category: "Safari & Wildlife", costEstimate: 5500, currency: "£", bestMonths: [10,11,12,1,2,3], nights: 12, notes: "Cape Town wine region (Stellenbosch/Franschhoek) + Garden Route + Kruger/private game reserve. Big Five + world-class food.", priority: 4, people: "Joe & Sophie" },
  // City Breaks
  { id: 16, name: "New York City", destination: "New York, USA", lat: 40.71, lng: -74.01, status: "Dream", category: "City Break", costEstimate: 3000, currency: "£", bestMonths: [4,5,9,10], nights: 5, notes: "Brooklyn food scene, Central Park, High Line, Broadway. Autumn is magical — crisp air, fall colours. Spring equally good.", priority: 4, people: "Joe & Sophie" },
  { id: 17, name: "Copenhagen & Malmö", destination: "Denmark / Sweden", lat: 55.68, lng: 12.57, status: "Dream", category: "City Break", costEstimate: 1800, currency: "£", bestMonths: [5,6,7,8,9], nights: 4, notes: "Noma-adjacent food scene, Tivoli, design culture. Train across the Øresund Bridge to Malmö for a two-country trip. Hygge central.", priority: 3, people: "Joe & Sophie" },
  { id: 18, name: "Buenos Aires", destination: "Argentina", lat: -34.60, lng: -58.38, status: "Dream", category: "City Break", costEstimate: 2500, currency: "£", bestMonths: [3,4,5,10,11], nights: 6, notes: "Steak, Malbec, tango, incredible architecture. Combine with Patagonia for a mega trip. Very affordable on the ground.", priority: 3, people: "Joe & Sophie" },
  { id: 19, name: "Istanbul", destination: "Turkey", lat: 41.01, lng: 28.98, status: "Dream", category: "City Break", costEstimate: 1200, currency: "£", bestMonths: [4,5,9,10], nights: 4, notes: "Hagia Sophia, Grand Bazaar, Bosphorus ferry, kebab culture. Straddling two continents. Amazing value for money.", priority: 4, people: "Joe & Sophie" },
  // Ski & Snow
  { id: 20, name: "Chamonix Ski & Snowboard", destination: "Chamonix, France", lat: 45.92, lng: 6.87, status: "Dream", category: "Ski & Snow", costEstimate: 2200, currency: "£", bestMonths: [1,2,3], nights: 5, notes: "Mont Blanc views, Vallée Blanche descent, great après-ski. Advanced terrain. Easyjet from Gatwick.", priority: 3, people: "Joe & Sophie" },
  { id: 21, name: "Niseko Powder Trip", destination: "Hokkaido, Japan", lat: 42.86, lng: 140.70, status: "Dream", category: "Ski & Snow", costEstimate: 5000, currency: "£", bestMonths: [1,2], nights: 8, notes: "Best powder snow on earth. Combine with Tokyo for a few days either side. Japanese onsen after skiing = perfection. Could pair with the wider Japan trip.", priority: 3, people: "Joe & Sophie" },
  { id: 22, name: "Lofoten Islands Winter", destination: "Lofoten, Norway", lat: 68.15, lng: 14.40, status: "Dream", category: "Ski & Snow", costEstimate: 2800, currency: "£", bestMonths: [1,2,3], nights: 6, notes: "Northern lights + ski touring + Arctic surfing + fishing villages. Unlike any ski trip you'll ever do. Remote and stunning.", priority: 4, people: "Joe & Sophie" },
  // Wellness
  { id: 23, name: "Bali: Ubud & Coast", destination: "Bali, Indonesia", lat: -8.51, lng: 115.26, status: "Dream", category: "Wellness", costEstimate: 3000, currency: "£", bestMonths: [4,5,6,7,8,9,10], nights: 10, notes: "Ubud rice terraces + yoga retreats + Seminyak/Canggu coast. Incredible spa culture, affordable luxury. Monkey Forest.", priority: 3, people: "Joe & Sophie" },
  { id: 24, name: "Swiss Alps Wellness Retreat", destination: "Switzerland", lat: 46.59, lng: 7.91, status: "Dream", category: "Wellness", costEstimate: 3500, currency: "£", bestMonths: [6,7,8,9], nights: 5, notes: "Mountain spa hotels in Grindelwald or Lauterbrunnen. Hiking by day, thermal baths by evening. Clean air reset. Expensive but worth it.", priority: 2, people: "Joe & Sophie" },
  // Road Trips
  { id: 25, name: "Scottish Highlands NC500", destination: "Scotland, UK", lat: 57.59, lng: -5.05, status: "Dream", category: "Road Trip", costEstimate: 1500, currency: "£", bestMonths: [5,6,7,8,9], nights: 7, notes: "North Coast 500 route. Wild beaches, whisky distilleries, castles, dolphins. No flights needed — drive up from London or train to Inverness.", priority: 4, people: "Joe & Sophie" },
  { id: 26, name: "Route 66 USA", destination: "USA", lat: 35.22, lng: -101.83, status: "Dream", category: "Road Trip", costEstimate: 5000, currency: "£", bestMonths: [4,5,9,10], nights: 14, notes: "Chicago to LA. Classic American road trip — diners, desert, motels, Grand Canyon detour. Once in a lifetime.", priority: 2, people: "Joe & Sophie" },
  { id: 27, name: "Wild Atlantic Way, Ireland", destination: "Ireland", lat: 52.97, lng: -9.43, status: "Dream", category: "Road Trip", costEstimate: 1200, currency: "£", bestMonths: [5,6,7,8,9], nights: 6, notes: "2,500km coastal route. Cliffs of Moher, Dingle Peninsula, seafood pubs, Galway. Easy and affordable from London.", priority: 3, people: "Joe & Sophie" },
  // Food & Wine
  { id: 28, name: "San Sebastián & Rioja", destination: "Basque Country, Spain", lat: 43.32, lng: -1.98, status: "Dream", category: "Food & Wine", costEstimate: 1800, currency: "£", bestMonths: [5,6,9,10], nights: 5, notes: "Highest concentration of Michelin stars per capita. Pintxos crawl in old town + Rioja wine region day trip. Absolute food mecca.", priority: 5, people: "Joe & Sophie" },
  { id: 29, name: "Bordeaux Wine Trail", destination: "Bordeaux, France", lat: 44.84, lng: -0.58, status: "Dream", category: "Food & Wine", costEstimate: 1500, currency: "£", bestMonths: [5,6,9,10], nights: 4, notes: "Saint-Émilion, Médoc, Pauillac. Eurostar + TGV from London. La Cité du Vin museum. Cycle between châteaux.", priority: 3, people: "Joe & Sophie" },
  // Safari & Wildlife
  { id: 30, name: "Tanzania: Serengeti & Zanzibar", destination: "Tanzania", lat: -2.33, lng: 34.83, status: "Dream", category: "Safari & Wildlife", costEstimate: 6500, currency: "£", bestMonths: [1,2,6,7,8,9,10], nights: 12, notes: "Great Migration (Jun-Oct Serengeti, Jan-Feb calving season). Add Zanzibar beach for 3-4 days at the end. Top-tier safari.", priority: 3, people: "Joe & Sophie" },
  { id: 31, name: "Galápagos Islands", destination: "Ecuador", lat: -0.95, lng: -90.97, status: "Dream", category: "Safari & Wildlife", costEstimate: 7000, currency: "£", bestMonths: [1,2,3,4,5,6], nights: 10, notes: "Truly once-in-a-lifetime wildlife. Giant tortoises, blue-footed boobies, marine iguanas, snorkelling with sea lions. Small ship cruise or island-hopping.", priority: 3, people: "Joe & Sophie" },
  // Adventure
  { id: 32, name: "Everest Base Camp Trek", destination: "Nepal", lat: 27.99, lng: 86.85, status: "Dream", category: "Adventure", costEstimate: 3000, currency: "£", bestMonths: [3,4,5,10,11], nights: 16, notes: "The classic high-altitude trek. 14 days trail + Kathmandu either side. Teahouse lodges the whole way. Your ultra fitness would make this very doable.", priority: 4, people: "Joe" },
  { id: 33, name: "Jordan: Petra & Wadi Rum", destination: "Jordan", lat: 30.33, lng: 35.44, status: "Dream", category: "Adventure", costEstimate: 1800, currency: "£", bestMonths: [3,4,5,10,11], nights: 6, notes: "Petra (full day minimum), Wadi Rum desert camp under the stars, Dead Sea float. Short flight, huge impact.", priority: 5, people: "Joe & Sophie" },
  // Cultural
  { id: 34, name: "Peru: Machu Picchu & Sacred Valley", destination: "Peru", lat: -13.16, lng: -72.55, status: "Dream", category: "Cultural", costEstimate: 4000, currency: "£", bestMonths: [4,5,6,7,8,9,10], nights: 10, notes: "Inca Trail or Salkantay Trek to Machu Picchu. Lima food scene is world-class. Cusco altitude acclimatisation needed.", priority: 4, people: "Joe & Sophie" },
  { id: 35, name: "Rajasthan, India", destination: "India", lat: 26.92, lng: 75.79, status: "Dream", category: "Cultural", costEstimate: 2500, currency: "£", bestMonths: [10,11,12,1,2,3], nights: 12, notes: "Jaipur, Udaipur, Jodhpur, Jaisalmer. Palace hotels, incredible food, Thar Desert camel trek. Sensory overload in the best way.", priority: 3, people: "Joe & Sophie" },
  // Caribbean & Central America
  { id: 36, name: "Costa Rica", destination: "Costa Rica", lat: 10.42, lng: -84.00, status: "Dream", category: "Adventure", costEstimate: 3500, currency: "£", bestMonths: [12,1,2,3,4], nights: 10, notes: "Arenal volcano, Monteverde cloud forest, Manuel Antonio beaches, zip-lining, sloths. Pura vida lifestyle. Great mix of adventure and chill.", priority: 3, people: "Joe & Sophie" },
  { id: 37, name: "Antigua & Barbuda", destination: "Antigua", lat: 17.12, lng: -61.85, status: "Dream", category: "Beach & Relaxation", costEstimate: 3500, currency: "£", bestMonths: [12,1,2,3,4], nights: 7, notes: "365 beaches — one for every day. Direct BA flights from Gatwick. Shirley Heights Sunday party, Nelson's Dockyard. Caribbean without the long-haul.", priority: 2, people: "Joe & Sophie" },
  // More Asia
  { id: 38, name: "South Korea: Seoul & Temples", destination: "South Korea", lat: 37.57, lng: 126.98, status: "Dream", category: "Cultural", costEstimate: 3000, currency: "£", bestMonths: [3,4,5,9,10,11], nights: 8, notes: "Seoul street food, DMZ tour, Gyeongju temples, Busan fish market. K-BBQ origin story. Autumn foliage is spectacular.", priority: 3, people: "Joe & Sophie" },
  { id: 39, name: "Thailand: North & Islands", destination: "Thailand", lat: 18.79, lng: 98.98, status: "Dream", category: "Cultural", costEstimate: 2500, currency: "£", bestMonths: [11,12,1,2,3], nights: 12, notes: "Chiang Mai temples & night markets → Koh Lanta or Koh Samui for beaches. Thai cooking classes. Outstanding value.", priority: 3, people: "Joe & Sophie" },
  { id: 40, name: "Cambodia: Angkor & Coast", destination: "Cambodia", lat: 13.41, lng: 103.87, status: "Dream", category: "Cultural", costEstimate: 2000, currency: "£", bestMonths: [11,12,1,2,3], nights: 8, notes: "Angkor Wat sunrise is a bucket list moment. Add Phnom Penh history + Koh Rong beaches. Combines well with Vietnam.", priority: 4, people: "Joe & Sophie" },
  // Canada
  { id: 41, name: "Canadian Rockies Road Trip", destination: "Alberta, Canada", lat: 51.42, lng: -116.18, status: "Dream", category: "Road Trip", costEstimate: 4000, currency: "£", bestMonths: [6,7,8,9], nights: 10, notes: "Banff, Lake Louise, Jasper, Icefields Parkway. One of the world's most scenic drives. Bear spotting, turquoise lakes, mountain hiking.", priority: 4, people: "Joe & Sophie" },
  // More Europe
  { id: 42, name: "Amalfi to Sicily Road Trip", destination: "Sicily, Italy", lat: 37.50, lng: 14.26, status: "Dream", category: "Road Trip", costEstimate: 2200, currency: "£", bestMonths: [5,6,9,10], nights: 8, notes: "Drive south through Calabria to Sicily. Mount Etna, Taormina, Palermo street food, Valley of Temples. Raw, authentic Italy.", priority: 3, people: "Joe & Sophie" },
  { id: 43, name: "Budapest & Vienna", destination: "Hungary / Austria", lat: 47.50, lng: 19.04, status: "Dream", category: "City Break", costEstimate: 1400, currency: "£", bestMonths: [4,5,6,9,10,12], nights: 5, notes: "Budapest thermal baths, ruin bars, Danube views → train to Vienna for coffee houses, art, Sachertorte. Two gems, one trip. Christmas market season Dec.", priority: 3, people: "Joe & Sophie" },
  { id: 44, name: "Greek Islands Hopping", destination: "Greece", lat: 36.42, lng: 25.43, status: "Dream", category: "Beach & Relaxation", costEstimate: 2200, currency: "£", bestMonths: [5,6,9,10], nights: 8, notes: "Santorini + Naxos + Milos. Skip Mykonos party scene for lesser-known islands with better food and fewer crowds. Ferry between islands.", priority: 3, people: "Joe & Sophie" },
  { id: 45, name: "Edinburgh Festival", destination: "Edinburgh, UK", lat: 55.95, lng: -3.19, status: "Dream", category: "City Break", costEstimate: 800, currency: "£", bestMonths: [8], nights: 3, notes: "August Fringe Festival — comedy, theatre, street performers. Book early, prices triple. Arthur's Seat hike, whisky bars. Train from London.", priority: 4, people: "Joe & Sophie" },
  // Africa
  { id: 46, name: "Rwanda Gorilla Trek", destination: "Rwanda", lat: -1.46, lng: 29.57, status: "Dream", category: "Safari & Wildlife", costEstimate: 5000, currency: "£", bestMonths: [6,7,8,9,12,1,2], nights: 6, notes: "Mountain gorilla trekking in Volcanoes NP. Permits £1,300pp but absolutely life-changing. Small country, easy to combine all highlights.", priority: 5, people: "Joe & Sophie" },
  { id: 47, name: "Namibia Self-Drive", destination: "Namibia", lat: -24.75, lng: 15.76, status: "Dream", category: "Safari & Wildlife", costEstimate: 4500, currency: "£", bestMonths: [5,6,7,8,9,10], nights: 12, notes: "Sossusvlei dunes, Etosha NP, Skeleton Coast, Damaraland. Most photogenic country in Africa. Self-drive in a 4x4 with rooftop tent.", priority: 4, people: "Joe & Sophie" },
  // Unique/Bucket List
  { id: 48, name: "Antarctica Expedition Cruise", destination: "Antarctica", lat: -64.24, lng: -62.69, status: "Dream", category: "Adventure", costEstimate: 12000, currency: "£", bestMonths: [11,12,1,2,3], nights: 12, notes: "Drake Passage from Ushuaia. Penguins, icebergs, kayaking, polar plunge. The ultimate bucket list. Save this for a milestone birthday.", priority: 2, people: "Joe & Sophie" },
  { id: 49, name: "Oman: Desert & Coast", destination: "Oman", lat: 23.59, lng: 58.54, status: "Dream", category: "Adventure", costEstimate: 2500, currency: "£", bestMonths: [10,11,12,1,2,3], nights: 7, notes: "Wahiba Sands desert camping, Jebel Akhdar mountains, Muscat, wadis for swimming. Arabian Peninsula without the Dubai bling. Incredibly safe.", priority: 4, people: "Joe & Sophie" },
  { id: 50, name: "Colombia: Cartagena & Coffee Region", destination: "Colombia", lat: 4.71, lng: -74.07, status: "Dream", category: "Cultural", costEstimate: 3000, currency: "£", bestMonths: [12,1,2,3,7,8], nights: 10, notes: "Cartagena old city, Medellín transformation, Cocora Valley wax palms, coffee farm stays. Salsa, empanadas, rum. Hugely underrated.", priority: 3, people: "Joe & Sophie" },
  { id: 51, name: "Lapland: Husky & Northern Lights", destination: "Finnish Lapland", lat: 67.92, lng: 26.50, status: "Dream", category: "Ski & Snow", costEstimate: 2500, currency: "£", bestMonths: [12,1,2,3], nights: 4, notes: "Husky sledding, reindeer safari, glass igloo, northern lights, snowmobiling. Magical winter escape. Short trip — great for a long weekend.", priority: 3, people: "Joe & Sophie" },
  { id: 52, name: "Seville & Andalusia", destination: "Spain", lat: 37.39, lng: -6.00, status: "Dream", category: "City Break", costEstimate: 1000, currency: "£", bestMonths: [3,4,5,10,11], nights: 4, notes: "Alcázar, flamenco, tapas culture, Ronda day trip. Spring is perfect — Semana Santa or Feria de Abril. Avoid summer heat.", priority: 4, people: "Joe & Sophie" },
  { id: 53, name: "Borneo: Rainforest & Orangutans", destination: "Malaysian Borneo", lat: 5.42, lng: 118.60, status: "Dream", category: "Safari & Wildlife", costEstimate: 3500, currency: "£", bestMonths: [3,4,5,6,7,8,9,10], nights: 10, notes: "Sepilok orangutan rehab, Kinabatangan river wildlife cruises, Danum Valley pristine rainforest. Diving at Sipadan. Raw, wild, unforgettable.", priority: 3, people: "Joe & Sophie" },
  { id: 54, name: "Mexico City & Oaxaca", destination: "Mexico", lat: 19.43, lng: -99.13, status: "Dream", category: "Food & Wine", costEstimate: 2800, currency: "£", bestMonths: [10,11,12,1,2,3,4], nights: 10, notes: "CDMX street tacos, markets, Frida Kahlo museum. Oaxaca for mezcal, mole, Day of the Dead (late Oct). One of the world's great food cities.", priority: 4, people: "Joe & Sophie" },
  { id: 55, name: "Faroe Islands", destination: "Faroe Islands, Denmark", lat: 62.01, lng: -6.77, status: "Dream", category: "Adventure", costEstimate: 1800, currency: "£", bestMonths: [5,6,7,8], nights: 5, notes: "Dramatic cliffs, puffins, grass-roofed villages, hiking on the edge of the world. Small, remote, otherworldly. Like Iceland before the crowds.", priority: 4, people: "Joe & Sophie" },
];

function StorageManager() {
  return {
    async load() {
      try {
        const r = await window.storage.get("travel-bucket-list");
        return r ? JSON.parse(r.value) : null;
      } catch { return null; }
    },
    async save(trips) {
      try {
        await window.storage.set("travel-bucket-list", JSON.stringify(trips));
      } catch (e) { console.error("Storage error:", e); }
    }
  };
}

const storage = StorageManager();

const DEFAULT_SETTINGS = {
  annualLeaveDays: 25,
  timelineStartYear: 2025,
  timelineEndYear: 2035,
};

const settingsStorage = {
  async load() {
    try {
      const r = await window.storage.get("travel-bucket-list-settings");
      return r ? JSON.parse(r.value) : null;
    } catch { return null; }
  },
  async save(settings) {
    try {
      await window.storage.set("travel-bucket-list-settings", JSON.stringify(settings));
    } catch (e) { console.error("Settings storage error:", e); }
  }
};

const DEFAULT_SAVINGS = { totalSaved: 0, monthlySaving: 500 };

const savingsStorageHelper = {
  async load() {
    try {
      const r = await window.storage.get("travel-bucket-list-savings");
      return r ? JSON.parse(r.value) : null;
    } catch { return null; }
  },
  async save(data) {
    try {
      await window.storage.set("travel-bucket-list-savings", JSON.stringify(data));
    } catch (e) { console.error("Savings storage error:", e); }
  }
};

function findRelatedTrips(trip, allTrips) {
  if (!trip.notes) return [];
  const notesLower = trip.notes.toLowerCase();
  return allTrips.filter(other => {
    if (other.id === trip.id) return false;
    const destWords = other.destination.toLowerCase().split(/[,\s]+/).filter(w => w.length > 3);
    const nameLower = other.name.toLowerCase();
    return destWords.some(w => notesLower.includes(w)) || notesLower.includes(nameLower);
  });
}

export default function TravelBucketList() {
  const [trips, setTrips] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("map");
  const [showForm, setShowForm] = useState(false);
  const [editTrip, setEditTrip] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBy, setSortBy] = useState("priority");
  const [hoveredTrip, setHoveredTrip] = useState(null);
  const [worldData, setWorldData] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [deleteToast, setDeleteToast] = useState(null);
  const [showBudget, setShowBudget] = useState(false);
  const [savings, setSavings] = useState(DEFAULT_SAVINGS);
  const [compareIds, setCompareIds] = useState([]);
  const [showRandomPicker, setShowRandomPicker] = useState(false);
  const [darkMode, setDarkMode] = useState(() => { try { return localStorage.getItem("travel-dark-mode") === "true"; } catch { return false; } });
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [collapsedContinents, setCollapsedContinents] = useState({});
  const [filterFavourites, setFilterFavourites] = useState(false);
  const [achievementToast, setAchievementToast] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState(() => { try { return JSON.parse(localStorage.getItem("travel-achievements") || "[]"); } catch { return []; } });
  const c = darkMode ? DARK_COLORS : COLORS;
  const mapRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    (async () => {
      const saved = await storage.load();
      setTrips(saved && saved.length > 0 ? saved : DEFAULT_TRIPS);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (loaded) storage.save(trips);
  }, [trips, loaded]);

  useEffect(() => {
    if (!loaded) return;
    const newlyUnlocked = ACHIEVEMENTS.filter(a => !unlockedAchievements.includes(a.id) && a.check(trips));
    if (newlyUnlocked.length > 0) {
      const updated = [...unlockedAchievements, ...newlyUnlocked.map(a => a.id)];
      setUnlockedAchievements(updated);
      try { localStorage.setItem("travel-achievements", JSON.stringify(updated)); } catch {}
      setAchievementToast(newlyUnlocked[0]);
      setTimeout(() => setAchievementToast(null), 4000);
    }
  }, [trips, loaded]);

  useEffect(() => {
    (async () => {
      const saved = await settingsStorage.load();
      if (saved) setSettings(s => ({ ...DEFAULT_SETTINGS, ...saved }));
    })();
  }, []);

  useEffect(() => {
    settingsStorage.save(settings);
  }, [settings]);

  useEffect(() => {
    (async () => {
      const saved = await savingsStorageHelper.load();
      if (saved) setSavings(s => ({ ...DEFAULT_SAVINGS, ...saved }));
    })();
  }, []);

  useEffect(() => {
    savingsStorageHelper.save(savings);
  }, [savings]);

  useEffect(() => { try { localStorage.setItem("travel-dark-mode", darkMode); } catch {} }, [darkMode]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      if (showForm || showRandomPicker) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setShowCommandPalette(p => !p); return; }
      if (showCommandPalette) return;
      if (e.key === "/") { e.preventDefault(); setShowCommandPalette(true); return; }
      if (e.key === "g") { setView("map"); return; }
      if (e.key === "c" && !e.metaKey && !e.ctrlKey) { setView("cards"); return; }
      if (e.key === "t") { setView("timeline"); return; }
      if (e.key === "d") { setView("dashboard"); return; }
      if (e.key === "n") { setEditTrip(null); setShowForm(true); return; }
      if ((view === "cards" || view === "map") && !e.metaKey && !e.ctrlKey) {
        if (e.key === "j") { const idx = selectedTrip ? filtered.findIndex(t => t.id === selectedTrip.id) : -1; if (idx < filtered.length - 1) setSelectedTrip(filtered[idx + 1]); return; }
        if (e.key === "k") { const idx = selectedTrip ? filtered.findIndex(t => t.id === selectedTrip.id) : filtered.length; if (idx > 0) setSelectedTrip(filtered[idx - 1]); return; }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showForm, showRandomPicker, showCommandPalette, view, selectedTrip, filtered]);

  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(r => r.json())
      .then(d => setWorldData(d))
      .catch(() => {});
  }, []);

  const saveTrip = (trip) => {
    if (trip.id) {
      const old = trips.find(t => t.id === trip.id);
      if (old && old.status !== trip.status && (trip.status === "Booked" || trip.status === "Done")) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      setTrips(prev => prev.map(t => t.id === trip.id ? trip : t));
    } else {
      setTrips(prev => [...prev, { ...trip, id: Date.now() }]);
    }
    setShowForm(false);
    setEditTrip(null);
  };

  const deleteTrip = (id) => {
    const trip = trips.find(t => t.id === id);
    if (!trip) return;
    setTrips(prev => prev.filter(t => t.id !== id));
    setSelectedTrip(null);
    if (deleteToast?.timeoutId) clearTimeout(deleteToast.timeoutId);
    const timeoutId = setTimeout(() => setDeleteToast(null), 5000);
    setDeleteToast({ trip, timeoutId });
  };

  const undoDelete = () => {
    if (!deleteToast) return;
    clearTimeout(deleteToast.timeoutId);
    setTrips(prev => [...prev, deleteToast.trip]);
    setDeleteToast(null);
  };

  const toggleCompare = (id) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  const exportPlan = () => {
    const planned = trips.filter(t => t.plannedYear).sort((a, b) => (a.plannedYear - b.plannedYear) || ((a.plannedMonth || 0) - (b.plannedMonth || 0)));
    const lines = ["✈️ TRAVEL BUCKET LIST — Joe & Sophie", "═".repeat(42), ""];
    const years = [...new Set(planned.map(t => t.plannedYear))].sort();
    years.forEach(y => {
      const yTrips = planned.filter(t => t.plannedYear === y);
      const yTotal = yTrips.reduce((s, t) => s + (t.costEstimate || 0), 0);
      const yNights = yTrips.reduce((s, t) => s + (t.nights || 0), 0);
      lines.push(`── ${y} ── (${yTrips.length} trips · ${yNights} nights · £${yTotal.toLocaleString()})`);
      yTrips.forEach(t => {
        const month = t.plannedMonth ? BEST_MONTHS[t.plannedMonth - 1] : "TBD";
        lines.push(`  ${month.padEnd(4)} ${t.name} — ${t.destination} (${t.nights}n, £${t.costEstimate?.toLocaleString()})`);
      });
      lines.push("");
    });
    const unplanned = trips.filter(t => !t.plannedYear && t.status !== "Done");
    if (unplanned.length > 0) {
      lines.push(`── UNPLANNED ── (${unplanned.length} trips)`);
      unplanned.sort((a, b) => b.priority - a.priority).forEach(t => {
        lines.push(`  ${"★".repeat(t.priority || 0).padEnd(5)} ${t.name} — ${t.destination} (${t.nights}n, £${t.costEstimate?.toLocaleString()})`);
      });
    }
    const text = lines.join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setDeleteToast({ trip: { name: "Travel plan copied to clipboard!" }, timeoutId: setTimeout(() => setDeleteToast(null), 3000) });
    });
  };

  const toggleFavourite = (trip) => {
    setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, favourite: !t.favourite } : t));
  };

  const toggleChecklistItem = (trip, itemIdx) => {
    const checklist = getTripChecklist(trip);
    const updated = checklist.map((c, i) => i === itemIdx ? { ...c, done: !c.done } : c);
    setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, checklist: updated } : t));
  };

  const updateTrip = (updatedTrip) => {
    const old = trips.find(t => t.id === updatedTrip.id);
    if (old && old.status !== updatedTrip.status && (updatedTrip.status === "Booked" || updatedTrip.status === "Done")) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
  };

  const filtered = trips.filter(t => {
    if (filterStatus !== "All" && t.status !== filterStatus) return false;
    if (filterCategory !== "All" && t.category !== filterCategory) return false;
    if (filterFavourites && !t.favourite) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "priority") return b.priority - a.priority;
    if (sortBy === "cost") return a.costEstimate - b.costEstimate;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "nights") return b.nights - a.nights;
    return 0;
  });

  const totalCost = trips.reduce((s, t) => s + (t.costEstimate || 0), 0);
  const countries = new Set(trips.map(t => t.destination)).size;
  const totalNights = trips.reduce((s, t) => s + (t.nights || 0), 0);

  return (
    <ThemeContext.Provider value={c}>
    <div style={{ minHeight: "100vh", background: c.bg, fontFamily: "'Playfair Display', Georgia, serif", transition: "background 0.3s" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Confetti */}
      {showConfetti && <ConfettiEffect />}

      {/* Header */}
      <div style={{ background: darkMode ? "#010409" : c.navy, color: "#fff", padding: "28px 32px 20px", transition: "background 0.3s" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: c.gold, marginBottom: 6 }}>Joe & Sophie's</div>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>Travel Bucket List</h1>
              <AnimatedStats trips={trips} countries={countries} totalNights={totalNights} totalCost={totalCost} />
              {(() => {
                const nextBooked = trips.filter(t => t.status === "Booked" && t.plannedYear && t.plannedMonth).sort((a, b) => (a.plannedYear - b.plannedYear) || (a.plannedMonth - b.plannedMonth))[0];
                if (!nextBooked) return null;
                const target = new Date(nextBooked.plannedYear, nextBooked.plannedMonth - 1, 1);
                const days = Math.max(0, Math.ceil((target - new Date()) / 86400000));
                return (
                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: c.gold, marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Plane size={13} style={{ opacity: 0.7 }} />
                    <span>{days > 0 ? `${days} days until ${nextBooked.name}` : `${nextBooked.name} is here!`}</span>
                  </div>
                );
              })()}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => setDarkMode(d => !d)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 8, padding: "8px 10px", cursor: "pointer" }} title={darkMode ? "Light mode" : "Dark mode"}>
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button onClick={() => { setEditTrip(null); setShowForm(true); }} style={{ background: c.gold, color: c.navy, border: "none", padding: "10px 20px", borderRadius: 8, fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Plus size={16} /> Add Trip
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => {
              const count = trips.filter(t => t.status === k).length;
              return (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "DM Sans, sans-serif", fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: v.color }} />
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>{v.emoji} {k}</span>
                  <span style={{ color: v.color, fontWeight: 600 }}>{count}</span>
                </div>
              );
            })}
          </div>

          {/* View toggle + filters */}
          <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
            {["map", "cards", "timeline", "dashboard"].map(v => (
              <button key={v} onClick={() => setView(v)} style={{ background: view === v ? "rgba(255,255,255,0.15)" : "transparent", color: view === v ? "#fff" : "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)", padding: "6px 14px", borderRadius: 6, fontFamily: "DM Sans, sans-serif", fontSize: 12, cursor: "pointer", textTransform: "capitalize" }}>{v === "map" ? "🗺️ Globe" : v === "cards" ? "🃏 Cards" : v === "timeline" ? "📅 Timeline" : "📊 Dashboard"}</button>
            ))}
            <button onClick={() => setShowBudget(b => !b)} style={{ background: showBudget ? "rgba(255,255,255,0.15)" : "transparent", color: showBudget ? "#fff" : "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)", padding: "6px 14px", borderRadius: 6, fontFamily: "DM Sans, sans-serif", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><BarChart3 size={13} /> Budget</button>
            {compareIds.length > 0 && (
              <button onClick={() => setCompareIds([])} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", padding: "6px 14px", borderRadius: 6, fontFamily: "DM Sans, sans-serif", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Columns size={13} /> Compare ({compareIds.length})</button>
            )}
            <button onClick={() => setFilterFavourites(f => !f)} style={{ background: filterFavourites ? "rgba(200,169,81,0.3)" : "transparent", color: filterFavourites ? "#C8A951" : "rgba(255,255,255,0.5)", border: filterFavourites ? "1px solid rgba(200,169,81,0.5)" : "1px solid rgba(255,255,255,0.15)", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }} title="Favourites only"><Heart size={13} fill={filterFavourites ? "#C8A951" : "none"} /></button>
            <button onClick={() => setShowRandomPicker(true)} style={{ background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }} title="Random trip picker"><Shuffle size={13} /></button>
            <button onClick={exportPlan} style={{ background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }} title="Copy plan to clipboard"><Download size={13} /></button>
            <button onClick={() => setShowCommandPalette(true)} style={{ background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)", padding: "6px 10px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "DM Sans, sans-serif", fontSize: 11 }} title="Search (Ctrl+K)"><Search size={13} /><span style={{ opacity: 0.6, fontSize: 9 }}>⌘K</span></button>
            <button onClick={() => window.print()} style={{ background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }} title="Print"><Printer size={13} /></button>
            <div style={{ flex: 1 }} />
            {view !== "timeline" && view !== "dashboard" && (<>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", padding: "6px 10px", borderRadius: 6, fontFamily: "DM Sans, sans-serif", fontSize: 12 }}>
                <option value="All">All Status</option>
                {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", padding: "6px 10px", borderRadius: 6, fontFamily: "DM Sans, sans-serif", fontSize: 12 }}>
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", padding: "6px 10px", borderRadius: 6, fontFamily: "DM Sans, sans-serif", fontSize: 12 }}>
                <option value="priority">Priority</option>
                <option value="cost">Cost</option>
                <option value="name">Name</option>
                <option value="nights">Duration</option>
              </select>
            </>)}
          </div>
        </div>
      </div>

      <div key={view} style={{ maxWidth: view === "timeline" ? 1600 : view === "dashboard" ? 1400 : 1200, margin: "0 auto", padding: "24px 32px", transition: "max-width 0.3s", animation: "viewFadeIn 0.25s ease-out" }}>
        {/* In Season Banner */}
        {view !== "timeline" && view !== "dashboard" && <InSeasonBanner trips={trips} c={c} />}

        {/* Budget Panel */}
        {showBudget && view !== "dashboard" && <BudgetPanel trips={trips} savings={savings} onUpdateSavings={setSavings} c={c} />}

        {/* Comparison Panel */}
        {compareIds.length >= 2 && (
          <ComparisonPanel trips={trips.filter(t => compareIds.includes(t.id))} onClear={() => setCompareIds([])} />
        )}

        {/* Map View */}
        {view === "map" && <MapView trips={filtered} allTrips={trips} worldData={worldData} selectedTrip={selectedTrip} setSelectedTrip={setSelectedTrip} hoveredTrip={hoveredTrip} setHoveredTrip={setHoveredTrip} onEdit={(t) => { setEditTrip(t); setShowForm(true); }} onDelete={deleteTrip} />}

        {/* Timeline View */}
        {view === "timeline" && (
          <TimelineView
            trips={trips}
            settings={settings}
            onUpdateTrip={updateTrip}
            onEditTrip={(t) => { setEditTrip(t); setShowForm(true); }}
            onDeleteTrip={deleteTrip}
            onUpdateSettings={setSettings}
          />
        )}

        {/* Cards View — grouped by continent */}
        {view === "cards" && (
          <div>
            {(() => {
              const groups = {};
              filtered.forEach(t => { const cont = getContinent(t); if (!groups[cont]) groups[cont] = []; groups[cont].push(t); });
              const activeGroups = CONTINENT_ORDER.filter(cont => groups[cont]?.length > 0);
              if (filtered.length === 0) return (
                <div style={{ textAlign: "center", padding: 60, color: c.textMuted, fontFamily: "DM Sans, sans-serif" }}>
                  <Globe size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                  <p>No trips match your filters</p>
                </div>
              );
              let globalIdx = 0;
              return activeGroups.map(continent => {
                const cTrips = groups[continent];
                const totalCost = cTrips.reduce((s, t) => s + (t.costEstimate || 0), 0);
                const isCollapsed = collapsedContinents[continent];
                return (
                  <div key={continent} style={{ marginBottom: 28 }}>
                    <div onClick={() => setCollapsedContinents(prev => ({ ...prev, [continent]: !prev[continent] }))} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: isCollapsed ? 0 : 14, paddingBottom: 8, borderBottom: `1px solid ${c.border}`, cursor: "pointer", userSelect: "none" }}>
                      <ChevronDown size={16} style={{ color: c.textMuted, transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                      <span style={{ fontSize: 18 }}>{CONTINENT_EMOJI[continent]}</span>
                      <h2 style={{ margin: 0, fontSize: 18, color: c.navy, fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif" }}>{continent}</h2>
                      <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: c.textMuted }}>{cTrips.length} trip{cTrips.length !== 1 ? "s" : ""} · £{totalCost.toLocaleString()}</span>
                    </div>
                    {!isCollapsed && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
                        {cTrips.map(trip => {
                          const idx = globalIdx++;
                          return <TripCard key={trip.id} trip={trip} onSelect={() => setSelectedTrip(trip)} onEdit={() => { setEditTrip(trip); setShowForm(true); }} onDelete={() => deleteTrip(trip.id)} isComparing={compareIds.includes(trip.id)} onToggleCompare={() => toggleCompare(trip.id)} onUpdatePriority={(p) => updateTrip({ ...trip, priority: p })} onUpdateStatus={(s) => updateTrip({ ...trip, status: s })} onToggleFavourite={() => toggleFavourite(trip)} style={{ animation: `cardFadeIn 0.3s ease-out ${idx * 0.03}s both` }} />;
                        })}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* Dashboard View */}
        {view === "dashboard" && <DashboardView trips={trips} savings={savings} onUpdateSavings={setSavings} unlockedAchievements={unlockedAchievements} />}
      </div>

      {/* Full-Screen Trip Detail (for cards view) */}
      {selectedTrip && view === "cards" && (
        <TripDetailModal trip={selectedTrip} allTrips={trips} onEdit={() => { setEditTrip(selectedTrip); setShowForm(true); }} onDelete={() => deleteTrip(selectedTrip.id)} onClose={() => setSelectedTrip(null)} onSelectTrip={setSelectedTrip} onToggleChecklist={(trip, idx) => toggleChecklistItem(trip, idx)} />
      )}

      {/* Form Modal */}
      {showForm && <TripForm trip={editTrip} onSave={saveTrip} onClose={() => { setShowForm(false); setEditTrip(null); }} />}

      {/* Delete Undo Toast */}
      {deleteToast && <DeleteToast trip={deleteToast.trip} onUndo={undoDelete} />}

      {/* Random Picker */}
      {showRandomPicker && <RandomPicker trips={trips.filter(t => t.status !== "Done")} onClose={() => setShowRandomPicker(false)} onSelect={(t) => { setSelectedTrip(t); setView("map"); setShowRandomPicker(false); }} />}

      {/* Achievement Toast */}
      {achievementToast && <AchievementToast achievement={achievementToast} />}

      {/* Command Palette */}
      {showCommandPalette && <CommandPalette trips={trips} onSelect={(t) => { setSelectedTrip(t); if (view !== "cards" && view !== "map") setView("map"); }} onClose={() => setShowCommandPalette(false)} onSwitchView={setView} />}

      {/* Responsive styles + print styles */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes viewFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes flightDash {
          to { stroke-dashoffset: -20; }
        }
        @media (max-width: 768px) {
          body { font-size: 14px; }
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
    </ThemeContext.Provider>
  );
}

function MapView({ trips, allTrips, worldData, selectedTrip, setSelectedTrip, hoveredTrip, setHoveredTrip, onEdit, onDelete }) {
  const c = useTheme();
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 900, h: 480 });
  const [rotation, setRotation] = useState([0, -20, 0]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const w = e.contentRect.width;
        setDims({ w, h: Math.max(380, w * 0.5) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!worldData || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const scale = Math.min(dims.w, dims.h) / 2.2;
    const projection = d3.geoOrthographic()
      .scale(scale)
      .translate([dims.w / 2, dims.h / 2])
      .clipAngle(90)
      .rotate(rotation);

    const path = d3.geoPath().projection(projection);
    const topoFeature = window.topojson
      ? window.topojson.feature(worldData, worldData.objects.countries)
      : { type: "FeatureCollection", features: [] };

    // Background
    svg.append("rect").attr("width", dims.w).attr("height", dims.h).attr("fill", "transparent").attr("rx", 12);

    // Ocean sphere (dark mode aware)
    const isDark = c.bg === "#0D1117";
    svg.append("circle").attr("cx", dims.w / 2).attr("cy", dims.h / 2).attr("r", scale).attr("fill", isDark ? "#0A1628" : "#E8EEF2").attr("stroke", isDark ? "#1B3050" : "#D0D8DE").attr("stroke-width", 1);

    // Graticule
    svg.append("path").datum(d3.geoGraticule()()).attr("d", path).attr("fill", "none").attr("stroke", isDark ? "#1A2A3A" : "#D4DDE3").attr("stroke-width", 0.3);

    // Countries (with hover highlighting)
    if (topoFeature.features.length > 0) {
      const defaultFill = isDark ? "#162233" : "#F0EBE3";
      const hoverFill = isDark ? "#1E3A5C" : c.goldLight;
      svg.selectAll(".country")
        .data(topoFeature.features)
        .enter().append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", defaultFill)
        .attr("stroke", isDark ? "#1E3348" : "#D8D0C4")
        .attr("stroke-width", 0.5)
        .style("cursor", "pointer")
        .on("mouseenter", function(event, feature) {
          const countryTrips = trips.filter(t => t.lat && t.lng && d3.geoContains(feature, [t.lng, t.lat]));
          if (countryTrips.length > 0) {
            d3.select(this).attr("fill", hoverFill).attr("stroke-width", 1);
            const [mx, my] = d3.pointer(event, svgRef.current);
            const names = countryTrips.slice(0, 3).map(t => t.name).join(" \u00B7 ");
            const label = countryTrips.length > 3 ? names + " +" + (countryTrips.length - 3) : names;
            const tip = svg.append("g").attr("class", "country-tip");
            const tt = tip.append("text").attr("x", mx).attr("y", my - 14).attr("text-anchor", "middle").attr("font-family", "DM Sans, sans-serif").attr("font-size", 10).attr("font-weight", 600).attr("fill", c.navy).text(label);
            const bb = tt.node().getBBox();
            tip.insert("rect", "text").attr("x", bb.x - 6).attr("y", bb.y - 3).attr("width", bb.width + 12).attr("height", bb.height + 6).attr("rx", 5).attr("fill", c.card).attr("stroke", c.gold).attr("stroke-width", 0.5).attr("opacity", 0.95);
          }
        })
        .on("mouseleave", function() {
          d3.select(this).attr("fill", defaultFill).attr("stroke-width", 0.5);
          svg.selectAll(".country-tip").remove();
        });
    }

    // Drag to rotate
    svg.call(d3.drag()
      .on("drag", (event) => {
        const k = 75 / scale;
        setRotation(([lambda, phi, gamma]) => [
          lambda + event.dx * k,
          Math.max(-60, Math.min(60, phi - event.dy * k)),
          gamma
        ]);
      })
    ).style("cursor", "grab");

    // Route lines for planned trips (only visible arcs)
    const planned = (allTrips || trips).filter(t => t.plannedYear && t.lat && t.lng)
      .sort((a, b) => (a.plannedYear - b.plannedYear) || ((a.plannedMonth || 0) - (b.plannedMonth || 0)));
    for (let i = 0; i < planned.length - 1; i++) {
      const from = planned[i], to = planned[i + 1];
      const interp = d3.geoInterpolate([from.lng, from.lat], [to.lng, to.lat]);
      const points = Array.from({ length: 25 }, (_, j) => {
        const pt = interp(j / 24);
        const dist = d3.geoDistance(pt, [-rotation[0], -rotation[1]]);
        return dist < Math.PI / 2 ? projection(pt) : null;
      }).filter(p => p);
      if (points.length > 1) {
        const lineGen = d3.line().curve(d3.curveBasis);
        svg.append("path")
          .attr("d", lineGen(points))
          .attr("fill", "none")
          .attr("stroke", c.gold)
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "6,4")
          .attr("opacity", 0.5);
      }
    }

    // Animated flight arc from London
    if (selectedTrip?.lat && selectedTrip?.lng) {
      const london = [LONDON.lng, LONDON.lat];
      const dest = [selectedTrip.lng, selectedTrip.lat];
      const interp = d3.geoInterpolate(london, dest);
      const arcPoints = Array.from({ length: 50 }, (_, i) => {
        const pt = interp(i / 49);
        const dist = d3.geoDistance(pt, [-rotation[0], -rotation[1]]);
        return dist < Math.PI / 2 ? projection(pt) : null;
      }).filter(p => p);
      if (arcPoints.length > 1) {
        const lineGen = d3.line().curve(d3.curveBasis);
        svg.append("path")
          .attr("d", lineGen(arcPoints))
          .attr("fill", "none")
          .attr("stroke", c.gold)
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "8 4")
          .attr("stroke-linecap", "round")
          .style("animation", "flightDash 0.6s linear infinite");
      }
      // London home marker
      const londonDist = d3.geoDistance(london, [-rotation[0], -rotation[1]]);
      if (londonDist < Math.PI / 2) {
        const [lx, ly] = projection(london);
        if (lx && ly) {
          svg.append("circle").attr("cx", lx).attr("cy", ly).attr("r", 4).attr("fill", c.gold).attr("stroke", c.card).attr("stroke-width", 1.5);
          const lg = svg.append("g").attr("transform", `translate(${lx}, ${ly - 10})`);
          const lt = lg.append("text").attr("text-anchor", "middle").attr("font-family", "DM Sans, sans-serif").attr("font-size", 8).attr("font-weight", 700).attr("fill", c.gold).text("HOME");
          const lb = lt.node().getBBox();
          lg.insert("rect", "text").attr("x", lb.x - 3).attr("y", lb.y - 1).attr("width", lb.width + 6).attr("height", lb.height + 2).attr("rx", 2).attr("fill", c.card).attr("opacity", 0.85);
        }
      }
    }

    // Trip markers (only visible hemisphere)
    trips.forEach(trip => {
      if (!trip.lat || !trip.lng) return;
      const dist = d3.geoDistance([trip.lng, trip.lat], [-rotation[0], -rotation[1]]);
      if (dist > Math.PI / 2) return;
      const [cx, cy] = projection([trip.lng, trip.lat]);
      if (!cx || !cy) return;
      const cfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.Dream;
      const isSelected = selectedTrip?.id === trip.id;
      const isHovered = hoveredTrip?.id === trip.id;

      const g = svg.append("g").style("cursor", "pointer");

      // Pulse ring for selected
      if (isSelected) {
        g.append("circle").attr("cx", cx).attr("cy", cy).attr("r", 18).attr("fill", "none").attr("stroke", cfg.color).attr("stroke-width", 1.5).attr("opacity", 0.4);
      }

      // Outer ring
      g.append("circle").attr("cx", cx).attr("cy", cy).attr("r", isSelected ? 10 : isHovered ? 9 : 7).attr("fill", cfg.color).attr("opacity", 0.25).attr("stroke", cfg.color).attr("stroke-width", 1);

      // Inner dot
      g.append("circle").attr("cx", cx).attr("cy", cy).attr("r", isSelected ? 5 : isHovered ? 4.5 : 3.5).attr("fill", cfg.color).attr("stroke", c.card).attr("stroke-width", 1.5);

      // Planned year micro-label
      if (trip.plannedYear && !isSelected && !isHovered) {
        const yg = g.append("g").attr("transform", `translate(${cx}, ${cy + 13})`);
        const yt = yg.append("text").attr("text-anchor", "middle").attr("font-family", "DM Sans, sans-serif").attr("font-size", 7).attr("font-weight", 700).attr("fill", cfg.color).text(trip.plannedYear);
        const yb = yt.node().getBBox();
        yg.insert("rect", "text").attr("x", yb.x - 2).attr("y", yb.y - 1).attr("width", yb.width + 4).attr("height", yb.height + 2).attr("rx", 2).attr("fill", c.card).attr("opacity", 0.9);
      }

      // Label
      if (isSelected || isHovered) {
        const label = g.append("g").attr("transform", `translate(${cx}, ${cy - 16})`);
        const text = label.append("text").attr("text-anchor", "middle").attr("font-family", "DM Sans, sans-serif").attr("font-size", 11).attr("font-weight", 600).attr("fill", c.navy).text(trip.name);
        const bbox = text.node().getBBox();
        label.insert("rect", "text").attr("x", bbox.x - 6).attr("y", bbox.y - 3).attr("width", bbox.width + 12).attr("height", bbox.height + 6).attr("rx", 4).attr("fill", c.card).attr("stroke", cfg.color).attr("stroke-width", 1);
      }

      g.on("click", () => setSelectedTrip(selectedTrip?.id === trip.id ? null : trip));
      g.on("mouseenter", () => setHoveredTrip(trip));
      g.on("mouseleave", () => setHoveredTrip(null));
    });

  }, [worldData, trips, allTrips, dims, selectedTrip, hoveredTrip, rotation, c]);

  // Auto-rotate to selected trip
  useEffect(() => {
    if (!selectedTrip?.lng || !selectedTrip?.lat) return;
    const targetLng = -selectedTrip.lng;
    const targetLat = -selectedTrip.lat;
    let frame;
    const animate = () => {
      setRotation(([lambda, phi, gamma]) => {
        const dl = (targetLng - lambda) * 0.08;
        const dp = (targetLat - phi) * 0.08;
        if (Math.abs(dl) < 0.3 && Math.abs(dp) < 0.3) return [targetLng, targetLat, gamma];
        return [lambda + dl, phi + dp, gamma];
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [selectedTrip?.id]);

  // Load topojson library
  useEffect(() => {
    if (window.topojson) return;
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js";
    s.onload = () => setDims(d => ({ ...d })); // trigger re-render
    document.head.appendChild(s);
  }, []);

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      <div ref={containerRef} style={{ flex: "1 1 600px", minWidth: 300 }}>
        <div style={{ background: c.card, borderRadius: 12, overflow: "hidden", border: `1px solid ${c.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <svg ref={svgRef} width={dims.w} height={dims.h} style={{ display: "block" }} />
        </div>
      </div>

      {/* Side panel */}
      <div style={{ flex: "0 0 320px", minWidth: 280 }}>
        {selectedTrip ? (
          <TripDetail trip={selectedTrip} allTrips={allTrips || trips} onEdit={() => onEdit(selectedTrip)} onDelete={() => onDelete(selectedTrip.id)} onClose={() => setSelectedTrip(null)} onSelectTrip={setSelectedTrip} />
        ) : (
          <div style={{ background: c.card, borderRadius: 12, border: `1px solid ${c.border}`, padding: 24 }}>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: c.textMuted, textAlign: "center", margin: 0 }}>
              <MapPin size={20} style={{ opacity: 0.4, display: "block", margin: "0 auto 8px" }} />
              Click a pin on the map to see trip details
            </p>
            <div style={{ marginTop: 20 }}>
              {trips.slice(0, 6).map(t => (
                <div key={t.id} onClick={() => setSelectedTrip(t)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${c.border}`, cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 13 }} onMouseEnter={() => setHoveredTrip(t)} onMouseLeave={() => setHoveredTrip(null)}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_CONFIG[t.status]?.color, flexShrink: 0 }} />
                  <span style={{ color: c.text, fontWeight: 500, flex: 1 }}>{t.name}</span>
                  <span style={{ color: c.textMuted, fontSize: 12 }}>£{t.costEstimate?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TripDetail({ trip, allTrips, onEdit, onDelete, onClose, onSelectTrip }) {
  const c = useTheme();
  const cfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.Dream;
  const related = allTrips ? findRelatedTrips(trip, allTrips) : [];
  return (
    <div style={{ background: c.card, borderRadius: 12, border: `1px solid ${c.border}`, overflow: "hidden" }}>
      <div style={{ background: CATEGORY_GRADIENTS[trip.category] || cfg.color, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#fff", fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>{cfg.emoji} {trip.status}</span>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 6, padding: "4px 6px", cursor: "pointer" }}><X size={14} /></button>
      </div>
      <div style={{ padding: 20 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 18, color: c.navy }}>{trip.name}</h3>
        <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: c.textMuted, margin: "0 0 16px" }}>{trip.destination}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <InfoBox icon={<PoundSterling size={14} />} label="Est. Cost" value={`£${trip.costEstimate?.toLocaleString() || "TBD"}`} />
          <InfoBox icon={<Calendar size={14} />} label="Nights" value={trip.nights || "TBD"} />
          <InfoBox icon={<Star size={14} />} label="Priority" value={"★".repeat(trip.priority || 0) + "☆".repeat(5 - (trip.priority || 0))} />
          <InfoBox icon={<Plane size={14} />} label="Flight" value={getFlightHours(trip) ? `${getFlightHours(trip)}h from London` : trip.category || "—"} />
        </div>

        {trip.bestMonths?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: c.textMuted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Best Months</div>
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              {BEST_MONTHS.map((m, i) => {
                const active = trip.bestMonths.includes(i + 1);
                return <div key={m} style={{ padding: "3px 7px", borderRadius: 4, fontSize: 11, fontFamily: "DM Sans, sans-serif", fontWeight: active ? 600 : 400, background: active ? c.goldLight : c.sand, color: active ? c.gold : c.textMuted }}>{m}</div>;
              })}
            </div>
          </div>
        )}

        {trip.people && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: c.textMuted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Who</div>
            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: c.text }}>{trip.people}</div>
          </div>
        )}

        {trip.notes && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: c.textMuted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Notes</div>
            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: c.text, lineHeight: 1.5, fontStyle: "italic" }}>{trip.notes}</div>
          </div>
        )}

        {related.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: c.textMuted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 4 }}><Link2 size={10} /> Pairs Well With</div>
            {related.slice(0, 3).map(r => (
              <div key={r.id} onClick={() => onSelectTrip?.(r)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", marginBottom: 3, borderRadius: 6, background: c.cream, cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_CONFIG[r.status]?.color, flexShrink: 0 }} />
                <span style={{ color: c.navy, fontWeight: 500, flex: 1 }}>{r.name}</span>
                <span style={{ color: c.textMuted, fontSize: 10 }}>{r.destination}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={onEdit} style={{ flex: 1, background: c.navy, color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6, fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Edit2 size={13} /> Edit</button>
          <button onClick={onDelete} style={{ background: "#FEE2E2", color: "#DC2626", border: "none", padding: "8px 12px", borderRadius: 6, fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" }}><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ icon, label, value }) {
  const c = useTheme();
  return (
    <div style={{ background: c.cream, borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, color: c.textMuted, fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>{icon} {label}</div>
      <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 600, color: c.navy }}>{value}</div>
    </div>
  );
}

function TripCard({ trip, onSelect, onEdit, onDelete, isComparing, onToggleCompare, onUpdatePriority, onUpdateStatus, onToggleFavourite, style: cardStyle }) {
  const c = useTheme();
  const [imgLoaded, setImgLoaded] = useState(false);
  const cfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.Dream;
  const gradient = CATEGORY_GRADIENTS[trip.category];
  const costPerNight = trip.nights > 0 && trip.costEstimate > 0 ? Math.round(trip.costEstimate / trip.nights) : null;
  const flightH = getFlightHours(trip);
  const checklist = getTripChecklist(trip);
  const checkDone = checklist.filter(c => c.done).length;
  return (
    <div onClick={onSelect} style={{ ...cardStyle, background: c.card, borderRadius: 12, border: isComparing ? `2px solid ${c.gold}` : `1px solid ${c.border}`, overflow: "hidden", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s, opacity 0.4s", boxShadow: isComparing ? `0 4px 16px ${c.gold}30` : "0 2px 8px rgba(0,0,0,0.04)" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = isComparing ? `0 8px 24px ${c.gold}40` : "0 6px 20px rgba(0,0,0,0.1)"; }} onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = isComparing ? `0 4px 16px ${c.gold}30` : "0 2px 8px rgba(0,0,0,0.04)"; }}>
      {/* Photo header with shimmer loading */}
      <div style={{ height: 120, background: gradient || cfg.color, position: "relative", display: "flex", alignItems: "flex-end", padding: "0 12px 8px", overflow: "hidden" }}>
        {!imgLoaded && <div className="shimmer" style={{ position: "absolute", inset: 0 }} />}
        <img src={getTripImage(trip)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: imgLoaded ? 1 : 0, transition: "opacity 0.3s" }} onLoad={() => setImgLoaded(true)} onError={e => { e.target.style.display = "none"; setImgLoaded(true); }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)" }} />
        <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.9)", fontWeight: 600, position: "relative", zIndex: 1 }}>{trip.category}</span>
        {onToggleFavourite && <div style={{ position: "absolute", top: 6, left: 6 }} onClick={e => e.stopPropagation()}>
          <button onClick={onToggleFavourite} style={{ background: "rgba(0,0,0,0.3)", border: "none", borderRadius: 4, padding: "3px 5px", cursor: "pointer", backdropFilter: "blur(4px)" }}>
            <Heart size={12} fill={trip.favourite ? "#C8A951" : "none"} color={trip.favourite ? "#C8A951" : "rgba(255,255,255,0.8)"} />
          </button>
        </div>}
        <div style={{ position: "absolute", top: 6, right: 6 }} onClick={e => e.stopPropagation()}>
          <button onClick={onToggleCompare} style={{ background: isComparing ? c.gold : "rgba(255,255,255,0.3)", border: "none", borderRadius: 4, padding: "2px 6px", cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 9, fontWeight: 600, color: isComparing ? c.navy : "#fff" }} title="Compare">
            <Columns size={10} />
          </button>
        </div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, color: c.navy, lineHeight: 1.3 }}>{trip.name}</h3>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: c.textMuted, margin: "2px 0 0" }}>{trip.destination}</p>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
            <span style={{ background: cfg.color + "18", color: cfg.color, fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, whiteSpace: "nowrap" }}>{cfg.emoji} {trip.status}</span>
            {trip.plannedYear && (
              <span style={{ background: c.navy + "10", color: c.navy, fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 3 }}>
                <Clock size={9} /> {trip.plannedMonth ? BEST_MONTHS[trip.plannedMonth - 1] + " " : ""}{trip.plannedYear}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, fontFamily: "DM Sans, sans-serif", fontSize: 12, color: c.textMuted, marginBottom: 10, alignItems: "center" }}>
          <span>£{trip.costEstimate?.toLocaleString() || "TBD"}</span>
          <span>{trip.nights ? `${trip.nights} nights` : "—"}</span>
          {costPerNight && <span style={{ background: c.gold + "15", color: c.gold, padding: "1px 6px", borderRadius: 3, fontSize: 10, fontWeight: 600 }}>£{costPerNight}/n</span>}
          <span style={{ color: c.gold }}>{"★".repeat(trip.priority || 0)}</span>
          {flightH && <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Plane size={10} style={{ opacity: 0.5 }} />{flightH}h</span>}
        </div>

        {trip.bestMonths?.length > 0 && (
          <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
            {BEST_MONTHS.map((m, i) => {
              const active = trip.bestMonths.includes(i + 1);
              return <div key={m} style={{ width: 24, height: 16, borderRadius: 3, fontSize: 8, fontFamily: "DM Sans, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", background: active ? cfg.color + "22" : c.sand, color: active ? cfg.color : c.textMuted, fontWeight: active ? 700 : 400 }}>{m}</div>;
            })}
          </div>
        )}

        {trip.category && <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, color: c.warmGrey, background: c.sand, padding: "2px 8px", borderRadius: 4 }}>{trip.category}</span>}

        <div style={{ display: "flex", gap: 6, marginTop: 12, justifyContent: "flex-end", alignItems: "center" }} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", gap: 2, alignItems: "center", marginRight: "auto" }} onClick={e => e.stopPropagation()}>
            {onUpdateStatus && STATUS_ORDER.map((s, i) => {
              const currentIdx = STATUS_ORDER.indexOf(trip.status);
              const isCurrent = trip.status === s;
              const isPast = currentIdx > i;
              const isNext = currentIdx === i - 1;
              const scfg = STATUS_CONFIG[s];
              return (
                <div key={s} style={{ display: "contents" }}>
                  {i > 0 && <div style={{ width: 10, height: 1.5, background: isPast || isCurrent ? scfg.color : c.border, transition: "background 0.2s" }} />}
                  <div
                    onClick={isNext ? (e) => { e.stopPropagation(); onUpdateStatus(s); } : undefined}
                    title={isNext ? `Mark as ${s}` : s}
                    style={{
                      width: isCurrent ? 14 : 8, height: isCurrent ? 14 : 8,
                      borderRadius: "50%",
                      background: isPast || isCurrent ? scfg.color : "transparent",
                      border: `1.5px solid ${isPast || isCurrent ? scfg.color : isNext ? scfg.color + "60" : c.border}`,
                      cursor: isNext ? "pointer" : "default",
                      transition: "all 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => { if (isNext) { e.currentTarget.style.transform = "scale(1.4)"; e.currentTarget.style.background = scfg.color + "40"; } }}
                    onMouseLeave={e => { if (isNext) { e.currentTarget.style.transform = ""; e.currentTarget.style.background = "transparent"; } }}
                  >
                    {isCurrent && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                </div>
              );
            })}
          </div>
          {checkDone > 0 && <div style={{ display: "flex", alignItems: "center", gap: 4 }} title={`${checkDone}/${checklist.length} planning tasks done`}><CompletionRing completed={checkDone} total={checklist.length} size={18} /><span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 9, color: c.textMuted }}>{checkDone}/{checklist.length}</span></div>}
          <button onClick={onEdit} style={{ background: "none", border: `1px solid ${c.border}`, color: c.textMuted, borderRadius: 5, padding: "4px 8px", cursor: "pointer", fontSize: 11, fontFamily: "DM Sans, sans-serif", display: "flex", alignItems: "center", gap: 3 }}><Edit2 size={11} /> Edit</button>
          <button onClick={onDelete} style={{ background: "none", border: `1px solid ${c.border}`, color: "#DC2626", borderRadius: 5, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}><Trash2 size={11} /></button>
        </div>
      </div>
    </div>
  );
}

function TripForm({ trip, onSave, onClose }) {
  const c = useTheme();
  const [form, setForm] = useState(trip || {
    name: "", destination: "", lat: "", lng: "", status: "Dream", category: "Cultural",
    costEstimate: "", currency: "£", bestMonths: [], nights: "", notes: "", priority: 3, people: "Joe & Sophie",
    plannedYear: null, plannedMonth: null
  });

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleMonth = (m) => setForm(p => ({ ...p, bestMonths: p.bestMonths?.includes(m) ? p.bestMonths.filter(x => x !== m) : [...(p.bestMonths || []), m] }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      ...form,
      lat: parseFloat(form.lat) || 0,
      lng: parseFloat(form.lng) || 0,
      costEstimate: parseInt(form.costEstimate) || 0,
      nights: parseInt(form.nights) || 0,
      priority: parseInt(form.priority) || 3,
      plannedYear: form.plannedYear || null,
      plannedMonth: form.plannedMonth || null,
    });
  };

  const iS = { fontFamily: "DM Sans, sans-serif", fontSize: 13, padding: "8px 12px", border: `1px solid ${c.border}`, borderRadius: 6, width: "100%", boxSizing: "border-box", background: c.card, color: c.text };
  const lS = { fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 600, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, display: "block" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: c.bg, borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${c.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 20, color: c.navy }}>{trip ? "Edit Trip" : "Add Trip"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: c.textMuted }}><X size={20} /></button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={lS}>Trip Name *</label>
            <input value={form.name} onChange={e => upd("name", e.target.value)} placeholder="e.g. Iceland Ring Road" style={iS} />
          </div>

          <div>
            <label style={lS}>Destination</label>
            <input value={form.destination} onChange={e => upd("destination", e.target.value)} placeholder="e.g. Iceland" style={iS} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lS}>Latitude</label>
              <input value={form.lat} onChange={e => upd("lat", e.target.value)} placeholder="e.g. 64.96" style={iS} type="number" step="any" />
            </div>
            <div>
              <label style={lS}>Longitude</label>
              <input value={form.lng} onChange={e => upd("lng", e.target.value)} placeholder="e.g. -19.02" style={iS} type="number" step="any" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lS}>Status</label>
              <select value={form.status} onChange={e => upd("status", e.target.value)} style={iS}>
                {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].emoji} {s}</option>)}
              </select>
            </div>
            <div>
              <label style={lS}>Category</label>
              <select value={form.category} onChange={e => upd("category", e.target.value)} style={iS}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={lS}>Est. Cost (£)</label>
              <input value={form.costEstimate} onChange={e => upd("costEstimate", e.target.value)} placeholder="3000" style={iS} type="number" />
            </div>
            <div>
              <label style={lS}>Nights</label>
              <input value={form.nights} onChange={e => upd("nights", e.target.value)} placeholder="7" style={iS} type="number" />
            </div>
            <div>
              <label style={lS}>Priority (1-5)</label>
              <select value={form.priority} onChange={e => upd("priority", parseInt(e.target.value))} style={iS}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} — {"★".repeat(n)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={lS}>Best Months to Visit</label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {BEST_MONTHS.map((m, i) => {
                const active = form.bestMonths?.includes(i + 1);
                return <button key={m} onClick={() => toggleMonth(i + 1)} style={{ padding: "5px 10px", borderRadius: 5, fontSize: 12, fontFamily: "DM Sans, sans-serif", border: `1px solid ${active ? c.gold : c.border}`, background: active ? c.goldLight : "#fff", color: active ? c.gold : c.textMuted, cursor: "pointer", fontWeight: active ? 600 : 400 }}>{m}</button>;
              })}
            </div>
          </div>

          <div>
            <label style={lS}>Who's Going</label>
            <input value={form.people} onChange={e => upd("people", e.target.value)} placeholder="Joe & Sophie" style={iS} />
          </div>

          <div>
            <label style={lS}>Notes & Ideas</label>
            <textarea value={form.notes} onChange={e => upd("notes", e.target.value)} placeholder="Must-sees, restaurant ideas, practical tips..." rows={3} style={{ ...iS, resize: "vertical" }} />
          </div>

          <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 14, marginTop: 4 }}>
            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 600, color: c.navy, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} /> Timeline Planning</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={lS}>Planned Year</label>
                <select value={form.plannedYear || ""} onChange={e => upd("plannedYear", e.target.value ? parseInt(e.target.value) : null)} style={iS}>
                  <option value="">Unplanned</option>
                  {Array.from({ length: 11 }, (_, i) => 2025 + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lS}>Planned Month</label>
                <select value={form.plannedMonth || ""} onChange={e => upd("plannedMonth", e.target.value ? parseInt(e.target.value) : null)} style={{ ...iS, opacity: form.plannedYear ? 1 : 0.5 }} disabled={!form.plannedYear}>
                  <option value="">Any month</option>
                  {BEST_MONTHS.map((m, i) => (
                    <option key={m} value={i + 1} style={{ fontWeight: form.bestMonths?.includes(i + 1) ? 700 : 400 }}>{m}{form.bestMonths?.includes(i + 1) ? " ★" : ""}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button onClick={handleSave} style={{ background: c.navy, color: "#fff", border: "none", padding: "12px 20px", borderRadius: 8, fontFamily: "DM Sans, sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8 }}>
            {trip ? "Save Changes" : "Add to Bucket List"} ✨
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TIMELINE COMPONENTS
   ============================================================ */

function TimelineView({ trips, settings, onUpdateTrip, onEditTrip, onDeleteTrip, onUpdateSettings }) {
  const c = useTheme();
  const [assigningTrip, setAssigningTrip] = useState(null);
  const [selectedPlacedTrip, setSelectedPlacedTrip] = useState(null);
  const [suggestYear, setSuggestYear] = useState(null);
  const gridRef = useRef(null);

  const years = [];
  for (let y = settings.timelineStartYear; y <= settings.timelineEndYear; y++) years.push(y);

  const unplannedTrips = trips.filter(t => !t.plannedYear).sort((a, b) => b.priority - a.priority);
  const plannedTrips = trips.filter(t => t.plannedYear);

  const tripsByYearMonth = {};
  plannedTrips.forEach(t => {
    const key = t.plannedMonth ? `${t.plannedYear}-${t.plannedMonth}` : `${t.plannedYear}-unscheduled`;
    if (!tripsByYearMonth[key]) tripsByYearMonth[key] = [];
    tripsByYearMonth[key].push(t);
  });

  const yearSummaries = years.map(y => {
    const yTrips = plannedTrips.filter(t => t.plannedYear === y);
    const totalNights = yTrips.reduce((s, t) => s + (t.nights || 0), 0);
    const totalCost = yTrips.reduce((s, t) => s + (t.costEstimate || 0), 0);
    return { year: y, trips: yTrips, totalNights, totalCost, leaveDaysUsed: totalNights, leaveDaysAvailable: settings.annualLeaveDays, isOvercommitted: totalNights > settings.annualLeaveDays };
  });

  const handleAssign = (year, month) => {
    if (!assigningTrip) return;
    onUpdateTrip({ ...assigningTrip, plannedYear: year, plannedMonth: month });
    setAssigningTrip(null);
  };

  const handleUnassign = (trip) => {
    onUpdateTrip({ ...trip, plannedYear: null, plannedMonth: null });
    setSelectedPlacedTrip(null);
  };

  const handleMove = (trip) => {
    onUpdateTrip({ ...trip, plannedYear: null, plannedMonth: null });
    setSelectedPlacedTrip(null);
    setAssigningTrip(trip);
  };

  const handleDropTrip = (tripId, year, month) => {
    const trip = trips.find(t => t.id === Number(tripId));
    if (trip) {
      onUpdateTrip({ ...trip, plannedYear: year, plannedMonth: month });
      setAssigningTrip(null);
    }
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setAssigningTrip(null);
        setSelectedPlacedTrip(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div>
      {/* Settings bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, padding: "12px 16px", background: c.card, borderRadius: 10, border: `1px solid ${c.border}`, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "DM Sans, sans-serif", fontSize: 13, color: c.text }}>
          <Calendar size={14} style={{ color: c.gold }} />
          <span style={{ fontWeight: 600 }}>Annual leave:</span>
          <input type="number" value={settings.annualLeaveDays} onChange={e => onUpdateSettings({ ...settings, annualLeaveDays: parseInt(e.target.value) || 0 })} style={{ width: 50, padding: "4px 8px", border: `1px solid ${c.border}`, borderRadius: 4, fontFamily: "DM Sans, sans-serif", fontSize: 13, textAlign: "center", color: c.navy, fontWeight: 600 }} />
          <span style={{ color: c.textMuted }}>days/year</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={13} style={{ color: c.gold }} />
          <select value={suggestYear || ""} onChange={e => setSuggestYear(e.target.value ? parseInt(e.target.value) : null)} style={{ padding: "4px 8px", border: `1px solid ${c.border}`, borderRadius: 5, fontFamily: "DM Sans, sans-serif", fontSize: 11, color: c.navy, fontWeight: 600, background: suggestYear ? c.goldLight : "#fff" }}>
            <option value="">Build a Year...</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: c.textMuted }}>
          {plannedTrips.length} planned · {unplannedTrips.length} unplanned
        </div>
      </div>

      {/* Assignment mode banner */}
      {assigningTrip && (
        <div style={{ marginBottom: 16, padding: "12px 16px", background: c.goldLight, borderRadius: 10, border: `1px solid ${c.gold}`, display: "flex", alignItems: "center", gap: 10, fontFamily: "DM Sans, sans-serif", fontSize: 13 }}>
          <span style={{ color: c.gold, fontWeight: 700 }}>Placing:</span>
          <span style={{ color: c.navy, fontWeight: 600 }}>{assigningTrip.name}</span>
          <span style={{ color: c.textMuted }}>— click a month cell to assign</span>
          <span style={{ color: c.textMuted, fontSize: 11 }}>(best months highlighted)</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => setAssigningTrip(null)} style={{ background: "none", border: `1px solid ${c.gold}`, color: c.gold, padding: "4px 12px", borderRadius: 5, fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        </div>
      )}

      {/* Build a Year Suggestions */}
      {suggestYear && (
        <BuildAYearPanel
          year={suggestYear}
          trips={trips}
          settings={settings}
          onAccept={(trip, year, month) => onUpdateTrip({ ...trip, plannedYear: year, plannedMonth: month })}
          onClose={() => setSuggestYear(null)}
        />
      )}

      {/* Main layout: Pool + Grid */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* Unplanned Pool */}
        <UnplannedPool trips={unplannedTrips} assigningTrip={assigningTrip} onStartAssign={setAssigningTrip} />

        {/* Timeline Grid */}
        <div ref={gridRef} style={{ flex: 1, overflowX: "auto", borderRadius: 12, border: `1px solid ${c.border}`, background: c.card }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${years.length}, minmax(160px, 1fr))`, minWidth: years.length * 160 }}>
            {years.map(year => (
              <div key={year} style={{ borderRight: `1px solid ${c.border}` }}>
                {/* Year header */}
                <div style={{ padding: "10px 12px", background: c.navy, color: "#fff", fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 700, textAlign: "center", position: "sticky", top: 0, zIndex: 2 }}>
                  {year}
                  {yearSummaries.find(s => s.year === year)?.trips.length > 0 && (
                    <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 400, opacity: 0.6, display: "block" }}>
                      {yearSummaries.find(s => s.year === year).totalNights}n · £{yearSummaries.find(s => s.year === year).totalCost.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Unscheduled row for year-only trips */}
                {(tripsByYearMonth[`${year}-unscheduled`] || []).length > 0 && (
                  <div style={{ padding: "6px 8px", background: c.cream, borderBottom: `1px solid ${c.border}`, minHeight: 36 }}>
                    <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 9, color: c.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Sometime this year</div>
                    {(tripsByYearMonth[`${year}-unscheduled`] || []).map(t => (
                      <TimelineTripCard key={t.id} trip={t} isSelected={selectedPlacedTrip?.id === t.id} onSelect={() => setSelectedPlacedTrip(selectedPlacedTrip?.id === t.id ? null : t)} onUnassign={() => handleUnassign(t)} onMove={() => handleMove(t)} onEdit={() => onEditTrip(t)} />
                    ))}
                  </div>
                )}

                {/* Month cells */}
                {BEST_MONTHS.map((monthLabel, monthIdx) => {
                  const month = monthIdx + 1;
                  const cellTrips = tripsByYearMonth[`${year}-${month}`] || [];
                  const isBestMonth = assigningTrip?.bestMonths?.includes(month);
                  const isAssigning = !!assigningTrip;

                  return (
                    <MonthCell
                      key={month}
                      year={year}
                      month={month}
                      monthLabel={monthLabel}
                      trips={cellTrips}
                      isBestMonth={isBestMonth}
                      isAssigning={isAssigning}
                      onAssign={() => handleAssign(year, month)}
                      selectedPlacedTrip={selectedPlacedTrip}
                      onSelectTrip={(t) => setSelectedPlacedTrip(selectedPlacedTrip?.id === t.id ? null : t)}
                      onUnassign={handleUnassign}
                      onMove={handleMove}
                      onEdit={onEditTrip}
                      onDropTrip={handleDropTrip}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Year Summary Grid */}
      <YearSummaryGrid yearSummaries={yearSummaries} settings={settings} />
    </div>
  );
}

function UnplannedPool({ trips, assigningTrip, onStartAssign }) {
  const c = useTheme();
  const [poolSearch, setPoolSearch] = useState("");
  const [poolCategory, setPoolCategory] = useState("All");

  const filteredTrips = trips.filter(t => {
    if (poolSearch && !t.name.toLowerCase().includes(poolSearch.toLowerCase()) && !t.destination.toLowerCase().includes(poolSearch.toLowerCase())) return false;
    if (poolCategory !== "All" && t.category !== poolCategory) return false;
    return true;
  });

  const poolCategories = [...new Set(trips.map(t => t.category))].sort();

  return (
    <div style={{ flex: "0 0 260px", maxHeight: "70vh", overflowY: "auto", background: c.card, borderRadius: 12, border: `1px solid ${c.border}`, padding: 0 }}>
      <div style={{ padding: "12px 14px", borderBottom: `1px solid ${c.border}`, position: "sticky", top: 0, background: c.card, zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 600, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>Unplanned</div>
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: c.warmGrey }}>{filteredTrips.length}/{trips.length}</div>
        </div>
        <div style={{ position: "relative", marginBottom: 6 }}>
          <Search size={12} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: c.textMuted }} />
          <input value={poolSearch} onChange={e => setPoolSearch(e.target.value)} placeholder="Search trips..." style={{ width: "100%", padding: "6px 8px 6px 26px", border: `1px solid ${c.border}`, borderRadius: 6, fontFamily: "DM Sans, sans-serif", fontSize: 11, color: c.text, background: c.cream, boxSizing: "border-box", outline: "none" }} />
        </div>
        <select value={poolCategory} onChange={e => setPoolCategory(e.target.value)} style={{ width: "100%", padding: "4px 8px", border: `1px solid ${c.border}`, borderRadius: 5, fontFamily: "DM Sans, sans-serif", fontSize: 10, color: c.text, background: c.card, boxSizing: "border-box" }}>
          <option value="All">All categories</option>
          {poolCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filteredTrips.length === 0 ? (
        <div style={{ padding: 20, textAlign: "center", fontFamily: "DM Sans, sans-serif", fontSize: 12, color: c.textMuted }}>
          {trips.length === 0 ? "All trips are planned!" : "No matching trips"}
        </div>
      ) : (
        <div style={{ padding: 8 }}>
          {filteredTrips.map(trip => {
            const cfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.Dream;
            const isActive = assigningTrip?.id === trip.id;
            return (
              <div
                key={trip.id}
                draggable="true"
                onDragStart={(e) => { e.dataTransfer.setData("text/plain", trip.id.toString()); e.dataTransfer.effectAllowed = "move"; }}
                onClick={() => onStartAssign(isActive ? null : trip)}
                style={{
                  padding: "8px 10px",
                  marginBottom: 4,
                  borderRadius: 8,
                  cursor: "grab",
                  border: isActive ? `2px solid ${c.gold}` : `1px solid transparent`,
                  background: isActive ? c.goldLight : "transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = c.cream; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 600, color: c.navy, lineHeight: 1.2, flex: 1 }}>{trip.name}</span>
                </div>
                <div style={{ display: "flex", gap: 8, fontFamily: "DM Sans, sans-serif", fontSize: 10, color: c.textMuted, marginLeft: 12 }}>
                  <span>{trip.nights}n</span>
                  <span>£{trip.costEstimate?.toLocaleString()}</span>
                  <span style={{ color: c.gold }}>{"★".repeat(trip.priority || 0)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MonthCell({ year, month, monthLabel, trips, isBestMonth, isAssigning, onAssign, selectedPlacedTrip, onSelectTrip, onUnassign, onMove, onEdit, onDropTrip }) {
  const c = useTheme();
  const [dragOver, setDragOver] = useState(false);
  const isEmpty = trips.length === 0;
  const isClickable = isAssigning;

  let bgColor = "#fff";
  if (dragOver) bgColor = "#E3F2FD";
  else if (isAssigning && isBestMonth) bgColor = "#E8F5E9";
  else if (isAssigning && !isBestMonth) bgColor = "#FAFAFA";

  return (
    <div
      onClick={isClickable ? onAssign : undefined}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const tripId = e.dataTransfer.getData("text/plain"); if (tripId && onDropTrip) onDropTrip(tripId, year, month); }}
      style={{
        padding: "4px 8px",
        minHeight: 36,
        borderBottom: `1px solid ${c.border}`,
        background: bgColor,
        cursor: isClickable ? "pointer" : "default",
        transition: "background 0.15s",
        position: "relative",
      }}
      onMouseEnter={e => { if (isClickable) e.currentTarget.style.background = isBestMonth ? "#C8E6C9" : "#F0F0F0"; }}
      onMouseLeave={e => { if (isClickable) e.currentTarget.style.background = bgColor; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: trips.length > 0 ? 4 : 0 }}>
        <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, color: c.textMuted, fontWeight: 500, minWidth: 24 }}>{monthLabel}</span>
        {isAssigning && isBestMonth && <span style={{ fontSize: 8, color: COLORS.booked }}>★ best</span>}
      </div>
      {trips.map(t => (
        <TimelineTripCard key={t.id} trip={t} isSelected={selectedPlacedTrip?.id === t.id} onSelect={() => onSelectTrip(t)} onUnassign={() => onUnassign(t)} onMove={() => onMove(t)} onEdit={() => onEdit(t)} />
      ))}
    </div>
  );
}

function TimelineTripCard({ trip, isSelected, onSelect, onUnassign, onMove, onEdit }) {
  const c = useTheme();
  const cfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.Dream;
  return (
    <div onClick={(e) => { e.stopPropagation(); onSelect(); }} style={{ padding: "5px 8px", borderRadius: 6, background: isSelected ? c.navy : cfg.color + "15", borderLeft: `3px solid ${cfg.color}`, marginBottom: 3, cursor: "pointer", transition: "all 0.12s" }}>
      <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 600, color: isSelected ? "#fff" : c.navy, lineHeight: 1.2 }}>{trip.name}</div>
      <div style={{ display: "flex", gap: 6, fontFamily: "DM Sans, sans-serif", fontSize: 9, color: isSelected ? "rgba(255,255,255,0.7)" : c.textMuted, marginTop: 1 }}>
        <span>{trip.nights}n</span>
        <span>£{trip.costEstimate?.toLocaleString()}</span>
      </div>
      {isSelected && (
        <div style={{ display: "flex", gap: 4, marginTop: 4 }} onClick={e => e.stopPropagation()}>
          <button onClick={onEdit} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 4, padding: "2px 6px", cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 9, fontWeight: 600 }}>Edit</button>
          <button onClick={onMove} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 4, padding: "2px 6px", cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 9, fontWeight: 600 }}>Move</button>
          <button onClick={onUnassign} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 4, padding: "2px 6px", cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 9, fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}><RotateCcw size={8} /> Remove</button>
        </div>
      )}
    </div>
  );
}

function YearSummaryGrid({ yearSummaries, settings }) {
  const c = useTheme();
  const activeYears = yearSummaries.filter(s => s.trips.length > 0);
  if (activeYears.length === 0) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 600, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Year Overview</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        {yearSummaries.map(ys => (
          <div key={ys.year} style={{ background: c.card, borderRadius: 10, border: `1px solid ${ys.isOvercommitted ? "#DC262640" : c.border}`, padding: "14px 16px", opacity: ys.trips.length === 0 ? 0.45 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 700, color: c.navy }}>{ys.year}</span>
              <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: c.textMuted }}>{ys.trips.length} trip{ys.trips.length !== 1 ? "s" : ""}</span>
            </div>

            <LeaveBar used={ys.leaveDaysUsed} available={ys.leaveDaysAvailable} />

            <div style={{ display: "flex", gap: 12, fontFamily: "DM Sans, sans-serif", fontSize: 11, color: c.textMuted, marginTop: 8 }}>
              <span>{ys.totalNights} nights</span>
              <span>£{ys.totalCost.toLocaleString()}</span>
            </div>

            {ys.isOvercommitted && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, fontFamily: "DM Sans, sans-serif", fontSize: 10, color: "#DC2626", fontWeight: 600 }}>
                <AlertTriangle size={10} /> Over leave budget
              </div>
            )}

            {ys.trips.length > 0 && (
              <div style={{ marginTop: 8, borderTop: `1px solid ${c.border}`, paddingTop: 8 }}>
                {ys.trips.sort((a, b) => (a.plannedMonth || 13) - (b.plannedMonth || 13)).map(t => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0", fontFamily: "DM Sans, sans-serif", fontSize: 11 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_CONFIG[t.status]?.color, flexShrink: 0 }} />
                    <span style={{ color: c.navy, fontWeight: 500, flex: 1 }}>{t.name}</span>
                    <span style={{ color: c.textMuted, fontSize: 10 }}>{t.plannedMonth ? BEST_MONTHS[t.plannedMonth - 1] : "TBD"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaveBar({ used, available }) {
  const c = useTheme();
  const pct = available > 0 ? Math.min((used / available) * 100, 120) : 0;
  const fillPct = Math.min(pct, 100);
  let barColor = COLORS.booked;
  if (pct >= 100) barColor = "#DC2626";
  else if (pct >= 80) barColor = c.gold;

  return (
    <div>
      <div style={{ height: 6, background: c.sand, borderRadius: 3, overflow: "hidden", position: "relative" }}>
        <div style={{ height: "100%", width: `${fillPct}%`, background: barColor, borderRadius: 3, transition: "width 0.3s, background 0.3s" }} />
      </div>
      <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, color: c.textMuted, marginTop: 3 }}>
        {used} / {available} leave days
      </div>
    </div>
  );
}

/* ============================================================
   IN SEASON BANNER
   ============================================================ */

function InSeasonBanner({ trips }) {
  const c = useTheme();
  const currentMonth = new Date().getMonth() + 1;
  const inSeason = trips.filter(t => t.bestMonths?.includes(currentMonth) && t.status !== "Done");
  if (inSeason.length === 0) return null;

  return (
    <div style={{ marginBottom: 20, padding: "14px 18px", background: `linear-gradient(135deg, ${COLORS.booked}12, ${c.gold}18)`, borderRadius: 12, border: `1px solid ${COLORS.booked}30` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 16 }}>☀️</span>
        <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 600, color: c.navy }}>In Season Now — {BEST_MONTHS[currentMonth - 1]}</span>
        <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: c.textMuted }}>{inSeason.length} trip{inSeason.length !== 1 ? "s" : ""} in their ideal window</span>
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {inSeason.sort((a, b) => b.priority - a.priority).map(trip => {
          const cfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.Dream;
          return (
            <div key={trip.id} style={{ flexShrink: 0, padding: "8px 14px", background: c.card, borderRadius: 8, border: `1px solid ${c.border}`, borderLeft: `3px solid ${cfg.color}`, fontFamily: "DM Sans, sans-serif" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.navy, marginBottom: 2 }}>{trip.name}</div>
              <div style={{ fontSize: 10, color: c.textMuted, display: "flex", gap: 8 }}>
                <span>{trip.nights}n</span>
                <span>£{trip.costEstimate?.toLocaleString()}</span>
                <span style={{ color: c.gold }}>{"★".repeat(trip.priority || 0)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   BUDGET PANEL
   ============================================================ */

function BudgetPanel({ trips, savings, onUpdateSavings }) {
  const c = useTheme();
  const byCategory = {};
  trips.forEach(t => {
    const cat = t.category || "Other";
    byCategory[cat] = (byCategory[cat] || 0) + (t.costEstimate || 0);
  });
  const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const maxCategoryCost = Math.max(...categoryEntries.map(e => e[1]), 1);

  const byYear = {};
  trips.filter(t => t.plannedYear).forEach(t => {
    byYear[t.plannedYear] = (byYear[t.plannedYear] || 0) + (t.costEstimate || 0);
  });
  const yearEntries = Object.entries(byYear).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  const maxYearCost = Math.max(...yearEntries.map(e => e[1]), 1);

  const totalBudget = trips.reduce((s, t) => s + (t.costEstimate || 0), 0);
  const plannedBudget = trips.filter(t => t.plannedYear).reduce((s, t) => s + (t.costEstimate || 0), 0);
  const avgCost = trips.length > 0 ? Math.round(totalBudget / trips.length) : 0;
  const mostExpensive = trips.reduce((max, t) => (t.costEstimate || 0) > (max?.costEstimate || 0) ? t : max, trips[0]);
  const cheapest = trips.reduce((min, t) => (t.costEstimate || 0) < (min?.costEstimate || Infinity) ? t : min, trips[0]);

  return (
    <div style={{ marginBottom: 24, background: c.card, borderRadius: 12, border: `1px solid ${c.border}`, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      {/* Quick stats row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total Budget", value: `£${totalBudget.toLocaleString()}`, color: c.navy },
          { label: "Avg per Trip", value: `£${avgCost.toLocaleString()}`, color: c.gold },
          { label: "Most Expensive", value: mostExpensive ? `${mostExpensive.name} (£${mostExpensive.costEstimate?.toLocaleString()})` : "—", color: "#DC2626" },
          { label: "Best Value", value: cheapest ? `${cheapest.name} (£${cheapest.costEstimate?.toLocaleString()})` : "—", color: COLORS.booked },
        ].map(stat => (
          <div key={stat.label} style={{ flex: "1 1 180px", padding: "10px 14px", background: c.cream, borderRadius: 8 }}>
            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 600, color: c.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>{stat.label}</div>
            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
        {/* Category breakdown */}
        <div style={{ flex: "1 1 300px" }}>
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 600, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>By Category</div>
          {categoryEntries.map(([cat, cost]) => (
            <div key={cat} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "DM Sans, sans-serif", fontSize: 12, marginBottom: 3 }}>
                <span style={{ color: c.text, fontWeight: 500 }}>{cat}</span>
                <span style={{ color: c.navy, fontWeight: 600 }}>£{cost.toLocaleString()}</span>
              </div>
              <div style={{ height: 6, background: c.sand, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(cost / maxCategoryCost) * 100}%`, background: c.gold, borderRadius: 3, transition: "width 0.3s" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Year breakdown */}
        {yearEntries.length > 0 && (
          <div style={{ flex: "1 1 300px" }}>
            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 600, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Planned by Year</div>
            {yearEntries.map(([year, cost]) => (
              <div key={year} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "DM Sans, sans-serif", fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: c.text, fontWeight: 500 }}>{year}</span>
                  <span style={{ color: c.navy, fontWeight: 600 }}>£{cost.toLocaleString()}</span>
                </div>
                <div style={{ height: 6, background: c.sand, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(cost / maxYearCost) * 100}%`, background: COLORS.booked, borderRadius: 3, transition: "width 0.3s" }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 8, fontFamily: "DM Sans, sans-serif", fontSize: 12, color: c.navy, fontWeight: 700 }}>
              Planned: £{plannedBudget.toLocaleString()} <span style={{ fontWeight: 400, color: c.textMuted }}>of £{totalBudget.toLocaleString()} total</span>
            </div>
          </div>
        )}
      </div>

      {/* Savings Tracker */}
      {savings && onUpdateSavings && (
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${c.border}` }}>
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 600, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Wallet size={12} /> Savings Tracker
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12 }}>
              <span style={{ color: c.textMuted }}>Saved so far: </span>
              <span style={{ color: c.navy, fontWeight: 600 }}>£</span>
              <input type="number" value={savings.totalSaved} onChange={e => onUpdateSavings({ ...savings, totalSaved: parseInt(e.target.value) || 0 })} style={{ width: 70, padding: "3px 6px", border: `1px solid ${c.border}`, borderRadius: 4, fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 700, color: c.navy, textAlign: "right" }} />
            </div>
            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12 }}>
              <span style={{ color: c.textMuted }}>Monthly saving: </span>
              <span style={{ color: c.navy, fontWeight: 600 }}>£</span>
              <input type="number" value={savings.monthlySaving} onChange={e => onUpdateSavings({ ...savings, monthlySaving: parseInt(e.target.value) || 0 })} style={{ width: 60, padding: "3px 6px", border: `1px solid ${c.border}`, borderRadius: 4, fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 700, color: c.navy, textAlign: "right" }} />
            </div>
          </div>
          {(() => {
            const savingsPct = plannedBudget > 0 ? Math.min((savings.totalSaved / plannedBudget) * 100, 100) : 0;
            const remaining = Math.max(plannedBudget - savings.totalSaved, 0);
            const monthsToGo = savings.monthlySaving > 0 ? Math.ceil(remaining / savings.monthlySaving) : null;
            const fundedDate = monthsToGo !== null ? new Date(Date.now() + monthsToGo * 30.44 * 24 * 60 * 60 * 1000) : null;
            return (
              <div>
                <div style={{ height: 8, background: c.sand, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ height: "100%", width: `${savingsPct}%`, background: savingsPct >= 100 ? COLORS.booked : c.gold, borderRadius: 4, transition: "width 0.3s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "DM Sans, sans-serif", fontSize: 11 }}>
                  <span style={{ color: c.textMuted }}>£{savings.totalSaved.toLocaleString()} of £{plannedBudget.toLocaleString()} planned</span>
                  {fundedDate && remaining > 0 && (
                    <span style={{ color: COLORS.booked, fontWeight: 600 }}>Fully funded by {BEST_MONTHS[fundedDate.getMonth()]} {fundedDate.getFullYear()}</span>
                  )}
                  {remaining === 0 && <span style={{ color: COLORS.booked, fontWeight: 700 }}>Fully funded!</span>}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   DELETE TOAST
   ============================================================ */

function DeleteToast({ trip, onUndo }) {
  const c = useTheme();
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: c.navy, color: "#fff", padding: "12px 20px", borderRadius: 10, display: "flex", alignItems: "center", gap: 12, fontFamily: "DM Sans, sans-serif", fontSize: 13, boxShadow: "0 8px 30px rgba(0,0,0,0.3)", zIndex: 2000 }}>
      <Trash2 size={14} style={{ opacity: 0.7 }} />
      <span><strong>{trip.name}</strong> deleted</span>
      <button onClick={onUndo} style={{ background: c.gold, color: c.navy, border: "none", padding: "5px 12px", borderRadius: 5, fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
        <Undo2 size={12} /> Undo
      </button>
    </div>
  );
}

/* ============================================================
   BUILD A YEAR PANEL
   ============================================================ */

function BuildAYearPanel({ year, trips, settings, onAccept, onClose }) {
  const c = useTheme();
  const unplanned = trips.filter(t => !t.plannedYear && t.status !== "Done");
  const yearTrips = trips.filter(t => t.plannedYear === year);
  const usedLeave = yearTrips.reduce((s, t) => s + (t.nights || 0), 0);
  const remainingLeave = settings.annualLeaveDays - usedLeave;
  const usedBudget = yearTrips.reduce((s, t) => s + (t.costEstimate || 0), 0);

  // Score each unplanned trip for this year
  const scored = unplanned
    .map(t => {
      // Find a best month not already heavily booked
      const occupiedMonths = yearTrips.map(yt => yt.plannedMonth).filter(Boolean);
      const bestMonth = t.bestMonths?.find(m => !occupiedMonths.includes(m)) || t.bestMonths?.[0] || null;
      const hasBestMonth = !!bestMonth;
      const score = (t.priority || 1) * (hasBestMonth ? 2 : 0.8);
      return { trip: t, bestMonth, score, hasBestMonth };
    })
    .filter(s => (s.trip.nights || 0) <= remainingLeave)
    .sort((a, b) => b.score - a.score);

  // Greedy selection
  let leaveLeft = remainingLeave;
  const recommended = [];
  for (const s of scored) {
    if ((s.trip.nights || 0) <= leaveLeft) {
      recommended.push(s);
      leaveLeft -= (s.trip.nights || 0);
    }
  }

  const suggestedNights = recommended.reduce((s, r) => s + (r.trip.nights || 0), 0);
  const suggestedCost = recommended.reduce((s, r) => s + (r.trip.costEstimate || 0), 0);

  return (
    <div style={{ marginBottom: 16, padding: "16px 20px", background: c.cream, borderRadius: 12, border: `1px solid ${c.gold}40` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Sparkles size={16} style={{ color: c.gold }} />
        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 700, color: c.navy }}>Build {year}</span>
        <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: c.textMuted }}>
          {remainingLeave} leave days remaining · £{usedBudget.toLocaleString()} already committed
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: c.textMuted, padding: 4 }}><X size={16} /></button>
      </div>

      {recommended.length === 0 ? (
        <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: c.textMuted, textAlign: "center", padding: 20 }}>
          {unplanned.length === 0 ? "All trips are already planned!" : "No trips fit the remaining leave budget."}
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {recommended.map(({ trip, bestMonth, hasBestMonth }) => {
              const cfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.Dream;
              return (
                <div key={trip.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: c.card, borderRadius: 8, border: `1px solid ${c.border}`, borderLeft: `3px solid ${cfg.color}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 600, color: c.navy }}>{trip.name}</div>
                    <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: c.textMuted, marginTop: 1 }}>
                      {trip.destination} · {trip.nights}n · £{trip.costEstimate?.toLocaleString()} · {"★".repeat(trip.priority || 0)}
                    </div>
                  </div>
                  {bestMonth && (
                    <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: hasBestMonth ? COLORS.booked : c.textMuted, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                      {BEST_MONTHS[bestMonth - 1]} {hasBestMonth && "★"}
                    </span>
                  )}
                  <button onClick={() => onAccept(trip, year, bestMonth)} style={{ background: c.navy, color: "#fff", border: "none", padding: "6px 14px", borderRadius: 6, fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                    + Add
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 12, alignItems: "center" }}>
            <button
              onClick={() => recommended.forEach(({ trip, bestMonth }) => onAccept(trip, year, bestMonth))}
              style={{ background: c.gold, color: c.navy, border: "none", padding: "10px 20px", borderRadius: 8, fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Sparkles size={14} /> Accept All
            </button>
            <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: c.textMuted }}>
              {recommended.length} trips · {suggestedNights} nights · £{suggestedCost.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   COMPARISON PANEL
   ============================================================ */

function ComparisonPanel({ trips, onClear }) {
  const c = useTheme();
  if (trips.length < 2) return null;
  const metrics = [
    { key: "costEstimate", label: "Cost", fmt: v => `£${(v || 0).toLocaleString()}`, best: "low" },
    { key: "nights", label: "Nights", fmt: v => `${v || 0}`, best: "none" },
    { key: "priority", label: "Priority", fmt: v => "★".repeat(v || 0), best: "high" },
    { key: "bestMonths", label: "Best Months", fmt: v => (v || []).map(m => BEST_MONTHS[m - 1]).join(", ") || "—", best: "none" },
    { key: "category", label: "Category", fmt: v => v || "—", best: "none" },
    { key: "people", label: "Who", fmt: v => v || "—", best: "none" },
  ];

  return (
    <div style={{ marginBottom: 24, background: c.card, borderRadius: 12, border: `1px solid ${c.gold}40`, padding: 20, boxShadow: `0 4px 16px ${c.gold}15` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 700, color: c.navy, display: "flex", alignItems: "center", gap: 6 }}>
          <Columns size={15} /> Comparing {trips.length} trips
        </div>
        <button onClick={onClear} style={{ background: "none", border: `1px solid ${c.border}`, color: c.textMuted, padding: "4px 12px", borderRadius: 5, fontFamily: "DM Sans, sans-serif", fontSize: 11, cursor: "pointer" }}>Clear</button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "DM Sans, sans-serif", fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: `2px solid ${c.border}`, color: c.textMuted, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}></th>
              {trips.map(t => {
                const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.Dream;
                return (
                  <th key={t.id} style={{ textAlign: "center", padding: "8px 12px", borderBottom: `2px solid ${cfg.color}`, minWidth: 140 }}>
                    <div style={{ color: c.navy, fontWeight: 700, fontSize: 13 }}>{t.name}</div>
                    <div style={{ color: c.textMuted, fontWeight: 400, fontSize: 11 }}>{t.destination}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {metrics.map(m => {
              const values = trips.map(t => t[m.key]);
              const numValues = values.map(v => typeof v === "number" ? v : null).filter(v => v !== null);
              const bestVal = m.best === "low" ? Math.min(...numValues) : m.best === "high" ? Math.max(...numValues) : null;
              return (
                <tr key={m.key}>
                  <td style={{ padding: "8px 12px", borderBottom: `1px solid ${c.border}`, color: c.textMuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>{m.label}</td>
                  {trips.map(t => {
                    const val = t[m.key];
                    const isBest = bestVal !== null && val === bestVal;
                    return (
                      <td key={t.id} style={{ padding: "8px 12px", borderBottom: `1px solid ${c.border}`, textAlign: "center", color: isBest ? COLORS.booked : c.navy, fontWeight: isBest ? 700 : 500, background: isBest ? `${COLORS.booked}08` : "transparent" }}>
                        {m.fmt(val)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   RANDOM PICKER
   ============================================================ */

function RandomPicker({ trips, onClose, onSelect }) {
  const c = useTheme();
  const [spinning, setSpinning] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!spinning || trips.length === 0) return;
    let speed = 50;
    let elapsed = 0;
    const maxTime = 3000;
    let timeout;

    const tick = () => {
      elapsed += speed;
      setCurrentIdx(prev => (prev + 1) % trips.length);
      if (elapsed >= maxTime) {
        const finalIdx = Math.floor(Math.random() * trips.length);
        setCurrentIdx(finalIdx);
        setResult(trips[finalIdx]);
        setSpinning(false);
        return;
      }
      // Gradually slow down
      speed = 50 + Math.pow(elapsed / maxTime, 2) * 250;
      timeout = setTimeout(tick, speed);
    };

    timeout = setTimeout(tick, speed);
    return () => clearTimeout(timeout);
  }, [spinning, trips]);

  const respin = () => {
    setSpinning(true);
    setResult(null);
  };

  if (trips.length === 0) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }} onClick={onClose}>
        <div onClick={e => e.stopPropagation()} style={{ background: c.bg, borderRadius: 16, padding: 40, textAlign: "center", fontFamily: "DM Sans, sans-serif" }}>
          <p style={{ fontSize: 14, color: c.textMuted }}>No trips to pick from!</p>
          <button onClick={onClose} style={{ marginTop: 16, background: c.navy, color: "#fff", border: "none", padding: "8px 20px", borderRadius: 8, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    );
  }

  const displayTrip = result || trips[currentIdx];
  const cfg = STATUS_CONFIG[displayTrip?.status] || STATUS_CONFIG.Dream;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: c.bg, borderRadius: 20, width: 380, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
        {/* Gradient header */}
        <div style={{ height: 80, background: CATEGORY_GRADIENTS[displayTrip?.category] || c.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shuffle size={32} style={{ color: "rgba(255,255,255,0.7)" }} />
        </div>

        <div style={{ padding: "24px 28px", textAlign: "center" }}>
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: c.textMuted, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
            {spinning ? "Spinning..." : "Your next adventure"}
          </div>

          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, color: c.navy, margin: "0 0 4px", transition: "all 0.1s" }}>
            {displayTrip?.name}
          </h2>
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: c.textMuted, margin: "0 0 16px" }}>
            {displayTrip?.destination}
          </p>

          {result && (
            <div style={{ display: "flex", gap: 12, justifyContent: "center", fontFamily: "DM Sans, sans-serif", fontSize: 12, color: c.textMuted, marginBottom: 20 }}>
              <span style={{ padding: "4px 10px", background: cfg.color + "15", borderRadius: 5, color: cfg.color, fontWeight: 600 }}>{cfg.emoji} {result.status}</span>
              <span>£{result.costEstimate?.toLocaleString()}</span>
              <span>{result.nights}n</span>
              <span style={{ color: c.gold }}>{"★".repeat(result.priority || 0)}</span>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {result && (
              <>
                <button onClick={() => onSelect(result)} style={{ background: c.navy, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Show on Map</button>
                <button onClick={respin} style={{ background: c.goldLight, color: c.navy, border: "none", padding: "10px 20px", borderRadius: 8, fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <Shuffle size={14} /> Again
                </button>
              </>
            )}
            <button onClick={onClose} style={{ background: "none", border: `1px solid ${c.border}`, color: c.textMuted, padding: "10px 16px", borderRadius: 8, fontFamily: "DM Sans, sans-serif", fontSize: 13, cursor: "pointer" }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimatedStats({ trips, countries, totalNights, totalCost }) {
  const c = useTheme();
  const animTrips = useAnimatedNumber(trips.length);
  const animCountries = useAnimatedNumber(countries);
  const animNights = useAnimatedNumber(totalNights);
  const animCost = useAnimatedNumber(totalCost);
  const booked = trips.filter(t => t.status === "Booked" || t.status === "Done").length;
  const animBooked = useAnimatedNumber(booked);

  const stats = [
    { label: "Trips", value: animTrips },
    { label: "Destinations", value: animCountries },
    { label: "Nights", value: animNights },
    { label: "Budget", value: `£${animCost.toLocaleString()}` },
    { label: "Confirmed", value: animBooked },
  ];

  return (
    <div style={{ display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap" }}>
      {stats.map(s => (
        <div key={s.label} style={{ fontFamily: "DM Sans, sans-serif" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: c.gold, lineHeight: 1 }}>{s.value}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function ConfettiEffect() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confettiColors = ["#C8A951", "#7C9EB2", "#6B9B76", "#9B8BB4", "#E8DFD0", "#DC7633", "#E74C3C", "#5DADE2", "#48C9B0", "#AF7AC5"];
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * -1,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 3,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
      opacity: 1,
    }));

    let raf;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.rot += p.rotSpeed;
        p.vx *= 0.99;
        if (p.y > canvas.height * 0.7) p.opacity -= 0.02;
        if (p.opacity <= 0) return;
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (alive) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }} />;
}

function DashboardView({ trips, savings, onUpdateSavings, unlockedAchievements = [] }) {
  const c = useTheme();
  const donutRef = useRef(null);
  const radarRef = useRef(null);

  const statusCounts = Object.keys(STATUS_CONFIG).map(s => ({
    status: s,
    count: trips.filter(t => t.status === s).length,
    color: STATUS_CONFIG[s].color,
    emoji: STATUS_CONFIG[s].emoji,
  })).filter(s => s.count > 0);

  const totalCost = trips.reduce((s, t) => s + (t.costEstimate || 0), 0);
  const totalNights = trips.reduce((s, t) => s + (t.nights || 0), 0);
  const avgCostPerNight = totalNights > 0 ? Math.round(totalCost / totalNights) : 0;
  const bookedCost = trips.filter(t => t.status === "Booked" || t.status === "Done").reduce((s, t) => s + (t.costEstimate || 0), 0);
  const plannedTrips = trips.filter(t => t.plannedYear);
  const topCategory = [...trips.reduce((m, t) => { m.set(t.category, (m.get(t.category) || 0) + 1); return m; }, new Map()).entries()].sort((a, b) => b[1] - a[1])[0];

  // Month heatmap data
  const monthHeat = BEST_MONTHS.map((label, i) => {
    const count = trips.filter(t => t.bestMonths?.includes(i + 1)).length;
    return { label, month: i + 1, count };
  });
  const maxHeat = Math.max(...monthHeat.map(m => m.count), 1);

  // D3 donut chart
  useEffect(() => {
    if (!donutRef.current || statusCounts.length === 0) return;
    const svg = d3.select(donutRef.current);
    svg.selectAll("*").remove();
    const size = 200, radius = size / 2;
    const g = svg.attr("width", size).attr("height", size).append("g").attr("transform", `translate(${radius},${radius})`);
    const pie = d3.pie().value(d => d.count).sort(null).padAngle(0.03);
    const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius - 4);
    g.selectAll("path").data(pie(statusCounts)).enter().append("path")
      .attr("d", arc).attr("fill", d => d.data.color).attr("stroke", c.card).attr("stroke-width", 2)
      .style("transition", "opacity 0.2s")
      .on("mouseenter", function() { d3.select(this).attr("opacity", 0.8); })
      .on("mouseleave", function() { d3.select(this).attr("opacity", 1); });
    // Center text
    g.append("text").attr("text-anchor", "middle").attr("dy", -6).attr("font-family", "Playfair Display, Georgia, serif").attr("font-size", 28).attr("font-weight", 700).attr("fill", c.text).text(trips.length);
    g.append("text").attr("text-anchor", "middle").attr("dy", 14).attr("font-family", "DM Sans, sans-serif").attr("font-size", 11).attr("fill", c.textMuted).text("trips");
  }, [statusCounts, trips.length, c]);

  // Season radar chart
  useEffect(() => {
    if (!radarRef.current) return;
    const svg = d3.select(radarRef.current);
    svg.selectAll("*").remove();
    const size = 220, cx = size / 2, cy = size / 2, maxR = size / 2 - 30;
    svg.attr("width", size).attr("height", size);

    const angles = monthHeat.map((_, i) => (i / 12) * 2 * Math.PI - Math.PI / 2);

    // Concentric rings
    [0.25, 0.5, 0.75, 1].forEach(frac => {
      svg.append("circle").attr("cx", cx).attr("cy", cy).attr("r", maxR * frac).attr("fill", "none").attr("stroke", c.border).attr("stroke-width", 0.5);
    });

    // Axis lines + labels
    monthHeat.forEach((m, i) => {
      const a = angles[i];
      const x2 = cx + Math.cos(a) * maxR;
      const y2 = cy + Math.sin(a) * maxR;
      svg.append("line").attr("x1", cx).attr("y1", cy).attr("x2", x2).attr("y2", y2).attr("stroke", c.border).attr("stroke-width", 0.5);
      const lx = cx + Math.cos(a) * (maxR + 14);
      const ly = cy + Math.sin(a) * (maxR + 14);
      svg.append("text").attr("x", lx).attr("y", ly).attr("text-anchor", "middle").attr("dominant-baseline", "central").attr("font-family", "DM Sans, sans-serif").attr("font-size", 9).attr("fill", c.textMuted).attr("font-weight", 600).text(m.label);
    });

    // Data polygon
    const points = monthHeat.map((m, i) => {
      const r = (m.count / maxHeat) * maxR;
      return [cx + Math.cos(angles[i]) * r, cy + Math.sin(angles[i]) * r];
    });
    svg.append("polygon").attr("points", points.map(p => p.join(",")).join(" ")).attr("fill", c.gold + "25").attr("stroke", c.gold).attr("stroke-width", 2);

    // Data dots
    points.forEach(p => {
      svg.append("circle").attr("cx", p[0]).attr("cy", p[1]).attr("r", 3).attr("fill", c.gold).attr("stroke", c.card).attr("stroke-width", 1.5);
    });
  }, [monthHeat, maxHeat, c]);

  // Category breakdown for mini bars
  const catData = CATEGORIES.map(cat => ({
    cat,
    count: trips.filter(t => t.category === cat).length,
    cost: trips.filter(t => t.category === cat).reduce((s, t) => s + (t.costEstimate || 0), 0),
  })).filter(d => d.count > 0).sort((a, b) => b.count - a.count);
  const maxCatCount = Math.max(...catData.map(d => d.count), 1);

  const cardStyle = { background: c.card, borderRadius: 12, border: `1px solid ${c.border}`, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" };
  const headingStyle = { fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 600, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
      {/* Status Donut */}
      <div style={cardStyle}>
        <div style={headingStyle}>Trip Status</div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg ref={donutRef} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {statusCounts.map(s => (
              <div key={s.status} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "DM Sans, sans-serif", fontSize: 13 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ color: c.text, fontWeight: 500 }}>{s.emoji} {s.status}</span>
                <span style={{ color: c.textMuted, marginLeft: "auto" }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Season Radar */}
      <div style={cardStyle}>
        <div style={headingStyle}>Best Travel Months</div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <svg ref={radarRef} />
        </div>
      </div>

      {/* Key Metrics */}
      <div style={cardStyle}>
        <div style={headingStyle}>At a Glance</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Total Budget", value: `£${totalCost.toLocaleString()}`, color: c.text },
            { label: "Confirmed Spend", value: `£${bookedCost.toLocaleString()}`, color: COLORS.booked },
            { label: "Avg £/Night", value: `£${avgCostPerNight}`, color: c.gold },
            { label: "Total Nights", value: totalNights, color: c.text },
            { label: "Planned", value: `${plannedTrips.length} / ${trips.length}`, color: COLORS.planning },
            { label: "Top Category", value: topCategory?.[0] || "—", color: c.textMuted },
          ].map(m => (
            <div key={m.label} style={{ background: c.bg, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, color: c.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 16, fontWeight: 700, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Month Heatmap */}
      <div style={cardStyle}>
        <div style={headingStyle}>Season Heatmap</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
          {monthHeat.map(m => {
            const intensity = m.count / maxHeat;
            const bg = intensity > 0 ? `rgba(200, 169, 81, ${0.15 + intensity * 0.6})` : c.bg;
            return (
              <div key={m.label} style={{ borderRadius: 8, padding: "10px 0", textAlign: "center", background: bg, transition: "background 0.2s" }}>
                <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 600, color: intensity > 0.5 ? c.navy : c.textMuted }}>{m.label}</div>
                <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 16, fontWeight: 700, color: intensity > 0.5 ? c.navy : c.textMuted, marginTop: 2 }}>{m.count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown */}
      <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
        <div style={headingStyle}>Category Breakdown</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {catData.map(d => (
            <div key={d.cat} style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "DM Sans, sans-serif" }}>
              <div style={{ width: 100, fontSize: 12, color: c.text, fontWeight: 500, flexShrink: 0 }}>{d.cat}</div>
              <div style={{ flex: 1, height: 20, background: c.bg, borderRadius: 6, overflow: "hidden", position: "relative" }}>
                <div style={{ width: `${(d.count / maxCatCount) * 100}%`, height: "100%", background: CATEGORY_GRADIENTS[d.cat] || c.gold, borderRadius: 6, transition: "width 0.5s ease-out" }} />
              </div>
              <div style={{ fontSize: 12, color: c.textMuted, width: 50, textAlign: "right" }}>{d.count} trips</div>
              <div style={{ fontSize: 11, color: c.textMuted, width: 70, textAlign: "right" }}>£{d.cost.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
        <div style={headingStyle}>Achievements — {unlockedAchievements.length}/{ACHIEVEMENTS.length} Unlocked</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
          {ACHIEVEMENTS.map(a => {
            const unlocked = unlockedAchievements.includes(a.id);
            return (
              <div key={a.id} style={{ background: unlocked ? c.gold + "12" : c.bg, borderRadius: 10, padding: "14px 12px", textAlign: "center", border: `1px solid ${unlocked ? c.gold + "30" : c.border}`, opacity: unlocked ? 1 : 0.45, transition: "all 0.2s" }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{a.icon}</div>
                <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 700, color: unlocked ? c.text : c.textMuted, marginBottom: 2 }}>{a.label}</div>
                <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, color: c.textMuted, lineHeight: 1.3 }}>{a.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Savings Tracker */}
      <div style={cardStyle}>
        <div style={headingStyle}>Savings Progress</div>
        <div style={{ fontFamily: "DM Sans, sans-serif" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: c.gold }}>£{(savings.totalSaved || 0).toLocaleString()}</span>
            <span style={{ fontSize: 12, color: c.textMuted }}>of £{totalCost.toLocaleString()}</span>
          </div>
          <div style={{ height: 8, background: c.bg, borderRadius: 4, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ width: `${Math.min(100, ((savings.totalSaved || 0) / (totalCost || 1)) * 100)}%`, height: "100%", background: `linear-gradient(90deg, ${c.gold}, ${COLORS.booked})`, borderRadius: 4, transition: "width 0.5s" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, color: c.textMuted, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 4 }}>Saved</label>
              <input type="number" value={savings.totalSaved || 0} onChange={e => onUpdateSavings({ ...savings, totalSaved: parseInt(e.target.value) || 0 })} style={{ width: "100%", padding: "6px 10px", border: `1px solid ${c.border}`, borderRadius: 6, fontFamily: "DM Sans, sans-serif", fontSize: 13, background: c.card, color: c.text, boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, color: c.textMuted, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 4 }}>Monthly</label>
              <input type="number" value={savings.monthlySaving || 0} onChange={e => onUpdateSavings({ ...savings, monthlySaving: parseInt(e.target.value) || 0 })} style={{ width: "100%", padding: "6px 10px", border: `1px solid ${c.border}`, borderRadius: 6, fontFamily: "DM Sans, sans-serif", fontSize: 13, background: c.card, color: c.text, boxSizing: "border-box" }} />
            </div>
          </div>
          {savings.monthlySaving > 0 && (
            <div style={{ marginTop: 12, fontSize: 12, color: c.textMuted, textAlign: "center" }}>
              {Math.ceil(((totalCost - (savings.totalSaved || 0)) / savings.monthlySaving))} months to fully funded
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TripDetailModal({ trip, allTrips, onEdit, onDelete, onClose, onSelectTrip, onToggleChecklist }) {
  const c = useTheme();
  useEffect(() => {
    if (!trip) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [trip, onClose]);

  if (!trip) return null;
  const cfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.Dream;
  const related = findRelatedTrips(trip, allTrips);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: c.card, borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", boxShadow: "0 32px 100px rgba(0,0,0,0.5)" }}>
        {/* Hero photo */}
        <div style={{ height: 240, position: "relative", overflow: "hidden", borderRadius: "20px 20px 0 0" }}>
          <img src={getTripImage(trip)} alt={trip.destination} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)" }} />
          <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 8px", cursor: "pointer", backdropFilter: "blur(8px)" }}><X size={18} /></button>
          <div style={{ position: "absolute", bottom: 20, left: 24, right: 24 }}>
            <span style={{ display: "inline-block", background: cfg.color, color: "#fff", fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{cfg.emoji} {trip.status}</span>
            <h2 style={{ color: "#fff", fontSize: 26, margin: "0 0 4px", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>{trip.name}</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", fontFamily: "DM Sans, sans-serif", fontSize: 13, margin: 0 }}>{trip.destination}</p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px" }}>
          {/* Quick stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
            <div style={{ background: c.bg, borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
              <PoundSterling size={14} style={{ color: c.gold, marginBottom: 4 }} />
              <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 15, fontWeight: 700, color: c.text }}>£{trip.costEstimate?.toLocaleString() || "TBD"}</div>
              <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 9, color: c.textMuted, textTransform: "uppercase" }}>Budget</div>
            </div>
            <div style={{ background: c.bg, borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
              <Calendar size={14} style={{ color: COLORS.dream, marginBottom: 4 }} />
              <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 15, fontWeight: 700, color: c.text }}>{trip.nights || "—"}</div>
              <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 9, color: c.textMuted, textTransform: "uppercase" }}>Nights</div>
            </div>
            <div style={{ background: c.bg, borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
              <Star size={14} style={{ color: c.gold, marginBottom: 4 }} />
              <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 15, fontWeight: 700, color: c.gold }}>{"★".repeat(trip.priority || 0)}</div>
              <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 9, color: c.textMuted, textTransform: "uppercase" }}>Priority</div>
            </div>
            <div style={{ background: c.bg, borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
              <Plane size={14} style={{ color: COLORS.dream, marginBottom: 4 }} />
              <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 15, fontWeight: 700, color: c.text }}>{getFlightHours(trip) ? `${getFlightHours(trip)}h` : "—"}</div>
              <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 9, color: c.textMuted, textTransform: "uppercase" }}>Flight</div>
            </div>
          </div>

          {/* Best months */}
          {trip.bestMonths?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 600, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Best Months</div>
              <div style={{ display: "flex", gap: 4 }}>
                {BEST_MONTHS.map((m, i) => {
                  const active = trip.bestMonths.includes(i + 1);
                  return <div key={m} style={{ flex: 1, padding: "6px 0", borderRadius: 6, textAlign: "center", fontSize: 10, fontFamily: "DM Sans, sans-serif", fontWeight: active ? 700 : 400, background: active ? c.gold + "20" : c.bg, color: active ? c.gold : c.textMuted, transition: "all 0.2s" }}>{m}</div>;
                })}
              </div>
            </div>
          )}

          {/* Planning Checklist */}
          {trip.status !== "Done" && (() => {
            const checklist = getTripChecklist(trip);
            const done = checklist.filter(i => i.done).length;
            return (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 600, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1.5, display: "flex", alignItems: "center", gap: 4 }}><Check size={10} /> Planning Checklist</div>
                  <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, color: done === checklist.length ? COLORS.booked : c.textMuted }}>{done}/{checklist.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {checklist.map((item, idx) => (
                    <div key={idx} onClick={(e) => { e.stopPropagation(); onToggleChecklist?.(trip, idx); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, cursor: "pointer", background: item.done ? COLORS.booked + "10" : "transparent", transition: "background 0.15s" }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${item.done ? COLORS.booked : c.border}`, background: item.done ? COLORS.booked : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                        {item.done && <Check size={10} color="#fff" />}
                      </div>
                      <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: item.done ? c.textMuted : c.text, textDecoration: item.done ? "line-through" : "none", transition: "all 0.15s" }}>{item.item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Planned date */}
          {trip.plannedYear && (
            <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: c.gold + "12", borderRadius: 8, border: `1px solid ${c.gold}30` }}>
              <Clock size={14} style={{ color: c.gold }} />
              <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 600, color: c.text }}>
                Planned: {trip.plannedMonth ? BEST_MONTHS[trip.plannedMonth - 1] + " " : ""}{trip.plannedYear}
              </span>
            </div>
          )}

          {/* Notes */}
          {trip.notes && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 600, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Notes</div>
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: c.text, lineHeight: 1.7, margin: 0, fontStyle: "italic", padding: "12px 16px", background: c.bg, borderRadius: 8, borderLeft: `3px solid ${c.gold}` }}>{trip.notes}</p>
            </div>
          )}

          {/* Related trips */}
          {related.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 600, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}><Link2 size={10} /> Pairs Well With</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {related.slice(0, 4).map(r => (
                  <div key={r.id} onClick={() => onSelectTrip?.(r)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: c.bg, cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 12, transition: "background 0.15s" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_CONFIG[r.status]?.color, flexShrink: 0 }} />
                    <span style={{ color: c.text, fontWeight: 500, flex: 1 }}>{r.name}</span>
                    <span style={{ color: c.textMuted, fontSize: 11 }}>{r.destination}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onEdit} style={{ flex: 1, background: c.text === "#E6EDF3" ? c.gold : c.navy, color: "#fff", border: "none", padding: "10px 16px", borderRadius: 10, fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Edit2 size={14} /> Edit Trip</button>
            <button onClick={onDelete} style={{ background: "#FEE2E2", color: "#DC2626", border: "none", padding: "10px 16px", borderRadius: 10, fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}><Trash2 size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommandPalette({ trips, onSelect, onClose, onSwitchView }) {
  const c = useTheme();
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = query.length > 0 ? trips.filter(t => {
    const q = query.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || (t.notes || "").toLowerCase().includes(q);
  }).slice(0, 8) : [];

  const actions = query.length === 0 ? [
    { label: "Globe View", shortcut: "G", action: () => { onSwitchView("map"); onClose(); } },
    { label: "Cards View", shortcut: "C", action: () => { onSwitchView("cards"); onClose(); } },
    { label: "Timeline View", shortcut: "T", action: () => { onSwitchView("timeline"); onClose(); } },
    { label: "Dashboard", shortcut: "D", action: () => { onSwitchView("dashboard"); onClose(); } },
  ] : [];

  const allItems = query.length > 0 ? results : actions;

  useEffect(() => { setSelectedIdx(0); }, [query]);

  const handleKey = (e) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, allItems.length - 1)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); return; }
    if (e.key === "Enter" && allItems.length > 0) {
      e.preventDefault();
      const item = allItems[selectedIdx];
      if (item.action) item.action();
      else { onSelect(item); onClose(); }
    }
  };

  const kbdStyle = { padding: "2px 6px", borderRadius: 4, border: `1px solid ${c.border}`, fontFamily: "monospace", fontSize: 10, color: c.textMuted, background: c.bg };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "15vh", zIndex: 5000, animation: "viewFadeIn 0.15s ease-out" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: c.card, borderRadius: 16, width: "100%", maxWidth: 520, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.4)", border: `1px solid ${c.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${c.border}` }}>
          <Search size={18} style={{ color: c.textMuted, flexShrink: 0 }} />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKey} placeholder="Search trips, destinations, categories..." style={{ flex: 1, border: "none", outline: "none", fontSize: 15, fontFamily: "DM Sans, sans-serif", background: "transparent", color: c.text }} />
          <kbd style={kbdStyle}>Esc</kbd>
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto", padding: 6 }}>
          {query.length === 0 && (
            <div style={{ padding: "8px 12px", fontFamily: "DM Sans, sans-serif", fontSize: 10, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1.5 }}>Quick Actions</div>
          )}
          {query.length === 0 && actions.map((a, i) => (
            <div key={a.label} onClick={a.action} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 13, background: i === selectedIdx ? c.cream : "transparent", color: c.text }}
              onMouseEnter={() => setSelectedIdx(i)}>
              <span style={{ flex: 1 }}>{a.label}</span>
              <kbd style={kbdStyle}>{a.shortcut}</kbd>
            </div>
          ))}
          {query.length > 0 && results.length > 0 && (
            <div style={{ padding: "8px 12px", fontFamily: "DM Sans, sans-serif", fontSize: 10, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1.5 }}>{results.length} result{results.length !== 1 ? "s" : ""}</div>
          )}
          {results.map((trip, i) => {
            const cfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.Dream;
            return (
              <div key={trip.id} onClick={() => { onSelect(trip); onClose(); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer", background: i === selectedIdx ? c.cream : "transparent", transition: "background 0.1s" }}
                onMouseEnter={() => setSelectedIdx(i)}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 600, color: c.text }}>{trip.name}</div>
                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: c.textMuted }}>{trip.destination} · {trip.category}</div>
                </div>
                <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: c.textMuted }}>{trip.costEstimate?.toLocaleString() ? "£" + trip.costEstimate.toLocaleString() : ""}</span>
              </div>
            );
          })}
          {query.length > 0 && results.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", fontFamily: "DM Sans, sans-serif", fontSize: 13, color: c.textMuted }}>No trips found for "{query}"</div>
          )}
        </div>
        {query.length === 0 && (
          <div style={{ padding: "10px 18px", borderTop: `1px solid ${c.border}`, display: "flex", gap: 16, fontFamily: "DM Sans, sans-serif", fontSize: 10, color: c.textMuted }}>
            <span><kbd style={kbdStyle}>↑↓</kbd> Navigate</span>
            <span><kbd style={kbdStyle}>↵</kbd> Select</span>
            <span><kbd style={kbdStyle}>J</kbd><kbd style={kbdStyle}>K</kbd> Prev/Next trip</span>
            <span><kbd style={kbdStyle}>N</kbd> New trip</span>
          </div>
        )}
      </div>
    </div>
  );
}

function AchievementToast({ achievement }) {
  const c = useTheme();
  return (
    <div style={{ position: "fixed", top: 24, right: 24, background: c.card, borderRadius: 14, padding: "16px 22px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.25)", border: `1px solid ${c.gold}40`, zIndex: 6000, animation: "viewFadeIn 0.3s ease-out", fontFamily: "DM Sans, sans-serif", maxWidth: 340 }}>
      <span style={{ fontSize: 32, flexShrink: 0 }}>{achievement.icon}</span>
      <div>
        <div style={{ fontSize: 10, color: c.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2 }}>Achievement Unlocked!</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: c.navy, marginTop: 2 }}>{achievement.label}</div>
        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>{achievement.desc}</div>
      </div>
    </div>
  );
}

function CompletionRing({ completed, total, size = 22 }) {
  const c = useTheme();
  const pct = total > 0 ? completed / total : 0;
  const r = (size - 3) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c.border} strokeWidth={2} />
      {pct > 0 && <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={pct >= 1 ? COLORS.booked : c.gold} strokeWidth={2} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.3s" }} />}
    </svg>
  );
}
