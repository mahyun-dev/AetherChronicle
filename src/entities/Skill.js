import Phaser from 'phaser';

/**
 * Skill - 스킬 베이스 클래스
 */
export class Skill {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.type = config.type; // 'melee', 'ranged', 'aoe', 'buff', 'heal'
    this.icon = config.icon || 'default';
    
    // 스킬 코스트
    this.mpCost = config.mpCost || 0;
    this.cooldown = config.cooldown || 1000; // ms
    this.currentCooldown = 0;
    
    // 스킬 효과
    this.damage = config.damage || 0;
    this.damageMultiplier = config.damageMultiplier || 1.0;
    this.range = config.range || 100;
    this.radius = config.radius || 0; // AOE 범위
    this.duration = config.duration || 0; // 버프 지속시간
    this.knockbackPower = config.knockbackPower || 0; // 넉백 강도
    
    // 효과
    this.effects = config.effects || []; // { type: 'buff', stat: 'attack', value: 1.5, duration: 5000 }
    
    // 애니메이션
    this.castTime = config.castTime || 0;
    this.animationKey = config.animationKey || null;
  }

  /**
   * 스킬 사용 가능 여부
   */
  canUse(caster) {
    if (this.currentCooldown > 0) {
      console.log(`${this.name} 쿨다운 중: ${(this.currentCooldown / 1000).toFixed(1)}초 남음`);
      return false;
    }
    
    if (caster.stats.mp < this.mpCost) {
      console.log(`${this.name} MP 부족 (필요: ${this.mpCost}, 현재: ${caster.stats.mp})`);
      return false;
    }
    
    return true;
  }

  /**
   * 스킬 사용
   */
  use(caster, target = null) {
    if (!this.canUse(caster)) return false;
    
    // MP 소모
    caster.stats.mp = Math.max(0, caster.stats.mp - this.mpCost);
    if (caster.scene) {
      caster.scene.events.emit('player:mp_changed', caster.stats.mp, caster.stats.maxMp);
    }
    
    // 쿨다운 시작
    this.currentCooldown = this.cooldown;
    
    // 스킬 실행
    this.execute(caster, target);
    
    console.log(`✨ ${this.name} 사용! (MP: ${this.mpCost}, 쿨다운: ${this.cooldown / 1000}초)`);
    return true;
  }

  /**
   * 스킬 실행 (오버라이드 필요)
   */
  execute(caster, target) {
    console.warn(`${this.name} execute() 메서드가 구현되지 않았습니다.`);
  }

  /**
   * 쿨다운 업데이트
   */
  update(delta) {
    if (this.currentCooldown > 0) {
      this.currentCooldown = Math.max(0, this.currentCooldown - delta);
    }
  }

  /**
   * 쿨다운 비율 (0~1)
   */
  getCooldownRatio() {
    return this.currentCooldown / this.cooldown;
  }
}

/**
 * 스킬 생성 팩토리 함수 - 직업별 스킬 파일에서 적절한 스킬 클래스를 로드
 * @param {Object} skillData - 스킬 데이터
 * @param {string} characterClass - 캐릭터 클래스 ('warrior', 'archer', 'mage', 'rogue')
 * @returns {Skill} 스킬 인스턴스
 */
export function createSkill(skillData, characterClass) {
  const skillModules = {
    'warrior': () => require('./skills/WarriorSkills.js'),
    'archer': () => require('./skills/ArcherSkills.js'),
    'mage': () => require('./skills/MageSkills.js'),
    'rogue': () => require('./skills/RogueSkills.js')
  };

  const moduleLoader = skillModules[characterClass];
  if (!moduleLoader) {
    console.warn(`[Skill] Unknown character class: ${characterClass}, defaulting to warrior`);
    return createSkill(skillData, 'warrior');
  }

  try {
    const module = moduleLoader();

    // 스킬 타입에 따라 클래스 이름 결정
    let SkillClass;
    switch (skillData.type) {
      case 'melee':
        SkillClass = module.MeleeSkill;
        break;
      case 'ranged':
        SkillClass = module.RangedSkill;
        break;
      case 'aoe':
        SkillClass = module.AOESkill;
        break;
      case 'dash':
        SkillClass = module.DashSkill;
        break;
      case 'buff':
        SkillClass = module.BuffSkill;
        break;
      default:
        console.warn(`[Skill] Unknown skill type: ${skillData.type}, defaulting to MeleeSkill`);
        SkillClass = module.MeleeSkill;
        break;
    }

    if (!SkillClass) {
      throw new Error(`Skill class not found for type: ${skillData.type} in ${characterClass} skills`);
    }

    return new SkillClass(skillData);
  } catch (error) {
    console.error(`[Skill] Failed to load skill ${skillData.id} for ${characterClass}:`, error);
    throw error; // 폴백 제거 - 에러를 명확히 드러냄
  }
}
