import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Prisma } from '@prisma/client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function serializeData<T>(obj: T): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeData);
  }
  if (typeof obj === 'object') {
    if (obj instanceof Prisma.Decimal) {
      return obj.toNumber();
    }
    if (obj instanceof Date) {
      return obj; // Pass dates, Next.js generic serialization handles them if they are in plain objects
    }
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (typeof (obj as any)[key] !== 'function') {
          newObj[key] = serializeData((obj as any)[key]);
        }
      }
    }
    return newObj;
  }
  return obj;
}
