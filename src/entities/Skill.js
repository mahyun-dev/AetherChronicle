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
    
    // 스킬 데이터 저장 (아이콘 표시용)
    this.skillData = config;
    
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
    
    console.log(`[Skill] ${this.name} execute 호출, caster:`, caster, 'target:', target);
    // 스킬 실행
    const executeResult = this.execute(caster, target?.x, target?.y);
    
    // execute()가 true를 반환할 때만 쿨다운 적용 (SystemSkill처럼 창 열기만 하는 스킬은 쿨다운 적용 안 함)
    if (executeResult !== false) {
      // 쿨다운 감소 효과 적용
      let actualCooldown = this.cooldown;
      if (caster.equipmentEffects) {
        const reduction = caster.equipmentEffects.getCooldownReduction();
        actualCooldown = Math.floor(this.cooldown * (1 - reduction));
      }
      
      // 쿨다운 시작
      this.currentCooldown = actualCooldown;
    }
    
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
  // 스킬 ID를 기반으로 실제 스킬이 속한 클래스를 결정
  let actualClass = characterClass;
  if (skillData.id.startsWith('warrior_skill_')) {
    actualClass = 'warrior';
  } else if (skillData.id.startsWith('mage_skill_')) {
    actualClass = 'mage';
  } else if (skillData.id.startsWith('archer_skill_')) {
    actualClass = 'archer';
  } else if (skillData.id.startsWith('rogue_skill_')) {
    actualClass = 'rogue';
  } else if (skillData.id.startsWith('fusionist_')) {
    actualClass = 'fusionist';
  } else if (skillData.id.startsWith('fusion_')) {
    // 융합 스킬은 타입에 따라 적절한 클래스를 사용
    actualClass = characterClass; // 융합술사가 융합 스킬을 사용하므로 characterClass 유지
  }

  console.log(`[Skill] Creating skill ${skillData.id} for character class ${characterClass}, using ${actualClass} skill module`);

  const skillModules = {
    'warrior': () => require('./skills/WarriorSkills.js'),
    'archer': () => require('./skills/ArcherSkills.js'),
    'mage': () => require('./skills/MageSkills.js'),
    'rogue': () => require('./skills/RogueSkills.js'),
    'fusionist': () => require('./skills/FusionistSkills.js')
  };

  const moduleLoader = skillModules[actualClass];
  if (!moduleLoader) {
    console.warn(`[Skill] Unknown character class: ${actualClass}, defaulting to warrior`);
    return createSkill(skillData, 'warrior');
  }

  try {
    const module = moduleLoader();

    // 융합 스킬 처리 (fusion_으로 시작하는 ID)
    if (skillData.id.startsWith('fusion_')) {
      // 융합 스킬은 타입에 따라 적절한 클래스를 사용
      switch (skillData.type) {
        case 'melee':
          return new module.MeleeSkill(skillData);
        case 'ranged':
          return new module.RangedSkill(skillData);
        case 'aoe':
          return new module.AOESkill(skillData);
        case 'dash':
          return new module.DashSkill(skillData);
        case 'buff':
          return new module.BuffSkill(skillData);
        case 'projectile':
          return module.createProjectileSkill(skillData, null);
        case 'barrier':
          return module.createBarrierSkill(skillData, null);
        default:
          console.warn(`[Skill] Unknown fusion skill type: ${skillData.type}, using base Skill`);
          return new Skill(skillData);
      }
    }

    // fusionist의 경우 각 타입에 맞는 create 함수 사용
    if (actualClass === 'fusionist') {
      switch (skillData.type) {
        case 'projectile':
          console.log(`[Skill] Creating projectile skill for ${skillData.id}`);
          const projectileSkill = module.createProjectileSkill(skillData, null);
          console.log(`[Skill] Created projectile skill:`, projectileSkill);
          return projectileSkill;
        case 'barrier':
          console.log(`[Skill] Creating barrier skill for ${skillData.id}`);
          return module.createBarrierSkill(skillData, null);
        case 'aoe':
          console.log(`[Skill] Creating wave skill for ${skillData.id}`);
          return module.createWaveSkill(skillData, null);
        case 'system':
          console.log(`[Skill] Creating SystemSkill for ${skillData.id}, module.SystemSkill:`, module.SystemSkill);
          return new module.SystemSkill(skillData);
        case 'passive':
          return module.createPassiveSkill(skillData, null);
        default:
          console.warn(`[Skill] Unknown fusionist skill type: ${skillData.type}`);
          return new Skill(skillData);
      }
    }

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
      case 'projectile':
        // projectile 타입은 create 함수 사용
        return module.createProjectileSkill(skillData, null); // caster는 나중에 설정
      case 'barrier':
        return module.createBarrierSkill(skillData, null);
      case 'system':
        if (actualClass === 'fusionist') {
          SkillClass = module.SystemSkill;
        } else {
          console.warn(`[Skill] System skills only available for fusionist, using base Skill class`);
          return new Skill(skillData); // 기본 Skill 클래스 사용
        }
        break;
      default:
        console.warn(`[Skill] Unknown skill type: ${skillData.type}, defaulting to MeleeSkill`);
        SkillClass = module.MeleeSkill;
        break;
    }

    if (!SkillClass) {
      throw new Error(`Skill class not found for type: ${skillData.type} in ${actualClass} skills`);
    }

    return new SkillClass(skillData);
  } catch (error) {
    console.error(`[Skill] Failed to load skill ${skillData.id} for ${actualClass}:`, error);
    throw error; // 폴백 제거 - 에러를 명확히 드러냄
  }
}
