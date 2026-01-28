import { z } from 'zod'

// Common schemas
export const emailSchema = z.string().email('Некорректный email')

export const codeSchema = z.string().length(6, 'Код должен содержать 6 цифр').regex(/^\d{6}$/, 'Код должен содержать только цифры')

export const slugSchema = z
  .string()
  .min(1, 'Минимум 1 символ')
  .max(16, 'Максимум 16 символов')
  .regex(/^[a-z0-9_-]+$/i, 'Только латинские буквы, цифры, дефис и подчёркивание')
  .transform((s) => s.toLowerCase())

export const nicknameSchema = z
  .string()
  .min(1, 'Минимум 1 символ')
  .max(16, 'Максимум 16 символов')
  .regex(/^[a-z0-9_-]+$/i, 'Только латинские буквы, цифры, дефис и подчёркивание')
  .transform((s) => s.toLowerCase())

export const nameSchema = z.string().min(1, 'Обязательное поле').max(100, 'Максимум 100 символов')

export const descriptionSchema = z.string().max(2000, 'Максимум 2000 символов').optional()

export const messageSchema = z.string().max(500, 'Максимум 500 символов').optional()

export const urlSchema = z.string().url('Некорректный URL').max(500, 'Максимум 500 символов').optional()

// Auth schemas
export const requestCodeSchema = z.object({
  email: emailSchema,
})

export const verifyCodeSchema = z.object({
  email: emailSchema,
  code: codeSchema,
})

// Marathon schemas
export const createMarathonSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  minTeamSize: z.number().int().min(1).max(50),
  maxTeamSize: z.number().int().min(1).max(50),
}).refine((data) => data.minTeamSize <= data.maxTeamSize, {
  message: 'Минимальный размер команды не может быть больше максимального',
  path: ['minTeamSize'],
})

export const updateMarathonSchema = z.object({
  name: nameSchema.optional(),
  minTeamSize: z.number().int().min(1).max(50).optional(),
  maxTeamSize: z.number().int().min(1).max(50).optional(),
})

// Profile schemas
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  nickname: nicknameSchema.optional(),
  roles: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  description: descriptionSchema,
})

// Team schemas
export const managementTypeSchema = z.enum(['scrum', 'kanban', 'agile', 'waterfall', 'free'])
export const decisionSystemSchema = z.enum(['dictatorship', 'democracy'])

export const createTeamSchema = z.object({
  name: nameSchema,
  managementType: managementTypeSchema,
  decisionSystem: decisionSystemSchema,
  genre: z.string().optional(),
  description: descriptionSchema,
  pitchDoc: urlSchema,
  designDoc: urlSchema,
  chatLink: urlSchema,
  gitLink: urlSchema,
})

export const updateTeamSettingsSchema = z.object({
  name: nameSchema.optional(),
  managementType: managementTypeSchema.optional(),
  genre: z.string().optional(),
  description: descriptionSchema,
  pitchDoc: urlSchema,
  designDoc: urlSchema,
  chatLink: urlSchema,
  gitLink: urlSchema,
})

// Request schemas
export const teamRequestTypeSchema = z.enum([
  'invite',
  'open_position',
  'close_position',
  'kick',
  'update_settings',
  'accept_application',
  'reject_application',
  'transfer_lead',
  'change_decision_system',
])

export const createRequestSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('invite'),
    participantId: z.string(),
    message: messageSchema,
  }),
  z.object({
    type: z.literal('open_position'),
    role: z.string(),
    description: messageSchema,
  }),
  z.object({
    type: z.literal('close_position'),
    positionId: z.string(),
  }),
  z.object({
    type: z.literal('kick'),
    memberId: z.string(),
  }),
  z.object({
    type: z.literal('update_settings'),
    changes: updateTeamSettingsSchema,
  }),
  z.object({
    type: z.literal('accept_application'),
    applicationId: z.string(),
  }),
  z.object({
    type: z.literal('reject_application'),
    applicationId: z.string(),
  }),
  z.object({
    type: z.literal('transfer_lead'),
    memberId: z.string(),
  }),
  z.object({
    type: z.literal('change_decision_system'),
    decisionSystem: z.literal('democracy'),
  }),
  z.object({
    type: z.literal('change_decision_system'),
    decisionSystem: z.literal('dictatorship'),
    leaderId: z.string(),
  }),
])

export const voteSchema = z.object({
  vote: z.enum(['approve', 'reject']),
})

export const decideSchema = z.object({
  decision: z.enum(['approve', 'reject']),
})

// Application schemas
export const createApplicationSchema = z.object({
  message: messageSchema,
})

// Moderation schemas
export const moderationReasonSchema = z.object({
  reason: z.string().min(1, 'Укажите причину').max(500, 'Максимум 500 символов'),
})
