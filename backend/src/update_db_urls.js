import { getDb, upsertProduct } from "./db.js";
import { FALLBACK_TARGET_PRODUCTS } from "./scrapers/target.js";
import { FALLBACK_AMAZON_JP_PRODUCTS } from "./scrapers/amazon-jp.js";
import { FALLBACK_SEPHORA_PRODUCTS } from "./scrapers/sephora.js";
import { FALLBACK_LEGO_PRODUCTS } from "./scrapers/lego.js";
import { FALLBACK_INTERFLORA_PRODUCTS } from "./scrapers/interflora.js";

const db = getDb();

console.log("Seeding / Updating products in database...");


const HOMEDEPOT_PRODUCTS = [
  {
    name: "DEWALT 20V MAX Cordless Drill Driver Combo Kit 2-Tool",
    price: 159.00,
    original_price: 229.00,
    discount_pct: 31,
    rating: 4.8,
    reviews_count: 12450,
    category: "Tools",
    source: "homedepot",
    url: "https://www.homedepot.com/p/DEWALT-20V-MAX-Cordless-Drill-Driver-Combo-Kit-2-Tool-with-2-0Ah-Batteries-Charger-and-Bag-DCK280C2/203164221",
    image_url: "https://images.thdstatic.com/productImages/dc280c2/svn/dewalt-power-tool-combo-kits-dck280c2-64_600.jpg",
    seller: "The Home Depot",
    availability: "In Stock",
    country: "USA",
    currency: "$",
  },
  {
    name: "Milwaukee M18 FUEL 18V Brushless Cordless 2-Tool Combo Kit",
    price: 399.00,
    original_price: 479.00,
    discount_pct: 17,
    rating: 4.9,
    reviews_count: 8920,
    category: "Tools",
    source: "homedepot",
    url: "https://www.homedepot.com/p/Milwaukee-M18-FUEL-18V-Lithium-Ion-Brushless-Cordless-Hammer-Drill-and-Impact-Driver-Combo-Kit-2-Tool-3697-22/320326888",
    image_url: "https://images.thdstatic.com/productImages/369722/svn/milwaukee-power-tool-combo-kits-3697-22-64_600.jpg",
    seller: "The Home Depot",
    availability: "In Stock",
    country: "USA",
    currency: "$",
  },
  {
    name: "RYOBI ONE+ 18V Cordless 6-Tool Combo Kit with Batteries",
    price: 199.00,
    original_price: 299.00,
    discount_pct: 33,
    rating: 4.7,
    reviews_count: 6540,
    category: "Tools",
    source: "homedepot",
    url: "https://www.homedepot.com/p/RYOBI-ONE-18V-Cordless-6-Tool-Combo-Kit-with-1-1-5-Ah-Battery-1-4-0-Ah-Battery-and-Charger-P1819/309659455",
    image_url: "https://images.thdstatic.com/productImages/p1819/svn/ryobi-power-tool-combo-kits-p1819-64_600.jpg",
    seller: "The Home Depot",
    availability: "In Stock",
    country: "USA",
    currency: "$",
  },
  {
    name: "Husky Mechanics Tool Set 270-Piece with Case",
    price: 99.00,
    original_price: 159.00,
    discount_pct: 38,
    rating: 4.8,
    reviews_count: 4120,
    category: "Tools",
    source: "homedepot",
    url: "https://www.homedepot.com/p/Husky-Mechanics-Tool-Set-270-Piece-H270MTS/310651877",
    image_url: "https://images.thdstatic.com/productImages/h270mts/svn/husky-mechanics-tool-sets-h270mts-64_600.jpg",
    seller: "The Home Depot",
    availability: "In Stock",
    country: "USA",
    currency: "$",
  },
  {
    name: "Weber Spirit II E-310 3-Burner Propane Gas Grill in Black",
    price: 549.00,
    original_price: 649.00,
    discount_pct: 15,
    rating: 4.8,
    reviews_count: 7850,
    category: "Home & Garden",
    source: "homedepot",
    url: "https://www.homedepot.com/p/Weber-Spirit-II-E-310-3-Burner-Propane-Gas-Grill-in-Black-45010001/303403378",
    image_url: "https://images.thdstatic.com/productImages/45010001/svn/weber-liquid-propane-grills-45010001-64_600.jpg",
    seller: "The Home Depot",
    availability: "In Stock",
    country: "USA",
    currency: "$",
  },
  {
    name: "Ring Video Doorbell Battery Edition Venetian Bronze",
    price: 99.99,
    original_price: 129.99,
    discount_pct: 23,
    rating: 4.6,
    reviews_count: 14200,
    category: "Electronics",
    source: "homedepot",
    url: "https://www.homedepot.com/p/Ring-Video-Doorbell-Venetian-Bronze-8VR1S7-0EN0/314112678",
    image_url: "https://images.thdstatic.com/productImages/8vr1s70en0/svn/ring-video-doorbells-8vr1s7-0en0-64_600.jpg",
    seller: "The Home Depot",
    availability: "In Stock",
    country: "USA",
    currency: "$",
  },
];

const allToSeed = [
  ...HOMEDEPOT_PRODUCTS,
  ...FALLBACK_TARGET_PRODUCTS,
  ...FALLBACK_AMAZON_JP_PRODUCTS,
  ...FALLBACK_SEPHORA_PRODUCTS,
  ...FALLBACK_LEGO_PRODUCTS,
  ...FALLBACK_INTERFLORA_PRODUCTS,
];


let insertedCount = 0;
for (const p of allToSeed) {
  upsertProduct(p);
  insertedCount++;
}

console.log(`Seeded/Updated ${insertedCount} products in database.`);

