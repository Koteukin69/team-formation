import { ObjectId } from 'mongodb'

export interface User {
  _id: ObjectId,
  email: string,
  telegram_id: number,
  username: string,
  role: "admin" | "organizer" | "user"
}

export interface Marathon {
  _id: ObjectId,
  name: string,
  slug: string,
  description?: string,
  topic?: string,
  owner: string,
  organizers: Array<string>,
  userData: Array<DataForm>,
  teamData: Array<DataForm>,
  participants: Array<Participant>,
  teams: Array<Team>,
  minTeamSize: number,
  maxTeamSize: number
}

export interface EmailCode {
  _id: ObjectId,
  email: string,
  "attempts": number,
  "code": number,
  "createdAt": Date
}

export interface TelegramCode {
  _id: ObjectId,
  telegram_id: number,
  "code": 775009
}

export interface Team {
  name: string,
  slug: string,
  management: "scrum" | "kanban" | "xp" | "lean" | "safe" | "less" | "crystal" | "waterfall" | "prince2" | "pmp" | "free",
  decisions: "dictatorship" | "democracy",
  teamlead: string,
  participants: Array<string>,
  isPrivate: boolean,
  data: Array<Data>
}

export interface Data {
  name: string,
  value: string
}

export interface DataForm {
  name: string,
  type: "string" | "flags" | "link" | "git",
  regex?: RegExp,
  min: number,
  max: number,
  required: boolean,
  private?: boolean,
}

export interface Participant {
  id: string,
  data: Array<Data>
}

export interface JWTPayload {
  userId: string,
  email?: string;
  telegram_id?: number;
  role: 'user' | 'organizer' | 'admin';
}

export type Role = "admin" | "organizer" | "user";