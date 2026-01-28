export interface ReferenceItem {
  id: string
  name: string
}

export const ROLES: ReferenceItem[] = [
  { id: 'programmer', name: 'Программист' },
  { id: 'designer', name: 'Дизайнер' },
  { id: 'game_designer', name: 'Геймдизайнер' },
  { id: 'sound_designer', name: 'Звукорежиссёр' },
  { id: 'artist', name: 'Художник' },
  { id: 'animator', name: 'Аниматор' },
  { id: 'writer', name: 'Сценарист' },
  { id: 'qa', name: 'Тестировщик' },
  { id: 'pm', name: 'Проджект-менеджер' },
  { id: 'composer', name: 'Композитор' },
  { id: '3d_artist', name: '3D-художник' },
  { id: 'level_designer', name: 'Левел-дизайнер' },
]

export const TECHNOLOGIES: ReferenceItem[] = [
  { id: 'unity', name: 'Unity' },
  { id: 'unreal', name: 'Unreal Engine' },
  { id: 'godot', name: 'Godot' },
  { id: 'gamemaker', name: 'GameMaker' },
  { id: 'construct', name: 'Construct' },
  { id: 'figma', name: 'Figma' },
  { id: 'photoshop', name: 'Photoshop' },
  { id: 'illustrator', name: 'Illustrator' },
  { id: 'blender', name: 'Blender' },
  { id: 'maya', name: 'Maya' },
  { id: '3dsmax', name: '3ds Max' },
  { id: 'aseprite', name: 'Aseprite' },
  { id: 'spine', name: 'Spine' },
  { id: 'fl_studio', name: 'FL Studio' },
  { id: 'ableton', name: 'Ableton Live' },
  { id: 'audacity', name: 'Audacity' },
  { id: 'fmod', name: 'FMOD' },
  { id: 'wwise', name: 'Wwise' },
  { id: 'csharp', name: 'C#' },
  { id: 'cpp', name: 'C++' },
  { id: 'gdscript', name: 'GDScript' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'python', name: 'Python' },
  { id: 'lua', name: 'Lua' },
  { id: 'git', name: 'Git' },
  { id: 'trello', name: 'Trello' },
  { id: 'notion', name: 'Notion' },
  { id: 'miro', name: 'Miro' },
]

export const MANAGEMENT_TYPES: ReferenceItem[] = [
  { id: 'scrum', name: 'Scrum' },
  { id: 'kanban', name: 'Kanban' },
  { id: 'agile', name: 'Agile' },
  { id: 'waterfall', name: 'Waterfall' },
  { id: 'free', name: 'Свободный стиль' },
]

export const DECISION_SYSTEMS: ReferenceItem[] = [
  { id: 'dictatorship', name: 'Диктатура' },
  { id: 'democracy', name: 'Демократия' },
]

export const GENRES: ReferenceItem[] = [
  { id: 'rpg', name: 'RPG' },
  { id: 'platformer', name: 'Платформер' },
  { id: 'shooter', name: 'Шутер' },
  { id: 'puzzle', name: 'Головоломка' },
  { id: 'strategy', name: 'Стратегия' },
  { id: 'simulation', name: 'Симулятор' },
  { id: 'adventure', name: 'Приключение' },
  { id: 'action', name: 'Экшен' },
  { id: 'horror', name: 'Хоррор' },
  { id: 'racing', name: 'Гонки' },
  { id: 'sports', name: 'Спорт' },
  { id: 'fighting', name: 'Файтинг' },
  { id: 'survival', name: 'Выживание' },
  { id: 'roguelike', name: 'Рогалик' },
  { id: 'metroidvania', name: 'Метроидвания' },
  { id: 'visual_novel', name: 'Визуальная новелла' },
  { id: 'other', name: 'Другое' },
]

// Helper functions
export function getRoleName(id: string): string {
  return ROLES.find((r) => r.id === id)?.name || id
}

export function getTechnologyName(id: string): string {
  return TECHNOLOGIES.find((t) => t.id === id)?.name || id
}

export function getManagementTypeName(id: string): string {
  return MANAGEMENT_TYPES.find((m) => m.id === id)?.name || id
}

export function getDecisionSystemName(id: string): string {
  return DECISION_SYSTEMS.find((d) => d.id === id)?.name || id
}

export function getGenreName(id: string): string {
  return GENRES.find((g) => g.id === id)?.name || id
}
