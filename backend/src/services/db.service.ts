import fs from 'fs';
import path from 'path';

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

  const users = db.users.find();
  if (users.length === 0) {
    // We will create a default admin user for convenience (password hash: 'admin123' -> dummy hash check or we will bcrypt it)
    // For local convenience, password will be encrypted in the auth controller using standard bcrypt.
    console.log('No users registered yet. Seeding empty database...');
  }
};
