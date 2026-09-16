/**
 * User Profile State & Financial HUD Controller for Artha
 * Persists in localStorage; zero-login requirement.
 */

import { formatINR, calculateDTI, calculateHealthScore } from './calculations.js';

const STORAGE_KEY = 'artha_user_profile_v1';

export const PRESETS = {
  fresher: {
    name: "Fresh Graduate",
    salary: 35000,
    age: 23,
    emi: 5500,
    loanOutstanding: 180000,
    expenses: 14000,
    emergencyFund: 20000
  },
  techMid: {
    name: "Mid-Level Professional",
    salary: 120000,
    age: 30,
    emi: 22000,
    loanOutstanding: 750000,
    expenses: 42000,
    emergencyFund: 180000
  },
  family: {
    name: "Established Family",
    salary: 250000,
    age: 42,
    emi: 68000,
    loanOutstanding: 3800000,
    expenses: 80000,
    emergencyFund: 600000
  },
  freelancer: {
    name: "Gig Freelancer",
    salary: 85000,
    age: 27,
    emi: 0,
    loanOutstanding: 0,
    expenses: 30000,
    emergencyFund: 150000
  }
};

class ProfileManager {
  constructor() {
    this.profile = this.loadProfile();
    this.listeners = [];
  }

  loadProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Could not load profile from localStorage", e);
    }
    // Default starting profile: Modern Indian tech/corporate professional
    return { ...PRESETS.techMid };
  }

  saveProfile() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    } catch (e) {
      console.warn("Could not save profile to localStorage", e);
    }
    this.notify();
  }

  update(fields) {
    this.profile = {
      ...this.profile,
      ...fields
    };
    this.saveProfile();
  }

  applyPreset(presetKey) {
    if (PRESETS[presetKey]) {
      this.profile = { ...PRESETS[presetKey] };
      this.saveProfile();
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    // Trigger immediately with current state
    listener(this.getVitals());
  }

  notify() {
    const vitals = this.getVitals();
    this.listeners.forEach(fn => fn(vitals));
  }

  getVitals() {
    const { salary, emi, expenses, age, emergencyFund, loanOutstanding } = this.profile;
    const totalOutflow = emi + expenses;
    const surplus = Math.max(0, salary - totalOutflow);
    const dti = calculateDTI(emi, salary);
    const health = calculateHealthScore({ salary, emi, expenses, age });

    // 6-month emergency fund standard benchmark
    const recommendedEmergencyFund = totalOutflow * 6;
    const emergencyMonthsCovered = totalOutflow > 0 ? (emergencyFund / totalOutflow).toFixed(1) : 0;

    return {
      profile: { ...this.profile },
      salary,
      age,
      emi,
      loanOutstanding,
      expenses,
      emergencyFund,
      totalOutflow,
      surplus,
      dti,
      health,
      recommendedEmergencyFund,
      emergencyMonthsCovered
    };
  }
}

export const profileManager = new ProfileManager();
