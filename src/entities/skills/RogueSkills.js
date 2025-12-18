import Phaser from 'phaser';
import { Skill } from '../Skill.js';

/**
 * RogueSkills - 도적 스킬들
 * (아직 구현되지 않음 - 기본 구조만 제공)
 */

/**
 * MeleeSkill - 근접 스킬
 */
export class MeleeSkill extends Skill {
  execute(caster, target) {
    const scene = caster.scene;

    // 근접 공격 이펙트
    const effect = scene.add.circle(caster.x, caster.y, 50, 0xFF0000, 0.4);
    effect.setDepth(50);
    scene.tweens.add({
      targets: effect,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      onComplete: () => effect.destroy()
    });

    // 범위 내 몬스터 공격
    const monsters = scene.monsters.getChildren();
    const baseDamage = Math.floor(caster.stats.attack * this.damageMultiplier + this.damage);
    const comboMultiplier = caster.getComboMultiplier ? caster.getComboMultiplier() : 1.0;
    const totalDamage = Math.floor(baseDamage * comboMultiplier);

    monsters.forEach(monster => {
      const distance = Phaser.Math.Distance.Between(caster.x, caster.y, monster.x, monster.y);
      if (distance <= this.range && !monster.isDead) {
        const result = monster.takeDamage(totalDamage, caster);
        scene.showDamageText(monster.x, monster.y - 30, result.damage, result.isCrit, result.isEvaded);

        // 콤보 증가
        if (!result.isEvaded && caster.increaseCombo) {
          caster.increaseCombo();
        }

        // 넉백 적용
        if (!result.isEvaded && this.knockbackPower > 0) {
          monster.applyKnockback(this.knockbackPower, 300, caster);
        }
      }
    });
  }
}

/**
 * RangedSkill - 원거리 스킬
 */
export class RangedSkill extends Skill {
  execute(caster, target) {
    const scene = caster.scene;

    // 마우스 방향으로 투사체 발사
    const pointer = scene.input.activePointer;
    const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const angle = Phaser.Math.Angle.Between(caster.x, caster.y, worldPoint.x, worldPoint.y);

    // 일반 원거리 스킬
    const projectileCount = this.projectileCount || 1;
    for (let i = 0; i < projectileCount; i++) {
      // 여러 발 발사 시 약간의 각도 분산
      const spreadAngle = projectileCount > 1 ? (i - (projectileCount - 1) / 2) * 0.2 : 0;
      this.createProjectile(scene, caster, angle + spreadAngle);
    }
  }

  createProjectile(scene, caster, angle) {
    const speed = 500;
    const projectile = scene.add.circle(caster.x, caster.y, 8, 0xFFFF00);
    projectile.setDepth(100);

    scene.physics.add.existing(projectile);
    projectile.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    const totalDamage = Math.floor(caster.stats.attack * this.damageMultiplier + this.damage);
    projectile.damage = totalDamage;
    projectile.owner = caster;
    projectile.isSkillProjectile = true;
    projectile.knockbackPower = this.knockbackPower;

    // 기절 효과가 있는 경우
    if (this.stunDuration) {
      projectile.stunDuration = this.stunDuration;
    }

    // 독 피해가 있는 경우
    if (this.poisonDamage) {
      projectile.poisonDamage = this.poisonDamage;
      projectile.poisonDuration = this.poisonDuration;
    }

    // 일정 거리 후 제거
    scene.time.delayedCall(this.range / speed * 1000, () => {
      if (projectile && projectile.active) {
        projectile.destroy();
      }
    });

    return projectile;
  }
}

/**
 * DashSkill - 돌진 스킬 (그림자 밟기)
 */
export class DashSkill extends Skill {
  execute(caster, target) {
    const scene = caster.scene;

    // 가장 가까운 몬스터 찾기
    const monsters = scene.monsters.getChildren();
    let closestMonster = null;
    let closestDistance = this.range;

    monsters.forEach(monster => {
      if (!monster.isDead) {
        const distance = Phaser.Math.Distance.Between(caster.x, caster.y, monster.x, monster.y);
        if (distance <= closestDistance && (!closestMonster || distance < Phaser.Math.Distance.Between(caster.x, caster.y, closestMonster.x, closestMonster.y))) {
          closestMonster = monster;
          closestDistance = distance;
        }
      }
    });

    if (!closestMonster) {
      console.log("그림자 밟기: 대상이 없음");
      return;
    }

    // 몬스터의 뒤쪽으로 순간이동
    const angleToMonster = Phaser.Math.Angle.Between(caster.x, caster.y, closestMonster.x, closestMonster.y);
    const teleportDistance = 50; // 몬스터 뒤 50px
    const targetX = closestMonster.x - Math.cos(angleToMonster) * teleportDistance;
    const targetY = closestMonster.y - Math.sin(angleToMonster) * teleportDistance;

    // 순간이동 이펙트
    const teleportEffect = scene.add.circle(caster.x, caster.y, 30, 0x000000, 0.6);
    teleportEffect.setDepth(150);
    scene.tweens.add({
      targets: teleportEffect,
      alpha: 0,
      scale: 2,
      duration: 200,
      onComplete: () => teleportEffect.destroy()
    });

    // 순간이동
    caster.x = targetX;
    caster.y = targetY;

    // 도착 이펙트
    const arrivalEffect = scene.add.circle(targetX, targetY, 30, 0xFF00FF, 0.6);
    arrivalEffect.setDepth(150);
    scene.tweens.add({
      targets: arrivalEffect,
      alpha: 0,
      scale: 2,
      duration: 200,
      onComplete: () => arrivalEffect.destroy()
    });

    // 백어택 피해 (1.5배 배율)
    const baseDamage = Math.floor(caster.stats.attack * this.damageMultiplier + this.damage);
    const comboMultiplier = caster.getComboMultiplier ? caster.getComboMultiplier() : 1.0;
    const totalDamage = Math.floor(baseDamage * comboMultiplier);

    const result = closestMonster.takeDamage(totalDamage, caster);
    scene.showDamageText(closestMonster.x, closestMonster.y - 30, result.damage, result.isCrit, result.isEvaded);

    // 콤보 증가
    if (!result.isEvaded && caster.increaseCombo) {
      caster.increaseCombo();
    }

    // 넉백 적용
    if (!result.isEvaded && this.knockbackPower > 0) {
      closestMonster.applyKnockback(this.knockbackPower, 300, caster);
    }

    console.log(`그림자 밟기: ${closestMonster.name}의 뒤로 이동하여 백어택!`);
  }
}

/**
 * BuffSkill - 버프 스킬 (독 칠하기)
 */
export class BuffSkill extends Skill {
  execute(caster, target) {
    const scene = caster.scene;

    // 독 칠하기 스킬인 경우 (rogue_skill_2)
    if (this.id === 'rogue_skill_2') {
      this.executePoisonCoat(scene, caster);
    } else {
      // 일반 버프 스킬
      const effectColor = 0x00FF00; // 독 효과 색상
      const effect = scene.add.circle(caster.x, caster.y, 40, effectColor, 0.6);
      effect.setDepth(150);
      scene.tweens.add({
        targets: effect,
        alpha: 0,
        scale: 2,
        duration: 500,
        onComplete: () => effect.destroy()
      });

      // 버프 적용
      this.applyBuffEffects(caster);
    }
  }

  executePoisonCoat(scene, caster) {
    // 독 칠하기: 무기에 독을 칠해 다음 공격에 독 효과 적용
    const effectColor = 0x00FF00; // 독 효과 색상

    // 시전 이펙트
    const effect = scene.add.circle(caster.x, caster.y, 40, effectColor, 0.6);
    effect.setDepth(150);
    scene.tweens.add({
      targets: effect,
      alpha: 0,
      scale: 2,
      duration: 500,
      onComplete: () => effect.destroy()
    });

    // 독 버프 적용
    caster.hasPoisonCoat = true;
    caster.poisonCoatEffects = this.effects; // 독 효과 저장

    // 버프 아우라 (지속 시간 동안)
    const aura = scene.add.circle(caster.x, caster.y, 50, effectColor, 0.2);
    aura.setDepth(1);

    // 플레이어를 따라다니는 aura
    const auraFollow = scene.time.addEvent({
      delay: 16,
      callback: () => {
        if (aura.active && caster.active) {
          aura.setPosition(caster.x, caster.y);
        }
      },
      loop: true
    });

    // 버프 종료
    scene.time.delayedCall(this.duration, () => {
      auraFollow.remove();
      caster.hasPoisonCoat = false;
      caster.poisonCoatEffects = null;

      if (aura.active) {
        scene.tweens.add({
          targets: aura,
          alpha: 0,
          duration: 300,
          onComplete: () => aura.destroy()
        });
      }
    });

    console.log(`독 칠하기: ${this.duration / 1000}초간 무기에 독 효과 적용`);
  }

  applyBuffEffects(caster) {
    const scene = caster.scene;

    // 원본 스탯 저장
    const originalStats = {};

    // 버프/디버프 적용
    this.effects.forEach(effectData => {
      if (effectData.type === 'buff' || effectData.type === 'debuff') {
        const stat = effectData.stat;

        if (caster.stats[stat] !== undefined) {
          originalStats[stat] = caster.stats[stat];
          if (effectData.type === 'buff') {
            caster.stats[stat] = Math.floor(originalStats[stat] * effectData.value);
            console.log(`💪 ${stat} 증가: ${originalStats[stat]} → ${caster.stats[stat]}`);
          } else {
            caster.stats[stat] = Math.floor(originalStats[stat] * effectData.value);
            console.log(`⬇️ ${stat} 감소: ${originalStats[stat]} → ${caster.stats[stat]}`);
          }
        }
      }
    });

    // 버프 종료
    scene.time.delayedCall(this.duration, () => {
      // 스탯 복구
      Object.keys(originalStats).forEach(stat => {
        if (caster.stats[stat] !== undefined) {
          caster.stats[stat] = originalStats[stat];
          console.log(`⏰ ${stat} 원래대로: ${originalStats[stat]}`);
        }
      });
    });
  }
}

/**
 * AOESkill - 광역 스킬 (그림자 베기, 환영 분신)
 */
export class AOESkill extends Skill {
  execute(caster, target) {
    const scene = caster.scene;
    const centerX = caster.x;
    const centerY = caster.y;

    // 환영 분신 스킬인 경우 (rogue_skill_ultimate)
    if (this.id === 'rogue_skill_ultimate') {
      this.executePhantomClone(scene, caster, centerX, centerY);
    } else {
      // 그림자 베기: 일반 AOE 스킬
      this.executeShadowSlash(scene, caster, centerX, centerY);
    }
  }

  executeShadowSlash(scene, caster, centerX, centerY) {
    // 그림자 베기 이펙트
    const slashEffect = scene.add.circle(centerX, centerY, this.radius, 0x440044, 0.4);
    slashEffect.setDepth(50);

    // 베기 애니메이션 (여러 방향으로)
    const slashAngles = [0, 45, 90, 135, 180, 225, 270, 315];
    slashAngles.forEach((angle, index) => {
      scene.time.delayedCall(index * 50, () => {
        const slash = scene.add.rectangle(
          centerX + Math.cos(angle * Math.PI / 180) * this.radius * 0.7,
          centerY + Math.sin(angle * Math.PI / 180) * this.radius * 0.7,
          this.radius * 0.8, 4, 0x880088, 0.8
        );
        slash.setDepth(100);
        slash.setRotation(angle * Math.PI / 180);

        scene.tweens.add({
          targets: slash,
          alpha: 0,
          scaleX: 1.5,
          duration: 300,
          onComplete: () => slash.destroy()
        });
      });
    });

    scene.tweens.add({
      targets: slashEffect,
      alpha: 0,
      scale: 1.2,
      duration: 500,
      onComplete: () => slashEffect.destroy()
    });

    // 범위 내 모든 몬스터 대미지
    const monsters = scene.monsters.getChildren();
    const baseDamage = Math.floor(caster.stats.attack * this.damageMultiplier + this.damage);
    const comboMultiplier = caster.getComboMultiplier ? caster.getComboMultiplier() : 1.0;
    const totalDamage = Math.floor(baseDamage * comboMultiplier);

    monsters.forEach(monster => {
      const distance = Phaser.Math.Distance.Between(centerX, centerY, monster.x, monster.y);
      if (distance <= this.radius && !monster.isDead) {
        const result = monster.takeDamage(totalDamage, caster);
        scene.showDamageText(monster.x, monster.y - 30, result.damage, result.isCrit, result.isEvaded);

        // 콤보 증가
        if (!result.isEvaded && caster.increaseCombo) {
          caster.increaseCombo();
        }

        // 넉백 적용
        if (!result.isEvaded && this.knockbackPower > 0) {
          const knockbackSource = { x: centerX, y: centerY };
          monster.applyKnockback(this.knockbackPower, 300, knockbackSource);
        }
      }
    });
  }

  executePhantomClone(scene, caster, centerX, centerY) {
    // 환영 분신: 분신 생성 및 AOE 피해
    const cloneCount = 3;

    // 분신 생성
    for (let i = 0; i < cloneCount; i++) {
      const angle = (i * 360 / cloneCount) * Math.PI / 180;
      const distance = 80;
      const cloneX = centerX + Math.cos(angle) * distance;
      const cloneY = centerY + Math.sin(angle) * distance;

      // 분신 이펙트
      const clone = scene.add.circle(cloneX, cloneY, 20, 0xAA00AA, 0.7);
      clone.setDepth(150);

      // 분신에서 뻗어나가는 충격파
      scene.time.delayedCall(i * 100, () => {
        const shockwave = scene.add.circle(cloneX, cloneY, 10, 0xFF00FF, 0.8);
        shockwave.setDepth(100);

        scene.tweens.add({
          targets: shockwave,
          scale: this.radius / 10,
          alpha: 0,
          duration: 400,
          onComplete: () => shockwave.destroy()
        });

        // 분신 파괴
        scene.tweens.add({
          targets: clone,
          alpha: 0,
          scale: 0.5,
          duration: 300,
          onComplete: () => clone.destroy()
        });
      });
    }

    // 범위 내 모든 몬스터 대미지 (지연 적용)
    scene.time.delayedCall(200, () => {
      const monsters = scene.monsters.getChildren();
      const baseDamage = Math.floor(caster.stats.attack * this.damageMultiplier + this.damage);
      const comboMultiplier = caster.getComboMultiplier ? caster.getComboMultiplier() : 1.0;
      const totalDamage = Math.floor(baseDamage * comboMultiplier);

      monsters.forEach(monster => {
        const distance = Phaser.Math.Distance.Between(centerX, centerY, monster.x, monster.y);
        if (distance <= this.radius && !monster.isDead) {
          const result = monster.takeDamage(totalDamage, caster);
          scene.showDamageText(monster.x, monster.y - 30, result.damage, result.isCrit, result.isEvaded);

          // 콤보 증가
          if (!result.isEvaded && caster.increaseCombo) {
            caster.increaseCombo();
          }

          // 넉백 적용
          if (!result.isEvaded && this.knockbackPower > 0) {
            const knockbackSource = { x: centerX, y: centerY };
            monster.applyKnockback(this.knockbackPower, 300, knockbackSource);
          }

          // 기절 효과 적용
          if (!result.isEvaded && this.stunDuration) {
            monster.applyStun(this.stunDuration);
          }
        }
      });
    });
  }
}