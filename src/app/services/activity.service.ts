import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Activity } from '../models/activity.model';

const STORAGE_KEY = 'activities';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  async getAll(): Promise<Activity[]> {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    return value ? JSON.parse(value) : [];
  }

  async saveAll(activities: Activity[]): Promise<void> {
    await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(activities) });
  }

  async add(activity: Activity): Promise<void> {
    const activities = await this.getAll();
    activities.push(activity);
    await this.saveAll(activities);
  }

  async update(activity: Activity): Promise<void> {
    const activities = await this.getAll();
    const idx = activities.findIndex(a => a.id === activity.id);
    if (idx > -1) {
      activities[idx] = activity;
      await this.saveAll(activities);
    }
  }

  async delete(id: string): Promise<void> {
    const activities = await this.getAll();
    const filtered = activities.filter(a => a.id !== id);
    await this.saveAll(filtered);
  }

async getByDay(date: Date): Promise<Activity[]> {
  const activities = await this.getAll();

  const dayKey = this.getLocalDateKey(date);

  return activities.filter(activity => {
    const activityDayKey = this.getActivityDateKey(activity.time);
    return activityDayKey === dayKey;
  });
}

private getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

private getActivityDateKey(value: string): string {
  // Si viene como "2026-05-04T15:30", toma solo "2026-05-04"
  if (value.includes('T')) {
    return value.split('T')[0];
  }

  const date = new Date(value);

  return this.getLocalDateKey(date);
}

  async getByCategory(type: string, date: Date): Promise<Activity[]> {
    const dayActs = await this.getByDay(date);
    return dayActs.filter(a => a.type === type);
  }
}
