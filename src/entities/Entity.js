import Phaser from 'phaser';
import { StatusEffectManager } from './StatusEffect.js';

/**
 * Entity - 모든 게임 엔티티의 베이스 클래스
 * 플레이어, 몬스터, NPC 등이 상속받음
 */
export class Entity extends Phaser.GameObjects.Container {
  constructor(scene, x, y, config = {}) {
    super(scene, x, y);
    
    this.scene = scene;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // 기본 스탯
    this.stats = {
      maxHp: config.maxHp || 100,
      hp: config.hp || config.maxHp || 100,
      maxMp: config.maxMp || 50,
      mp: config.mp || config.maxMp || 50,
      speed: config.speed || 200,
      attack: config.attack || 10,
      defense: config.defense || 0,
      critRate: config.critRate || 5, // 크리티컬 확률 (%)
      critDamage: config.critDamage || 150, // 크리티컬 피해 (%)
      evasion: config.evasion || 0, // 회피율 (%)
      str: config.str || 10, // 힘
      dex: config.dex || 10, // 민첩
      int: config.int || 10, // 지능
      vit: config.vit || 10, // 체력
      attackSpeed: config.attackSpeed || 1.0, // 공격 속도
      moveSpeed: config.moveSpeed || 1.0 // 이동 속도 보너스
    };
    
    // 상태
    this.isDead = false;
    this.isInvincible = false;
    this.isStunned = false;  // 기절
    this.isFrozen = false;   // 빙결
    this.isSlowed = false;   // 둔화
    this.freezeSpeedReduction = 0;
    this.slowSpeedReduction = 0;
    this.isKnockedBack = false;  // 넉백 중
    this.knockbackVelocity = { x: 0, y: 0 };
    
    // 상태 이상 관리자
    this.statusEffects = new StatusEffectManager(this);
    
    // 체력바 생성 (선택적)
    if (config.showHealthBar) {
      this.createHealthBar();
    }
  }

  /**
   * HP 변경 (공격자, 피해량, 크리티컬 여부 반환)
   */
  takeDamage(damage, attacker = null) {
    if (this.isDead || this.isInvincible) return { damage: 0, isCrit: false, isEvaded: false };
    
    // 회피 체크
    const evadeRoll = Math.random() * 100;
    if (evadeRoll < this.stats.evasion) {
      console.log(`⚡ 회피 성공! (${this.stats.evasion}%)`);
      this.onEvaded();
      return { damage: 0, isCrit: false, isEvaded: true };
    }
    
    // 크리티컬 체크 (공격자가 있을 경우)
    let isCritical = false;
    let finalDamage = damage;
    
    if (attacker && attacker.stats) {
      const critRoll = Math.random() * 100;
      if (critRoll < attacker.stats.critRate) {
        isCritical = true;
        finalDamage = Math.floor(damage * (attacker.stats.critDamage / 100));
        console.log(`💥 크리티컬! (${attacker.stats.critRate}%) ${damage} → ${finalDamage}`);
      }
    }
    
    // 방어 자세 피해 감소 적용
    if (this.damageReduction) {
      finalDamage = Math.floor(finalDamage * (1 - this.damageReduction));
      console.log(`🛡️ 피해 감소: ${finalDamage}`);
    }
    
    // 방어력 적용
    const actualDamage = Math.max(1, finalDamage - this.stats.defense);
    this.stats.hp = Math.max(0, this.stats.hp - actualDamage);
    
    // HP 변경 이벤트 발생
    if (this.onHpChanged) {
      this.onHpChanged();
    }
    
    // 피해 효과
    this.onDamaged(actualDamage, isCritical);
    
    // 사망 체크
    if (this.stats.hp <= 0) {
      this.die();
    }

    // 독 효과 적용 (공격자가 플레이어이고 독 칠하기 버프가 있는 경우)
    if (attacker && attacker.constructor.name === 'Player' && attacker.hasPoisonCoat && attacker.poisonCoatEffects) {
      this.applyPoisonEffects(attacker.poisonCoatEffects, attacker);
      // 독 칠하기 버프 제거 (1회용)
      attacker.hasPoisonCoat = false;
      attacker.poisonCoatEffects = null;
      console.log(`🧪 독 효과 발동!`);
    }
    
    // 투사체 독 효과 적용 (화살 등에 독이 묻은 경우)
    if (attacker && attacker.poisonDamage && attacker.poisonDuration) {
      this.applyPoison(attacker.poisonDamage, attacker.poisonDuration);
      console.log(`🏹 독 화살 효과 발동! 데미지: ${attacker.poisonDamage}, 지속시간: ${attacker.poisonDuration}ms`);
    }
    
    return { damage: actualDamage, isCrit: isCritical, isEvaded: false };
  }

  /**
   * 독 효과 적용
   */
  applyPoisonEffects(effects, attacker) {
    effects.forEach(effect => {
      if (effect.type === 'poison') {
        // 독 피해 적용
        this.applyPoison(effect.damage, effect.duration);
      } else if (effect.type === 'debuff') {
        // 디버프 적용
        this.applyDebuff(effect);
      }
    });
  }

  /**
   * 독 피해 적용
   */
  applyPoison(damage, duration) {
    if (this.isDead) return;

    // 독 아이콘 표시 (임시)
    const poisonIcon = this.scene.add.text(this.x, this.y - 40, '🧪', { fontSize: '16px' });
    poisonIcon.setDepth(200);
    
    // 지속 피해
    let poisonTicks = Math.floor(duration / 1000); // 초당 1틱
    const poisonTimer = this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.isDead) {
          poisonTimer.remove();
          poisonIcon.destroy();
          return;
        }
        
        const poisonDamage = this.takeDamage(damage).damage;
        this.scene.showDamageText(this.x, this.y - 30, poisonDamage, false, false, 0x00FF00);
        
        poisonTicks--;
        if (poisonTicks <= 0) {
          poisonTimer.remove();
          poisonIcon.destroy();
        }
      },
      repeat: poisonTicks - 1
    });
  }

  /**
   * 디버프 적용
   */
  applyDebuff(effect) {
    const stat = effect.stat;
    const value = effect.value;
    
    if (this.stats[stat] !== undefined) {
      const originalValue = this.stats[stat];
      this.stats[stat] = Math.floor(originalValue * value);
      console.log(`⬇️ ${stat} 디버프: ${originalValue} → ${this.stats[stat]}`);
      
      // 디버프 지속 시간 후 복구 (임시로 5초)
      this.scene.time.delayedCall(5000, () => {
        if (!this.isDead) {
          this.stats[stat] = originalValue;
          console.log(`⏰ ${stat} 디버프 해제: ${this.stats[stat]}`);
        }
      });
    }
  }

  /**
   * 회복
   */
  heal(amount) {
    if (this.isDead) return 0;
    
    const actualHeal = Math.min(amount, this.stats.maxHp - this.stats.hp);
    this.stats.hp += actualHeal;
    
    // HP 변경 이벤트 발생
    if (this.onHpChanged) {
      this.onHpChanged();
    }
    
    this.updateHealthBar();
    return actualHeal;
  }

  /**
   * 피해 받았을 때 효과
   */
  onDamaged(damage, isCritical = false) {
    // 깜빡임 효과
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 2
    });
    
    // 크리티컬 이펙트
    if (isCritical) {
      this.showCriticalEffect();
    }
    
    this.updateHealthBar();
  }
  
  /**
   * 회피 시 효과
   */
  onEvaded() {
    // 회피 텍스트 표시
    const evadeText = this.scene.add.text(this.x, this.y - 30, 'MISS!', {
      font: 'bold 20px Arial',
      fill: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4
    });
    evadeText.setOrigin(0.5);
    evadeText.setDepth(1000);
    
    this.scene.tweens.add({
      targets: evadeText,
      y: evadeText.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => evadeText.destroy()
    });
    
    // 잔상 효과
    const afterImage = this.scene.add.rectangle(this.x, this.y, 32, 32, 0xFFFFFF, 0.5);
    afterImage.setDepth(this.depth - 1);
    
    this.scene.tweens.add({
      targets: afterImage,
      alpha: 0,
      duration: 300,
      onComplete: () => afterImage.destroy()
    });
  }
  
  /**
   * 크리티컬 이펙트
   */
  showCriticalEffect() {
    // 충격파 이펙트
    const circle = this.scene.add.circle(this.x, this.y, 20, 0xFF0000, 0.6);
    circle.setDepth(this.depth + 1);
    
    this.scene.tweens.add({
      targets: circle,
      scale: 2.5,
      alpha: 0,
      duration: 400,
      onComplete: () => circle.destroy()
    });
    
    // 카메라 쉐이크 (약간)
    this.scene.cameras.main.shake(100, 0.005);
  }

  /**
   * 사망 처리
   */
  die() {
    if (this.isDead) return;
    
    this.isDead = true;
    this.onDeath();
  }

  /**
   * 사망 시 호출 (오버라이드 가능)
   */
  onDeath() {
    // 상태 이상 정리
    if (this.statusEffects) {
      this.statusEffects.destroy();
    }
    
    // 사망 애니메이션
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      duration: 300,
      onComplete: () => {
        this.destroy();
      }
    });
  }
  
  /**
   * 엔티티 업데이트 (상태 이상 포함)
   */
  updateEntity(time, delta) {
    // 상태 이상 업데이트
    if (this.statusEffects) {
      this.statusEffects.update(delta);
    }
    
    // 넉백 업데이트
    this.updateKnockback();
  }
  
  /**
   * 현재 이동 속도 계산 (상태 이상 반영)
   */
  getCurrentSpeed() {
    if (this.isStunned) return 0;
    
    let speed = this.stats.speed;
    
    if (this.isFrozen) {
      speed *= (1 - this.freezeSpeedReduction / 100);
    }
    
    if (this.isSlowed) {
      speed *= (1 - this.slowSpeedReduction / 100);
    }
    
    return speed;
  }
  
  /**
   * 행동 가능한 상태인지 확인
   */
  canAct() {
    return !this.isDead && !this.isStunned;
  }

  /**
   * 넉백 적용 (공격자 방향 반대로 밀침)
   * @param {number} power - 넉백 강도 (기본 200)
   * @param {number} duration - 넉백 지속시간 (ms, 기본 300)
   * @param {Object} source - 공격 소스 (x, y 좌표 필요)
   */
  applyKnockback(power = 200, duration = 300, source = null) {
    if (this.isDead || this.isKnockedBack) return;
    
    // 넉백 방향 계산
    let angle = 0;
    if (source) {
      angle = Phaser.Math.Angle.Between(source.x, source.y, this.x, this.y);
    } else {
      // 소스가 없으면 랜덤 방향
      angle = Math.random() * Math.PI * 2;
    }
    
    // 넉백 속도 설정
    this.knockbackVelocity.x = Math.cos(angle) * power;
    this.knockbackVelocity.y = Math.sin(angle) * power;
    this.isKnockedBack = true;
    
    // 넉백 종료 타이머
    this.scene.time.delayedCall(duration, () => {
      this.isKnockedBack = false;
      this.knockbackVelocity.x = 0;
      this.knockbackVelocity.y = 0;
      if (this.body) {
        this.body.setVelocity(0, 0);
      }
    });
    
    // 넉백 효과 (먼지 이펙트)
    this.showKnockbackEffect();
  }
  
  /**
   * 넉백 업데이트 (매 프레임 호출 필요)
   */
  updateKnockback() {
    if (this.isKnockedBack && this.body) {
      // 넉백 속도 감쇠
      this.knockbackVelocity.x *= 0.9;
      this.knockbackVelocity.y *= 0.9;
      
      // 물리 속도에 넉백 적용
      this.body.setVelocity(this.knockbackVelocity.x, this.knockbackVelocity.y);
    }
  }
  
  /**
   * 넉백 시각 효과
   */
  showKnockbackEffect() {
    // 충격 먼지 이펙트
    const dustCount = 3;
    for (let i = 0; i < dustCount; i++) {
      const dust = this.scene.add.circle(
        this.x + (Math.random() - 0.5) * 20,
        this.y + (Math.random() - 0.5) * 20,
        3 + Math.random() * 3,
        0xFFFFFF,
        0.5
      );
      dust.setDepth(this.depth - 1);
      
      this.scene.tweens.add({
        targets: dust,
        x: dust.x + (Math.random() - 0.5) * 30,
        y: dust.y + (Math.random() - 0.5) * 30,
        alpha: 0,
        scale: 1.5,
        duration: 400 + Math.random() * 200,
        onComplete: () => dust.destroy()
      });
    }
  }

  /**
   * 체력바 생성
   */
  createHealthBar() {
    const barWidth = 40;
    const barHeight = 4;
    
    // 배경
    this.hpBarBg = this.scene.add.rectangle(0, -25, barWidth, barHeight, 0x000000);
    this.hpBarBg.setOrigin(0.5);
    this.add(this.hpBarBg);
    
    // 체력바
    this.hpBar = this.scene.add.rectangle(0, -25, barWidth, barHeight, 0x00ff00);
    this.hpBar.setOrigin(0.5);
    this.add(this.hpBar);
    
    this.updateHealthBar();
  }

  /**
   * 체력바 업데이트
   */
  updateHealthBar() {
    if (!this.hpBar) return;
    
    const percent = this.stats.hp / this.stats.maxHp;
    this.hpBar.scaleX = percent;
    
    // 체력에 따라 색상 변경
    if (percent > 0.5) {
      this.hpBar.setFillStyle(0x00ff00);
    } else if (percent > 0.25) {
      this.hpBar.setFillStyle(0xffff00);
    } else {
      this.hpBar.setFillStyle(0xff0000);
    }
  }

  /**
   * 이동
   */
  moveTo(x, y) {
    if (this.isDead) return;
    
    const distance = Phaser.Math.Distance.Between(this.x, this.y, x, y);
    const duration = (distance / this.stats.speed) * 1000;
    
    this.scene.tweens.add({
      targets: this,
      x: x,
      y: y,
      duration: duration,
      ease: 'Linear'
    });
  }

  /**
   * 둔화 적용
   * @param {number} slowPercent - 둔화 퍼센트 (0-100)
   * @param {number} duration - 지속 시간 (ms)
   */
  applySlow(slowPercent, duration) {
    this.statusEffects.addEffect('slow', duration, { slowPercent });
  }

  /**
   * 기절 적용
   * @param {number} duration - 지속 시간 (ms)
   */
  applyStun(duration) {
    this.statusEffects.addEffect('stun', duration);
  }

  /**
   * 매 프레임 업데이트 (오버라이드 가능)
   */
  update(time, delta) {
    // 자식 클래스에서 구현
  }

  /**
   * 파괴
   */
  destroy() {
    if (this.hpBar) this.hpBar.destroy();
    if (this.hpBarBg) this.hpBarBg.destroy();
    super.destroy();
  }
}
