/**
 * StatusEffect - 상태 이상 시스템
 */

// 상태 이상 타입
export const StatusEffectType = {
  STUN: 'stun',        // 기절 - 이동/공격 불가
  POISON: 'poison',    // 독 - 지속 피해
  BURN: 'burn',        // 화상 - 지속 피해 (독보다 강함)
  FREEZE: 'freeze',    // 빙결 - 이동 속도 감소
  SLOW: 'slow',        // 둔화 - 이동/공격 속도 감소
  BLEED: 'bleed'       // 출혈 - 지속 피해
};

/**
 * StatusEffect 클래스
 */
export class StatusEffect {
  /**
   * @param {string} type - 상태 이상 타입
   * @param {number} duration - 지속 시간 (ms)
   * @param {object} data - 추가 데이터 (damage, slow% 등)
   */
  constructor(type, duration, data = {}) {
    this.type = type;
    this.duration = duration;
    this.remainingTime = duration;
    this.data = data;
    
    // 틱 간격 (지속 피해용)
    this.tickInterval = data.tickInterval || 1000; // 기본 1초마다
    this.lastTickTime = 0;
    
    // 활성 상태
    this.isActive = true;
  }
  
  /**
   * 상태 이상 업데이트
   * @param {number} delta - 프레임 경과 시간 (ms)
   * @param {Entity} target - 대상 엔티티
   * @returns {boolean} - 상태 이상이 여전히 활성화되어 있는지
   */
  update(delta, target) {
    if (!this.isActive) return false;
    
    this.remainingTime -= delta;
    this.lastTickTime += delta;
    
    // 틱 처리 (지속 피해)
    if (this.shouldTick() && this.lastTickTime >= this.tickInterval) {
      this.processTick(target);
      this.lastTickTime = 0;
    }
    
    // 지속 시간 종료
    if (this.remainingTime <= 0) {
      this.remove(target);
      return false;
    }
    
    return true;
  }
  
  /**
   * 틱이 필요한 상태 이상인지 확인
   */
  shouldTick() {
    return [
      StatusEffectType.POISON,
      StatusEffectType.BURN,
      StatusEffectType.BLEED
    ].includes(this.type);
  }
  
  /**
   * 틱 처리 (지속 피해)
   */
  processTick(target) {
    const damage = this.data.damage || 0;
    
    if (damage > 0 && target.takeDamage) {
      const result = target.takeDamage(damage);
      
      // 지속 피해 텍스트 표시
      if (target.scene && target.scene.showDamageText) {
        const color = this.getTickColor();
        target.scene.showDamageText(target.x, target.y - 40, result.damage, false, false, color);
      }
    }
  }
  
  /**
   * 틱 피해 색상
   */
  getTickColor() {
    switch (this.type) {
      case StatusEffectType.POISON: return '#00FF00';  // 녹색
      case StatusEffectType.BURN: return '#FF6600';    // 주황색
      case StatusEffectType.BLEED: return '#CC0000';   // 진한 빨강
      default: return '#FFFFFF';
    }
  }
  
  /**
   * 상태 이상 적용 시 효과
   */
  apply(target) {
    switch (this.type) {
      case StatusEffectType.STUN:
        target.isStunned = true;
        this.showStunEffect(target);
        break;
        
      case StatusEffectType.FREEZE:
        target.isFrozen = true;
        target.freezeSpeedReduction = this.data.slowPercent || 50;
        this.showFreezeEffect(target);
        break;
        
      case StatusEffectType.SLOW:
        target.isSlowed = true;
        target.slowSpeedReduction = this.data.slowPercent || 30;
        break;
        
      case StatusEffectType.POISON:
      case StatusEffectType.BURN:
      case StatusEffectType.BLEED:
        // 지속 피해는 틱에서 처리
        break;
    }
  }
  
  /**
   * 상태 이상 제거 시 효과
   */
  remove(target) {
    this.isActive = false;
    
    switch (this.type) {
      case StatusEffectType.STUN:
        target.isStunned = false;
        break;
        
      case StatusEffectType.FREEZE:
        target.isFrozen = false;
        target.freezeSpeedReduction = 0;
        break;
        
      case StatusEffectType.SLOW:
        target.isSlowed = false;
        target.slowSpeedReduction = 0;
        break;
    }
  }
  
  /**
   * 기절 이펙트
   */
  showStunEffect(target) {
    if (!target.scene) return;
    
    // 별 이펙트 (기절 표시)
    const stars = [];
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const radius = 30;
      const star = target.scene.add.text(
        target.x + Math.cos(angle) * radius,
        target.y - 40 + Math.sin(angle) * radius,
        '★',
        { font: '20px Arial', fill: '#FFD700' }
      );
      star.setOrigin(0.5);
      star.setDepth(target.depth + 1);
      stars.push(star);
      
      // 회전 애니메이션
      target.scene.tweens.add({
        targets: star,
        angle: 360,
        duration: this.duration,
        repeat: 0,
        onComplete: () => star.destroy()
      });
    }
  }
  
  /**
   * 빙결 이펙트
   */
  showFreezeEffect(target) {
    if (!target.scene) return;
    
    // 얼음 색조 효과
    target.setTint(0x88CCFF);
    
    // 지속 시간 후 원래대로
    target.scene.time.delayedCall(this.duration, () => {
      target.clearTint();
    });
  }
  
  /**
   * 상태 이상 아이콘 표시용 정보
   */
  getIconInfo() {
    const icons = {
      [StatusEffectType.STUN]: { emoji: '💫', color: '#FFD700' },
      [StatusEffectType.POISON]: { emoji: '☠️', color: '#00FF00' },
      [StatusEffectType.BURN]: { emoji: '🔥', color: '#FF6600' },
      [StatusEffectType.FREEZE]: { emoji: '❄️', color: '#88CCFF' },
      [StatusEffectType.SLOW]: { emoji: '🐌', color: '#CCCCCC' },
      [StatusEffectType.BLEED]: { emoji: '💉', color: '#CC0000' }
    };
    
    return icons[this.type] || { emoji: '?', color: '#FFFFFF' };
  }
}

/**
 * StatusEffectManager - 엔티티의 상태 이상 관리
 */
export class StatusEffectManager {
  constructor(entity) {
    this.entity = entity;
    this.effects = [];
    this.iconTexts = [];
  }
  
  /**
   * 상태 이상 추가
   */
  addEffect(type, duration, data = {}) {
    // 같은 타입의 상태 이상이 이미 있으면 갱신
    const existing = this.effects.find(e => e.type === type);
    if (existing) {
      existing.remainingTime = Math.max(existing.remainingTime, duration);
      existing.data = { ...existing.data, ...data };
      return existing;
    }
    
    // 새 상태 이상 생성
    const effect = new StatusEffect(type, duration, data);
    effect.apply(this.entity);
    this.effects.push(effect);
    
    this.updateIcons();
    
    return effect;
  }
  
  /**
   * 상태 이상 제거
   */
  removeEffect(type) {
    const index = this.effects.findIndex(e => e.type === type);
    if (index >= 0) {
      this.effects[index].remove(this.entity);
      this.effects.splice(index, 1);
      this.updateIcons();
    }
  }
  
  /**
   * 모든 상태 이상 제거
   */
  clearAll() {
    this.effects.forEach(effect => effect.remove(this.entity));
    this.effects = [];
    this.clearIcons();
  }
  
  /**
   * 특정 타입의 상태 이상이 있는지 확인
   */
  hasEffect(type) {
    return this.effects.some(e => e.type === type && e.isActive);
  }
  
  /**
   * 업데이트
   */
  update(delta) {
    // 상태 이상 업데이트 및 만료된 것 제거
    this.effects = this.effects.filter(effect => effect.update(delta, this.entity));
    
    // 아이콘 업데이트
    this.updateIcons();
  }
  
  /**
   * 상태 이상 아이콘 업데이트
   */
  updateIcons() {
    // 기존 아이콘 제거
    this.clearIcons();
    
    if (!this.entity.scene) return;
    
    // 활성 상태 이상 아이콘 표시
    this.effects.forEach((effect, index) => {
      const iconInfo = effect.getIconInfo();
      const icon = this.entity.scene.add.text(
        this.entity.x - 20 + (index * 15),
        this.entity.y - 50,
        iconInfo.emoji,
        { font: '16px Arial' }
      );
      icon.setOrigin(0.5);
      icon.setDepth(this.entity.depth + 10);
      this.iconTexts.push(icon);
    });
  }
  
  /**
   * 아이콘 제거
   */
  clearIcons() {
    this.iconTexts.forEach(icon => icon.destroy());
    this.iconTexts = [];
  }
  
  /**
   * 정리
   */
  destroy() {
    this.clearAll();
  }
}
