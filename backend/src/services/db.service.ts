import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { generateSKU } from '../utils/sku';

export class LocalCollection<T extends { _id: string; createdAt?: string; updatedAt?: string }> {
  private filePath: string;
  private name: string;

  constructor(name: string) {
    this.name = name;
    const dir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.filePath = path.join(dir, `${name}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  private read(): T[] {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.error(`Error reading database file: ${this.filePath}`, e);
      return [];
    }
  }

  private write(data: T[]) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(`Error writing database file: ${this.filePath}`, e);
    }
  }

  find(query?: Partial<Record<keyof T, any>>): T[] {
    const list = this.read();
    if (!query || Object.keys(query).length === 0) return list;
    return list.filter(item => {
      for (const key in query) {
        // Handle direct value comparison, array checks, or object ID checks
        if (query[key] !== undefined) {
          if (Array.isArray(item[key])) {
            if (!item[key].includes(query[key])) return false;
          } else if (item[key] !== query[key]) {
            return false;
          }
        }
      }
      return true;
    });
  }

  findOne(query: Partial<Record<keyof T, any>>): T | null {
    const list = this.read();
    const found = list.find(item => {
      for (const key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    return found || null;
  }

  findById(id: string): T | null {
    return this.findOne({ _id: id } as any);
  }

  create(item: Omit<T, '_id' | 'createdAt' | 'updatedAt'> & { _id?: string }): T {
    const list = this.read();
    const now = new Date().toISOString();
    const newItem = {
      ...item,
      _id: item._id || Math.random().toString(36).substring(2, 9),
      createdAt: now,
      updatedAt: now
    } as unknown as T;
    list.push(newItem);
    this.write(list);
    return newItem;
  }

  findByIdAndUpdate(id: string, updates: Partial<T>): T | null {
    const list = this.read();
    const idx = list.findIndex(item => item._id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    const updated = {
      ...list[idx],
      ...updates,
      updatedAt: now
    } as T;
    list[idx] = updated;
    this.write(list);
    return updated;
  }

  findByIdAndDelete(id: string): boolean {
    const list = this.read();
    const filtered = list.filter(item => item._id !== id);
    if (filtered.length === list.length) return false;
    this.write(filtered);
    return true;
  }
}

// Instantiate Database collections
export const db = {
  users: new LocalCollection<any>('users'),
  vendors: new LocalCollection<any>('vendors'),
  products: new LocalCollection<any>('products'),
  variants: new LocalCollection<any>('variants'),
  warehouses: new LocalCollection<any>('warehouses'),
  orders: new LocalCollection<any>('orders'),
  payments: new LocalCollection<any>('payments'),
  reviews: new LocalCollection<any>('reviews'),
  wishlists: new LocalCollection<any>('wishlists'),
  notifications: new LocalCollection<any>('notifications'),
  coupons: new LocalCollection<any>('coupons'),
  addresses: new LocalCollection<any>('addresses'),
  returns: new LocalCollection<any>('returns'),
  exchanges: new LocalCollection<any>('exchanges'),
  rewardPoints: new LocalCollection<any>('rewardPoints'),
  referrals: new LocalCollection<any>('referrals'),
  auditLogs: new LocalCollection<any>('auditLogs'),
  inventoryLogs: new LocalCollection<any>('inventoryLogs')
};

// Seed default warehouses and categories if empty
export const seedDefaults = () => {
  const warehouses = db.warehouses.find();
  if (warehouses.length === 0) {
    db.warehouses.create({ _id: 'wh-blr', name: 'Bangalore Warehouse', location: 'Bangalore' });
    db.warehouses.create({ _id: 'wh-del', name: 'Delhi Warehouse', location: 'Delhi' });
    db.warehouses.create({ _id: 'wh-mum', name: 'Mumbai Warehouse', location: 'Mumbai' });
    console.log('Seeded default Warehouses: Bangalore, Delhi, Mumbai');
  }

  let users = db.users.find();
  let defaultVendor: any = null;

  if (users.length === 0) {
    const salt = bcrypt.genSaltSync(10);
    
    // Seed Admin
    db.users.create({
      _id: 'usr-admin',
      name: 'RideVault Admin',
      email: 'admin@ridevault.pro',
      password: bcrypt.hashSync('admin123', salt),
      role: 'admin',
      isVerified: true,
      rewardPoints: 0,
      referralCode: 'RV-ADMIN1',
      referredBy: null
    });
    
    // Seed Vendor
    db.users.create({
      _id: 'usr-vendor',
      name: 'Siddesh Vendor',
      email: 'vendor@ridevault.pro',
      password: bcrypt.hashSync('vendor123', salt),
      role: 'vendor',
      isVerified: true,
      rewardPoints: 0,
      referralCode: 'RV-VENDOR1',
      referredBy: null
    });

    // Seed Customer
    db.users.create({
      _id: 'usr-customer',
      name: 'Charitha Customer',
      email: 'customer@ridevault.pro',
      password: bcrypt.hashSync('customer123', salt),
      role: 'customer',
      isVerified: true,
      rewardPoints: 500,
      referralCode: 'RV-CUST1',
      referredBy: null
    });

    console.log('Seeded default users: admin@ridevault.pro, vendor@ridevault.pro, customer@ridevault.pro');

    // Create approved vendor profile
    defaultVendor = db.vendors.create({
      _id: 'vnd-sidd',
      userId: 'usr-vendor',
      businessName: 'Siddesh Racing Gear',
      gstNumber: '29AAAAA1111A1Z1',
      isApproved: true,
      isSuspended: false,
      revenue: 0
    });
    console.log('Seeded default Vendor profile');
  } else {
    defaultVendor = db.vendors.findOne({ userId: 'usr-vendor' }) || db.vendors.find()[0];
  }

  const products = db.products.find();
  if (products.length === 0 && defaultVendor) {
    // Product 1: Shoei X-Fifteen Helmet
    const shoeiHelmet = db.products.create({
      _id: 'prd-shoei',
      name: 'Shoei X-Fifteen Helmet',
      description: 'Professional racing full-face motorcycle helmet developed through extensive wind tunnel testing for high-speed stability and safety.',
      brand: 'Shoei',
      category: 'Helmets',
      basePrice: 62000,
      specifications: {
        material: 'AIM+ Multi-Ply Matrix Fiber',
        waterproof: false,
        ceCertified: true,
        ridingStyle: 'Track'
      },
      vendorId: defaultVendor._id,
      images: ['https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?q=80&w=600'],
      averageRating: 4.9,
      isApproved: true
    });

    // Seed Shoei Variants & Stock
    db.variants.create({
      productId: shoeiHelmet._id,
      sku: generateSKU('Helmets', 'Shoei', 'X-Fifteen Helmet', 'Matte Black', 'M'),
      size: 'M',
      color: 'Matte Black',
      priceAdjustment: 0,
      totalStock: 15,
      warehouseStock: [
        { warehouse: 'wh-blr', quantity: 5 },
        { warehouse: 'wh-del', quantity: 5 },
        { warehouse: 'wh-mum', quantity: 5 }
      ]
    });

    db.variants.create({
      productId: shoeiHelmet._id,
      sku: generateSKU('Helmets', 'Shoei', 'X-Fifteen Helmet', 'Gloss White', 'L'),
      size: 'L',
      color: 'Gloss White',
      priceAdjustment: 2000,
      totalStock: 10,
      warehouseStock: [
        { warehouse: 'wh-blr', quantity: 3 },
        { warehouse: 'wh-del', quantity: 4 },
        { warehouse: 'wh-mum', quantity: 3 }
      ]
    });

    // Product 2: Alpinestars GP Pro V4 Leather Jacket
    const astarsJacket = db.products.create({
      _id: 'prd-astars',
      name: 'Alpinestars GP Pro V4 Leather Jacket',
      description: 'Premium race-grade cowhide leather jacket with dynamic stretch panels, external shoulder sliders, and Tech-Air 5 airbag system readiness.',
      brand: 'Alpinestars',
      category: 'Jackets',
      basePrice: 45000,
      specifications: {
        material: '1.3mm Premium Bovine Leather',
        waterproof: false,
        ceCertified: true,
        ridingStyle: 'Sport'
      },
      vendorId: defaultVendor._id,
      images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600'],
      averageRating: 4.8,
      isApproved: true
    });

    // Seed Alpinestars Variants & Stock
    db.variants.create({
      productId: astarsJacket._id,
      sku: generateSKU('Jackets', 'Alpinestars', 'GP Pro V4 Leather Jacket', 'Black Red', 'L'),
      size: 'L',
      color: 'Black Red',
      priceAdjustment: 0,
      totalStock: 12,
      warehouseStock: [
        { warehouse: 'wh-blr', quantity: 4 },
        { warehouse: 'wh-del', quantity: 4 },
        { warehouse: 'wh-mum', quantity: 4 }
      ]
    });

    db.variants.create({
      productId: astarsJacket._id,
      sku: generateSKU('Jackets', 'Alpinestars', 'GP Pro V4 Leather Jacket', 'Stealth Black', 'XL'),
      size: 'XL',
      color: 'Stealth Black',
      priceAdjustment: 1500,
      totalStock: 8,
      warehouseStock: [
        { warehouse: 'wh-blr', quantity: 3 },
        { warehouse: 'wh-del', quantity: 2 },
        { warehouse: 'wh-mum', quantity: 3 }
      ]
    });

    // Product 3: Dainese Full Metal 6 Gloves
    const daineseGloves = db.products.create({
      _id: 'prd-dainese',
      name: 'Dainese Full Metal 6 Gloves',
      description: 'Top-tier racing gloves crafted with goatskin leather, carbon fiber, and titanium knuckle inserts for ultimate abrasion resistance and tactile feedback.',
      brand: 'Dainese',
      category: 'Gloves',
      basePrice: 28000,
      specifications: {
        material: 'Goatskin Leather & Carbon/Titanium Composite',
        waterproof: false,
        ceCertified: true,
        ridingStyle: 'Track'
      },
      vendorId: defaultVendor._id,
      images: ['https://images.unsplash.com/photo-1591533596420-0082bc339174?q=80&w=600'],
      averageRating: 4.7,
      isApproved: true
    });

    // Seed Dainese Variants
    db.variants.create({
      productId: daineseGloves._id,
      sku: generateSKU('Gloves', 'Dainese', 'Full Metal 6 Gloves', 'Red Black', 'M'),
      size: 'M',
      color: 'Red Black',
      priceAdjustment: 0,
      totalStock: 20,
      warehouseStock: [
        { warehouse: 'wh-blr', quantity: 8 },
        { warehouse: 'wh-del', quantity: 6 },
        { warehouse: 'wh-mum', quantity: 6 }
      ]
    });

    // Product 4: Sidi Rex Racing Boots
    const sidiBoots = db.products.create({
      _id: 'prd-sidi',
      name: 'Sidi Rex Racing Boots',
      description: 'Top-of-the-line racing boots featuring Technomicro microfiber, ankle support braces, elastic panels, and a triple Techno-3 magnetic closure system.',
      brand: 'Sidi',
      category: 'Boots',
      basePrice: 38000,
      specifications: {
        material: 'Technomicro Microfiber & Nylon Shielding',
        waterproof: false,
        ceCertified: true,
        ridingStyle: 'Track'
      },
      vendorId: defaultVendor._id,
      images: ['https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=600'],
      averageRating: 4.9,
      isApproved: true
    });

    // Seed Sidi Variants
    db.variants.create({
      productId: sidiBoots._id,
      sku: generateSKU('Boots', 'Sidi', 'Rex Racing Boots', 'Flourescent Yellow', '43'),
      size: '43',
      color: 'Flourescent Yellow',
      priceAdjustment: 0,
      totalStock: 10,
      warehouseStock: [
        { warehouse: 'wh-blr', quantity: 3 },
        { warehouse: 'wh-del', quantity: 4 },
        { warehouse: 'wh-mum', quantity: 3 }
      ]
    });

    console.log('Seeded default approved products and variants');
  }
};
