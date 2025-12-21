/**
 * EquipmentEffects - 장비 특수 효과 관리 시스템
 */
export class EquipmentEffects {
  constructor(player) {
    this.player = player;
    this.activeEffects = new Map(); // 효과 타입별로 저장
    this.hpRegenAccumulator = 0; // HP 재생 누적 시간
    this.mpRegenAccumulator = 0; // MP 재생 누적 시간
  }

  /**
   * 장비 착용 시 효과 적용
   */
  applyEquipmentEffects(equipment) {
    if (!equipment.specialEffects || equipment.specialEffects.length === 0) return;

    equipment.specialEffects.forEach(effect => {
      this.parseAndApplyEffect(effect, equipment);
    });
  }

  /**
   * 장비 해제 시 효과 제거
   */
  removeEquipmentEffects(equipment) {
    if (!equipment.specialEffects || equipment.specialEffects.length === 0) return;

    equipment.specialEffects.forEach(effect => {
      this.parseAndRemoveEffect(effect, equipment);
    });
  }

  /**
   * 효과 파싱 및 적용
   */
  parseAndApplyEffect(effectText, equipment) {
    // 효과 텍스트를 파싱하여 적용
    if (effectText.includes('공격 시') && effectText.includes('기절')) {
      this.applyStunOnAttackEffect(effectText, equipment);
    } else if (effectText.includes('용족에게') && effectText.includes('추가 피해')) {
      this.applyDragonDamageEffect(effectText, equipment);
    } else if (effectText.includes('화염 폭발')) {
      this.applyFireExplosionEffect(effectText, equipment);
    } else if (effectText.includes('관통 확률')) {
      this.applyPierceEffect(effectText, equipment);
    } else if (effectText.includes('마나 재생 속도')) {
      this.applyManaRegenEffect(effectText, equipment);
    } else if (effectText.includes('스킬 쿨다운')) {
      this.applyCooldownReductionEffect(effectText, equipment);
    } else if (effectText.includes('백어택')) {
      this.applyBackstabEffect(effectText, equipment);
    } else if (effectText.includes('출혈 피해')) {
      this.applyBleedOnCritEffect(effectText, equipment);
    } else if (effectText.includes('기절 저항')) {
      this.applyStunResistanceEffect(effectText, equipment);
    } else if (effectText.includes('받는 물리 피해')) {
      this.applyPhysicalDamageReductionEffect(effectText, equipment);
    } else if (effectText.includes('받는 모든 피해')) {
      this.applyAllDamageReductionEffect(effectText, equipment);
    } else if (effectText.includes('화염 면역')) {
      this.applyFireImmunityEffect(effectText, equipment);
    } else if (effectText.includes('HP 재생')) {
      this.applyHpRegenEffect(effectText, equipment);
    } else if (effectText.includes('사망 시') && effectText.includes('부활')) {
      this.applyReviveOnDeathEffect(effectText, equipment);
    } else if (effectText.includes('HP 50% 이하일 때 공격력')) {
      this.applyLowHpAttackBoostEffect(effectText, equipment);
    }
  }

  /**
   * 효과 파싱 및 제거
   */
  parseAndRemoveEffect(effectText, equipment) {
    // 효과 제거 로직 (적용의 반대)
    if (effectText.includes('공격 시') && effectText.includes('기절')) {
      this.removeStunOnAttackEffect(effectText, equipment);
    } else if (effectText.includes('용족에게') && effectText.includes('추가 피해')) {
      this.removeDragonDamageEffect(effectText, equipment);
    } else if (effectText.includes('화염 폭발')) {
      this.removeFireExplosionEffect(effectText, equipment);
    } else if (effectText.includes('관통 확률')) {
      this.removePierceEffect(effectText, equipment);
    } else if (effectText.includes('마나 재생 속도')) {
      this.removeManaRegenEffect(effectText, equipment);
    } else if (effectText.includes('스킬 쿨다운')) {
      this.removeCooldownReductionEffect(effectText, equipment);
    } else if (effectText.includes('백어택')) {
      this.removeBackstabEffect(effectText, equipment);
    } else if (effectText.includes('출혈 피해')) {
      this.removeBleedOnCritEffect(effectText, equipment);
    } else if (effectText.includes('기절 저항')) {
      this.removeStunResistanceEffect(effectText, equipment);
    } else if (effectText.includes('받는 물리 피해')) {
      this.removePhysicalDamageReductionEffect(effectText, equipment);
    } else if (effectText.includes('받는 모든 피해')) {
      this.removeAllDamageReductionEffect(effectText, equipment);
    } else if (effectText.includes('화염 면역')) {
      this.removeFireImmunityEffect(effectText, equipment);
    } else if (effectText.includes('HP 재생')) {
      this.removeHpRegenEffect(effectText, equipment);
    } else if (effectText.includes('HP 50% 이하일 때 공격력')) {
      this.removeLowHpAttackBoostEffect(effectText, equipment);
    }
  }

  // ===== 공격 시 효과들 =====

  /**
   * 공격 시 기절 효과
   */
  applyStunOnAttackEffect(effectText, equipment) {
    const match = effectText.match(/공격 시 (\d+)% 확률로 적을 (\d+)초간 기절/);
    if (!match) return;

    const chance = parseInt(match[1]) / 100;
    const duration = parseInt(match[2]) * 1000; // 초를 ms로 변환

    const effectId = `stun_on_attack_${equipment.id}`;
    this.activeEffects.set(effectId, {
      type: 'stun_on_attack',
      chance: chance,
      duration: duration,
      equipment: equipment
    });

    console.log(`[EquipmentEffects] ${equipment.name}: 공격 시 ${chance * 100}% 확률로 ${duration/1000}초 기절 효과 적용`);
  }

  removeStunOnAttackEffect(effectText, equipment) {
    const effectId = `stun_on_attack_${equipment.id}`;
    this.activeEffects.delete(effectId);
    console.log(`[EquipmentEffects] ${equipment.name}: 공격 시 기절 효과 제거`);
  }

  /**
   * 용족 추가 피해 효과
   */
  applyDragonDamageEffect(effectText, equipment) {
    const match = effectText.match(/용족에게 (\d+)% 추가 피해/);
    if (!match) return;

    const bonus = parseInt(match[1]) / 100;

    const effectId = `dragon_damage_${equipment.id}`;
    this.activeEffects.set(effectId, {
      type: 'dragon_damage',
      bonus: bonus,
      equipment: equipment
    });

    console.log(`[EquipmentEffects] ${equipment.name}: 용족에게 ${bonus * 100}% 추가 피해 효과 적용`);
  }

  removeDragonDamageEffect(effectText, equipment) {
    const effectId = `dragon_damage_${equipment.id}`;
    this.activeEffects.delete(effectId);
    console.log(`[EquipmentEffects] ${equipment.name}: 용족 추가 피해 효과 제거`);
  }

  /**
   * 화염 폭발 효과
   */
  applyFireExplosionEffect(effectText, equipment) {
    const match = effectText.match(/공격 시 (\d+)% 확률로 화염 폭발 \((\d+)% 추가 피해\)/);
    if (!match) return;

    const chance = parseInt(match[1]) / 100;
    const damageBonus = parseInt(match[2]) / 100;

    const effectId = `fire_explosion_${equipment.id}`;
    this.activeEffects.set(effectId, {
      type: 'fire_explosion',
      chance: chance,
      damageBonus: damageBonus,
      equipment: equipment
    });

    console.log(`[EquipmentEffects] ${equipment.name}: 공격 시 ${chance * 100}% 확률로 화염 폭발(${damageBonus * 100}% 추가 피해) 효과 적용`);
  }

  removeFireExplosionEffect(effectText, equipment) {
    const effectId = `fire_explosion_${equipment.id}`;
    this.activeEffects.delete(effectId);
    console.log(`[EquipmentEffects] ${equipment.name}: 화염 폭발 효과 제거`);
  }

  /**
   * 관통 효과
   */
  applyPierceEffect(effectText, equipment) {
    const match = effectText.match(/관통 확률 (\d+)%/);
    if (!match) return;

    const chance = parseInt(match[1]) / 100;

    const effectId = `pierce_${equipment.id}`;
    this.activeEffects.set(effectId, {
      type: 'pierce',
      chance: chance,
      equipment: equipment
    });

    console.log(`[EquipmentEffects] ${equipment.name}: ${chance * 100}% 관통 확률 효과 적용`);
  }

  removePierceEffect(effectText, equipment) {
    const effectId = `pierce_${equipment.id}`;
    this.activeEffects.delete(effectId);
    console.log(`[EquipmentEffects] ${equipment.name}: 관통 확률 효과 제거`);
  }

  /**
   * 백어택 효과
   */
  applyBackstabEffect(effectText, equipment) {
    const match = effectText.match(/백어택 시 피해 \+(\d+)%/);
    if (!match) return;

    const bonus = parseInt(match[1]) / 100;

    const effectId = `backstab_${equipment.id}`;
    this.activeEffects.set(effectId, {
      type: 'backstab',
      bonus: bonus,
      equipment: equipment
    });

    console.log(`[EquipmentEffects] ${equipment.name}: 백어택 시 ${bonus * 100}% 추가 피해 효과 적용`);
  }

  removeBackstabEffect(effectText, equipment) {
    const effectId = `backstab_${equipment.id}`;
    this.activeEffects.delete(effectId);
    console.log(`[EquipmentEffects] ${equipment.name}: 백어택 효과 제거`);
  }

  /**
   * 크리티컬 시 출혈 효과
   */
  applyBleedOnCritEffect(effectText, equipment) {
    const match = effectText.match(/치명타 시 (\d+)초간 출혈 피해 \(초당 (\d+)\)/);
    if (!match) return;

    const duration = parseInt(match[1]) * 1000;
    const damagePerSecond = parseInt(match[2]);

    const effectId = `bleed_on_crit_${equipment.id}`;
    this.activeEffects.set(effectId, {
      type: 'bleed_on_crit',
      duration: duration,
      damagePerSecond: damagePerSecond,
      equipment: equipment
    });

    console.log(`[EquipmentEffects] ${equipment.name}: 크리티컬 시 ${duration/1000}초간 출혈(초당 ${damagePerSecond}) 효과 적용`);
  }

  removeBleedOnCritEffect(effectText, equipment) {
    const effectId = `bleed_on_crit_${equipment.id}`;
    this.activeEffects.delete(effectId);
    console.log(`[EquipmentEffects] ${equipment.name}: 크리티컬 출혈 효과 제거`);
  }

  // ===== 방어/저항 효과들 =====

  /**
   * 기절 저항 효과
   */
  applyStunResistanceEffect(effectText, equipment) {
    const match = effectText.match(/기절 저항 \+(\d+)%/);
    if (!match) return;

    const resistance = parseInt(match[1]) / 100;

    const effectId = `stun_resistance_${equipment.id}`;
    this.activeEffects.set(effectId, {
      type: 'stun_resistance',
      resistance: resistance,
      equipment: equipment
    });

    console.log(`[EquipmentEffects] ${equipment.name}: 기절 저항 +${resistance * 100}% 효과 적용`);
  }

  removeStunResistanceEffect(effectText, equipment) {
    const effectId = `stun_resistance_${equipment.id}`;
    this.activeEffects.delete(effectId);
    console.log(`[EquipmentEffects] ${equipment.name}: 기절 저항 효과 제거`);
  }

  /**
   * 물리 피해 감소 효과
   */
  applyPhysicalDamageReductionEffect(effectText, equipment) {
    const match = effectText.match(/받는 물리 피해 -(\d+)%/);
    if (!match) return;

    const reduction = parseInt(match[1]) / 100;

    const effectId = `physical_damage_reduction_${equipment.id}`;
    this.activeEffects.set(effectId, {
      type: 'physical_damage_reduction',
      reduction: reduction,
      equipment: equipment
    });

    console.log(`[EquipmentEffects] ${equipment.name}: 물리 피해 -${reduction * 100}% 효과 적용`);
  }

  removePhysicalDamageReductionEffect(effectText, equipment) {
    const effectId = `physical_damage_reduction_${equipment.id}`;
    this.activeEffects.delete(effectId);
    console.log(`[EquipmentEffects] ${equipment.name}: 물리 피해 감소 효과 제거`);
  }

  /**
   * 모든 피해 감소 효과
   */
  applyAllDamageReductionEffect(effectText, equipment) {
    const match = effectText.match(/받는 모든 피해 -(\d+)%/);
    if (!match) return;

    const reduction = parseInt(match[1]) / 100;

    const effectId = `all_damage_reduction_${equipment.id}`;
    this.activeEffects.set(effectId, {
      type: 'all_damage_reduction',
      reduction: reduction,
      equipment: equipment
    });

    console.log(`[EquipmentEffects] ${equipment.name}: 모든 피해 -${reduction * 100}% 효과 적용`);
  }

  removeAllDamageReductionEffect(effectText, equipment) {
    const effectId = `all_damage_reduction_${equipment.id}`;
    this.activeEffects.delete(effectId);
    console.log(`[EquipmentEffects] ${equipment.name}: 모든 피해 감소 효과 제거`);
  }

  /**
   * 화염 면역 효과
   */
  applyFireImmunityEffect(effectText, equipment) {
    const effectId = `fire_immunity_${equipment.id}`;
    this.activeEffects.set(effectId, {
      type: 'fire_immunity',
      equipment: equipment
    });

    console.log(`[EquipmentEffects] ${equipment.name}: 화염 면역 효과 적용`);
  }

  removeFireImmunityEffect(effectText, equipment) {
    const effectId = `fire_immunity_${equipment.id}`;
    this.activeEffects.delete(effectId);
    console.log(`[EquipmentEffects] ${equipment.name}: 화염 면역 효과 제거`);
  }

  // ===== 회복/지속 효과들 =====

  /**
   * 마나 재생 효과
   */
  applyManaRegenEffect(effectText, equipment) {
    const match = effectText.match(/마나 재생 속도 \+(\d+)%/);
    if (!match) return;

    const bonus = parseInt(match[1]) / 100;

    const effectId = `mana_regen_${equipment.id}`;
    this.activeEffects.set(effectId, {
      type: 'mana_regen',
      bonus: bonus,
      equipment: equipment
    });

    console.log(`[EquipmentEffects] ${equipment.name}: 마나 재생 속도 +${bonus * 100}% 효과 적용`);
  }

  removeManaRegenEffect(effectText, equipment) {
    const effectId = `mana_regen_${equipment.id}`;
    this.activeEffects.delete(effectId);
    console.log(`[EquipmentEffects] ${equipment.name}: 마나 재생 효과 제거`);
  }

  /**
   * HP 재생 효과
   */
  applyHpRegenEffect(effectText, equipment) {
    const match = effectText.match(/HP 재생 \+(\d+)\/초/);
    if (!match) return;

    const regenPerSecond = parseInt(match[1]);

    const effectId = `hp_regen_${equipment.id}`;
    this.activeEffects.set(effectId, {
      type: 'hp_regen',
      regenPerSecond: regenPerSecond,
      equipment: equipment
    });

    console.log(`[EquipmentEffects] ${equipment.name}: HP 재생 +${regenPerSecond}/초 효과 적용`);
  }

  removeHpRegenEffect(effectText, equipment) {
    const effectId = `hp_regen_${equipment.id}`;
    this.activeEffects.delete(effectId);
    console.log(`[EquipmentEffects] ${equipment.name}: HP 재생 효과 제거`);
  }

  /**
   * 사망 시 부활 효과
   */
  applyReviveOnDeathEffect(effectText, equipment) {
    const match = effectText.match(/사망 시 1회 부활 \(HP (\d+)% 회복, 쿨타임 (\d+)분\)/);
    if (!match) return;

    const hpPercent = parseInt(match[1]);
    const cooldownMinutes = parseInt(match[2]);

    const effectId = `revive_on_death_${equipment.id}`;
    this.activeEffects.set(effectId, {
      type: 'revive_on_death',
      hpPercent: hpPercent,
      cooldownMinutes: cooldownMinutes,
      used: false, // 사용 여부 추적
      equipment: equipment
    });

    console.log(`[EquipmentEffects] ${equipment.name}: 사망 시 부활 효과 적용 (HP ${hpPercent}% 회복, 쿨타임 ${cooldownMinutes}분)`);
  }

  removeReviveOnDeathEffect(effectText, equipment) {
    const effectId = `revive_on_death_${equipment.id}`;
    this.activeEffects.delete(effectId);
    console.log(`[EquipmentEffects] ${equipment.name}: 사망 시 부활 효과 제거`);
  }

  /**
   * 사망 시 부활 시도
   */
  tryReviveOnDeath() {
    for (const [effectId, effect] of this.activeEffects) {
      if (effect.type === 'revive_on_death' && !effect.used) {
        // 부활 실행
        const reviveHp = Math.floor(this.player.stats.maxHp * (effect.hpPercent / 100));
        this.player.stats.hp = Math.min(this.player.stats.maxHp, reviveHp);
        
        // UI 업데이트
        if (this.player.scene.uiScene) {
          this.player.scene.uiScene.updateHP(this.player.stats.hp, this.player.stats.maxHp);
        }
        
        // 효과 사용 표시
        effect.used = true;
        
        console.log(`[EquipmentEffects] 플레이어 부활! HP ${reviveHp} 회복`);
        return true; // 부활 성공
      }
    }
    return false; // 부활 실패
  }

  /**
   * 스킬 쿨다운 감소 효과
   */
  applyCooldownReductionEffect(effectText, equipment) {
    const match = effectText.match(/스킬 쿨다운 -(\d+)%/);
    if (!match) return;

    const reduction = parseInt(match[1]) / 100;

    const effectId = `cooldown_reduction_${equipment.id}`;
    this.activeEffects.set(effectId, {
      type: 'cooldown_reduction',
      reduction: reduction,
      equipment: equipment
    });

    console.log(`[EquipmentEffects] ${equipment.name}: 스킬 쿨다운 -${reduction * 100}% 효과 적용`);
  }

  removeCooldownReductionEffect(effectText, equipment) {
    const effectId = `cooldown_reduction_${equipment.id}`;
    this.activeEffects.delete(effectId);
    console.log(`[EquipmentEffects] ${equipment.name}: 스킬 쿨다운 감소 효과 제거`);
  }

  /**
   * HP 낮을 때 공격력 증가 효과
   */
  applyLowHpAttackBoostEffect(effectText, equipment) {
    const match = effectText.match(/HP 50% 이하일 때 공격력 \+(\d+)%/);
    if (!match) return;

    const bonus = parseInt(match[1]) / 100;

    const effectId = `low_hp_attack_boost_${equipment.id}`;
    this.activeEffects.set(effectId, {
      type: 'low_hp_attack_boost',
      bonus: bonus,
      equipment: equipment
    });

    console.log(`[EquipmentEffects] ${equipment.name}: HP 50% 이하일 때 공격력 +${bonus * 100}% 효과 적용`);
  }

  removeLowHpAttackBoostEffect(effectText, equipment) {
    const effectId = `low_hp_attack_boost_${equipment.id}`;
    this.activeEffects.delete(effectId);
    console.log(`[EquipmentEffects] ${equipment.name}: HP 낮을 때 공격력 증가 효과 제거`);
  }

  // ===== 효과 적용 메소드들 =====

  /**
   * 공격 시 효과 적용 (Player.attack에서 호출)
   */
  applyAttackEffects(target, damage, isCritical, isBackAttack) {
    let modifiedDamage = damage;
    let appliedEffects = [];

    // 각 효과 적용
    for (const [effectId, effect] of this.activeEffects) {
      switch (effect.type) {
        case 'stun_on_attack':
          if (this.applyStunOnAttack(target, effect)) {
            appliedEffects.push('기절');
          }
          break;

        case 'dragon_damage':
          modifiedDamage = this.applyDragonDamage(target, modifiedDamage, effect);
          break;

        case 'fire_explosion':
          modifiedDamage = this.applyFireExplosion(target, modifiedDamage, effect);
          break;

        case 'pierce':
          modifiedDamage = this.applyPierce(target, modifiedDamage, effect);
          break;

        case 'backstab':
          if (isBackAttack) {
            modifiedDamage = this.applyBackstabDamage(modifiedDamage, effect);
            appliedEffects.push('백어택');
          }
          break;

        case 'bleed_on_crit':
          if (isCritical) {
            this.applyBleedOnCrit(target, effect);
            appliedEffects.push('출혈');
          }
          break;

        case 'low_hp_attack_boost':
          if (this.player.stats.hp / this.player.stats.maxHp <= 0.5) {
            modifiedDamage = this.applyLowHpAttackBoost(modifiedDamage, effect);
            appliedEffects.push('저력');
          }
          break;
      }
    }

    return { damage: modifiedDamage, appliedEffects };
  }

  /**
   * 방어 시 효과 적용 (Entity.takeDamage에서 호출)
   */
  applyDefenseEffects(damage, damageType = 'physical') {
    let modifiedDamage = damage;

    for (const [effectId, effect] of this.activeEffects) {
      switch (effect.type) {
        case 'physical_damage_reduction':
          if (damageType === 'physical') {
            modifiedDamage *= (1 - effect.reduction);
          }
          break;

        case 'all_damage_reduction':
          modifiedDamage *= (1 - effect.reduction);
          break;

        case 'fire_immunity':
          if (damageType === 'fire') {
            modifiedDamage = 0;
          }
          break;

        case 'stun_resistance':
          // 기절 저항은 StatusEffectManager에서 처리
          break;
      }
    }

    return modifiedDamage;
  }

  /**
   * 지속 효과 적용 (Player.update에서 호출)
   */
  applyPassiveEffects(delta) {
    for (const [effectId, effect] of this.activeEffects) {
      switch (effect.type) {
        case 'mana_regen':
          this.applyManaRegen(delta, effect);
          break;

        case 'hp_regen':
          this.applyHpRegen(delta, effect);
          break;
      }
    }
  }

  /**
   * 스킬 쿨다운 감소 적용
   */
  getCooldownReduction() {
    let totalReduction = 0;
    for (const [effectId, effect] of this.activeEffects) {
      if (effect.type === 'cooldown_reduction') {
        totalReduction += effect.reduction;
      }
    }
    return totalReduction;
  }

  // ===== 개별 효과 구현 =====

  applyStunOnAttack(target, effect) {
    if (Math.random() < effect.chance) {
      target.applyStun(effect.duration);
      return true;
    }
    return false;
  }

  applyDragonDamage(target, damage, effect) {
    if (target.monsterType === 'dragon') {
      return damage * (1 + effect.bonus);
    }
    return damage;
  }

  applyFireExplosion(target, damage, effect) {
    if (Math.random() < effect.chance) {
      const explosionDamage = damage * effect.damageBonus;
      target.takeDamage(explosionDamage, this.player);
      // 화염 효과 표시
      this.showFireExplosionEffect(target.x, target.y);
      return damage; // 원래 피해는 그대로
    }
    return damage;
  }

  applyPierce(target, damage, effect) {
    if (Math.random() < effect.chance) {
      // 방어력 무시 - 원래 피해의 100% 적용
      const pierceDamage = Math.max(1, damage); // 최소 1 피해
      return pierceDamage;
    }
    return damage;
  }

  applyBackstabDamage(damage, effect) {
    return damage * (1 + effect.bonus);
  }

  applyBleedOnCrit(target, effect) {
    target.applyBleed(effect.duration, effect.damagePerSecond);
  }

  applyLowHpAttackBoost(damage, effect) {
    return damage * (1 + effect.bonus);
  }

  applyManaRegen(delta, effect) {
    this.mpRegenAccumulator += delta;
    
    // 1초마다 회복
    if (this.mpRegenAccumulator >= 1000) {
      const regenAmount = Math.floor((this.player.stats.maxMp * effect.bonus)); // 초당 최대 마나의 bonus% 회복
      if (regenAmount > 0) {
        this.player.stats.mp = Math.min(this.player.stats.maxMp, this.player.stats.mp + regenAmount);
        // UI 즉시 업데이트
        if (this.player.scene.uiScene) {
          this.player.scene.uiScene.updateMP(this.player.stats.mp, this.player.stats.maxMp);
        }
      }
      this.mpRegenAccumulator -= 1000;
    }
  }

  applyHpRegen(delta, effect) {
    this.hpRegenAccumulator += delta;
    
    // 1초마다 회복
    if (this.hpRegenAccumulator >= 1000) {
      const regenAmount = effect.regenPerSecond; // 초당 회복량
      if (regenAmount > 0) {
        const oldHp = this.player.stats.hp;
        this.player.stats.hp = Math.min(this.player.stats.maxHp, this.player.stats.hp + regenAmount);
        console.log(`[EquipmentEffects] HP 재생: ${oldHp} -> ${this.player.stats.hp} (+${regenAmount})`);
        // UI 즉시 업데이트
        if (this.player.scene.uiScene) {
          this.player.scene.uiScene.updateHP(this.player.stats.hp, this.player.stats.maxHp);
        }
      }
      this.hpRegenAccumulator -= 1000;
    }
  }

  showFireExplosionEffect(x, y) {
    // 화염 폭발 효과 표시 (임시 구현)
    const explosion = this.player.scene.add.circle(x, y, 30, 0xFF4400, 0.6);
    explosion.setDepth(100);
    this.player.scene.time.delayedCall(300, () => {
      explosion.destroy();
    });
  }
}