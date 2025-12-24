/**
 * 게임 상수 정의
 */

// 키 입력
export const KEYS = {
  MOVE_UP: ['W', 'UP'],
  MOVE_DOWN: ['S', 'DOWN'],
  MOVE_LEFT: ['A', 'LEFT'],
  MOVE_RIGHT: ['D', 'RIGHT'],
  
  SKILL_1: 'ONE',
  SKILL_2: 'TWO',
  SKILL_3: 'THREE',
  ULTIMATE: 'R',
  
  INTERACT: 'E',
  INVENTORY: 'I',
  QUEST_LOG: 'L',
  WORLD_MAP: 'M',
  SKILL_WINDOW: 'K',
  
  QUICKSLOT_1: 'Q',
  QUICKSLOT_2: 'F',
  QUICKSLOT_3: 'Z'
};

// 아이템 등급
export const ITEM_TIER = {
  COMMON: 'common',
  ADVANCED: 'advanced',
  RARE: 'rare',
  HEROIC: 'heroic',
  LEGENDARY: 'legendary'
};

// 아이템 등급별 색상
export const TIER_COLORS = {
  [ITEM_TIER.COMMON]: 0x808080,
  [ITEM_TIER.ADVANCED]: 0x00FF00,
  [ITEM_TIER.RARE]: 0x0080FF,
  [ITEM_TIER.HEROIC]: 0x8000FF,
  [ITEM_TIER.LEGENDARY]: 0xFF8000
};

// 몬스터 등급
export const MONSTER_RANK = {
  COMMON: 'common',
  ELITE: 'elite',
  BOSS: 'boss',
  FIELD_BOSS: 'field_boss'
};

// 상태 이상
export const STATUS_EFFECT = {
  STUN: 'stun',
  SLOW: 'slow',
  POISON: 'poison',
  BLEED: 'bleed',
  SILENCE: 'silence'
};

// 레이어 깊이
export const DEPTH = {
  GROUND: 0,
  ITEMS: 5,
  SHADOWS: 8,
  ENTITIES: 10,
  PROJECTILES: 15,
  EFFECTS: 20,
  UI: 100
};

// 이벤트 이름
export const EVENTS = {
  PLAYER_HP_CHANGED: 'player:hp_changed',
  PLAYER_MP_CHANGED: 'player:mp_changed',
  PLAYER_LEVEL_UP: 'player:level_up',
  PLAYER_EXP_CHANGED: 'player:exp_changed',
  
  MONSTER_KILLED: 'monster:killed',
  ITEM_OBTAINED: 'item:obtained',
  
  QUEST_UPDATED: 'quest:updated',
  QUEST_COMPLETED: 'quest:completed',
  
  SKILL_USED: 'skill:used',
  SKILL_COOLDOWN: 'skill:cooldown'
};
