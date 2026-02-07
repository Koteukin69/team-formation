import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { randomInt } from 'crypto'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateCode() {
  return randomInt(100000, 999999)
}
