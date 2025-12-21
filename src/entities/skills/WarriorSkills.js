import { Skill } from '../Skill.js';

/**
 * WarriorSkills - 전사 스킬들
 * 돌진 베기, 방어 자세, 회전 베기, 파멸의 일격
 */

/**
 * DashSkill - 돌진 스킬 (돌진 베기)
 */
export class DashSkill extends Skill {
  execute(caster, target) {
    // 융합 스킬 체크
    if (this.id && this.id.startsWith('fusion_')) {
      const { executeFusionSkill } = require('./FusionistSkills.js');
      return executeFusionSkill(this.id, caster, target);
    }

    const scene = caster.scene;

    // 마우스 방향으로 돌진
    const pointer = scene.input.activePointer;
    const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const angle = Phaser.Math.Angle.Between(caster.x, caster.y, worldPoint.x, worldPoint.y);

    const dashDistance = this.range;
    const targetX = caster.x + Math.cos(angle) * dashDistance;
    const targetY = caster.y + Math.sin(angle) * dashDistance;

    // 무적 상태
    caster.isInvincible = true;

    // 다중 잔상 효과 - 더 강력하게
    const trailCount = 8;
    for (let i = 0; i < trailCount; i++) {
      scene.time.delayedCall(i * 25, () => {
        const trail = scene.add.rectangle(caster.x, caster.y, 32, 32, 0xFFD700, 0.7 - (i * 0.08));
        trail.setDepth(99);
        scene.tweens.add({
          targets: trail,
          alpha: 0,
          scale: 1.2,
          duration: 150,
          onComplete: () => trail.destroy()
        });
      });
    }

    // 돌진 시작 충격파
    const startShockwave = scene.add.circle(caster.x, caster.y, 20, 0xFFFFFF, 0.8);
    startShockwave.setDepth(100);
    scene.tweens.add({
      targets: startShockwave,
      scale: 3,
      alpha: 0,
      duration: 200,
      onComplete: () => startShockwave.destroy()
    });

    // 돌진 중 경로상 피해를 위한 변수들
    const baseDamage = Math.floor(caster.stats.attack * this.damageMultiplier + this.damage);
    const comboMultiplier = caster.getComboMultiplier ? caster.getComboMultiplier() : 1.0;
    const totalDamage = Math.floor(baseDamage * comboMultiplier);
    const hitMonsters = new Set(); // 중복 피해 방지

    // 돌진 트윈
    scene.tweens.add({
      targets: caster,
      x: targetX,
      y: targetY,
      duration: 200,
      onUpdate: (tween, target) => {
        // 돌진 중 경로상 적 체크 (매 프레임)
        const monsters = scene.monsters.getChildren();
        monsters.forEach(monster => {
          if (hitMonsters.has(monster) || monster.isDead) return;

          const distance = Phaser.Math.Distance.Between(caster.x, caster.y, monster.x, monster.y);
          if (distance <= 60) { // 경로상 범위
            hitMonsters.add(monster);

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
      },
      onComplete: () => {
        caster.isInvincible = false;

        // 도착 충격파 효과
        const endShockwave = scene.add.circle(targetX, targetY, 30, 0xFFD700, 0.8);
        endShockwave.setDepth(100);
        scene.tweens.add({
          targets: endShockwave,
          scale: 4,
          alpha: 0,
          duration: 300,
          onComplete: () => endShockwave.destroy()
        });

        // 도착 지점 먼지 효과
        for (let i = 0; i < 12; i++) {
          const dustAngle = (i / 12) * Math.PI * 2;
          const dustDistance = 40;
          const dust = scene.add.circle(
            targetX + Math.cos(dustAngle) * dustDistance,
            targetY + Math.sin(dustAngle) * dustDistance,
            4, 0x8B4513, 0.6
          );
          dust.setDepth(98);

          scene.tweens.add({
            targets: dust,
            x: targetX + Math.cos(dustAngle) * (dustDistance + 30),
            y: targetY + Math.sin(dustAngle) * (dustDistance + 30),
            alpha: 0,
            duration: 400,
            onComplete: () => dust.destroy()
          });
        }
      }
    });
  }
}

/**
 * BuffSkill - 버프 스킬 (방어 자세)
 */
export class BuffSkill extends Skill {
  execute(caster, target) {
    // 융합 스킬 체크
    if (this.id && this.id.startsWith('fusion_')) {
      const { executeFusionSkill } = require('./FusionistSkills.js');
      return executeFusionSkill(this.id, caster, target);
    }

    const scene = caster.scene;

    // 방어 자세 스킬인 경우 (warrior_skill_2)
    if (this.id === 'warrior_skill_2') {
      this.executeDefensiveStance(scene, caster);
    } else {
      // 일반 버프 스킬
      this.executeGenericBuff(scene, caster);
    }
  }

  executeDefensiveStance(scene, caster) {
    // 방어 자세: 고퀄리티 방어막 생성 + 강화 효과
    const shieldColor = 0x4444FF; // 파란색
    const secondaryColor = 0x00FFFF; // 청록색
    const tertiaryColor = 0xFFFFFF; // 흰색

    // 초기 충격파 효과
    const initialShockwave = scene.add.circle(caster.x, caster.y, 20, tertiaryColor, 0.8);
    initialShockwave.setDepth(145);
    scene.tweens.add({
      targets: initialShockwave,
      scale: 3,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => initialShockwave.destroy()
    });

    // 메인 방어막 - 더 크고 투명도 조정
    const shield = scene.add.circle(caster.x, caster.y, 60, shieldColor, 0.5);
    shield.setDepth(150);

    // 방어막 테두리 효과 - 여러 레이어
    const shieldBorder1 = scene.add.circle(caster.x, caster.y, 65, shieldColor, 0.3);
    shieldBorder1.setDepth(149);
    const shieldBorder2 = scene.add.circle(caster.x, caster.y, 70, secondaryColor, 0.2);
    shieldBorder2.setDepth(148);

    // 빛나는 테두리 효과
    const glowBorder = scene.add.circle(caster.x, caster.y, 75, tertiaryColor, 0.1);
    glowBorder.setDepth(147);

    // 고퀄리티 파티클 시스템
    const particles = [];
    const particleCount = 24; // 더 많은 파티클
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 55;
      const size = 4 + Math.random() * 3; // 랜덤 크기

      // 메인 파티클
      const particle = scene.add.circle(
        caster.x + Math.cos(angle) * distance,
        caster.y + Math.sin(angle) * distance,
        size, shieldColor, 0.9
      );
      particle.setDepth(151);
      particles.push(particle);

      // 보조 파티클 (더 작고 밝게)
      const subParticle = scene.add.circle(
        caster.x + Math.cos(angle) * (distance + 8),
        caster.y + Math.sin(angle) * (distance + 8),
        size * 0.6, secondaryColor, 0.7
      );
      subParticle.setDepth(152);
      particles.push(subParticle);

      // 파티클 회전 애니메이션
      scene.tweens.add({
        targets: particle,
        angle: 360,
        duration: 4000,
        repeat: -1,
        ease: 'Linear'
      });

      scene.tweens.add({
        targets: subParticle,
        angle: -360,
        duration: 3000,
        repeat: -1,
        ease: 'Linear'
      });
    }

    // 빛줄기 효과
    const lightRays = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const rayLength = 80;
      const ray = scene.add.rectangle(
        caster.x + Math.cos(angle) * (rayLength / 2),
        caster.y + Math.sin(angle) * (rayLength / 2),
        3, rayLength, tertiaryColor, 0.3
      );
      ray.setRotation(angle);
      ray.setDepth(146);
      lightRays.push(ray);

      // 빛줄기 펄스 애니메이션
      scene.tweens.add({
        targets: ray,
        alpha: 0.6,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Power2'
      });
    }

    // 별 파티클 효과
    const stars = [];
    for (let i = 0; i < 8; i++) {
      scene.time.delayedCall(i * 200, () => {
        const starAngle = Math.random() * Math.PI * 2;
        const starDistance = 70 + Math.random() * 20;
        const star = scene.add.star(
          caster.x + Math.cos(starAngle) * starDistance,
          caster.y + Math.sin(starAngle) * starDistance,
          5, 8, 4, tertiaryColor, 0.8
        );
        star.setDepth(153);
        stars.push(star);

        scene.tweens.add({
          targets: star,
          alpha: 0,
          scale: 1.5,
          duration: 2000,
          onComplete: () => star.destroy()
        });
      });
    }

    // 방어막이 플레이어를 따라다니게 + 회전 효과
    const shieldFollow = scene.time.addEvent({
      delay: 16,
      callback: () => {
        if (shield.active && caster.active) {
          const time = scene.time.now * 0.001; // 시간 기반 회전

          shield.setPosition(caster.x, caster.y);
          shieldBorder1.setPosition(caster.x, caster.y);
          shieldBorder2.setPosition(caster.x, caster.y);
          glowBorder.setPosition(caster.x, caster.y);

          // 빛줄기 회전
          lightRays.forEach((ray, index) => {
            const angle = (index / 12) * Math.PI * 2 + time * 0.5;
            const rayLength = 80;
            ray.setPosition(
              caster.x + Math.cos(angle) * (rayLength / 2),
              caster.y + Math.sin(angle) * (rayLength / 2)
            );
            ray.setRotation(angle);
          });

          // 파티클들도 함께 이동 및 추가 회전
          particles.forEach((particle, index) => {
            if (particle.active) {
              const angle = (index / particleCount) * Math.PI * 2 + time * 0.3;
              const distance = index % 2 === 0 ? 55 : 63; // 메인/보조 파티클 거리 차이
              particle.setPosition(
                caster.x + Math.cos(angle) * distance,
                caster.y + Math.sin(angle) * distance
              );
            }
          });
        }
      },
      loop: true
    });

    // 버프 적용
    this.applyBuffEffects(caster);

    // 지속 시간 후 제거 - 더 화려한 사라짐 효과
    scene.time.delayedCall(this.duration, () => {
      // 최종 빛 폭발 효과
      const finalBurst = scene.add.circle(caster.x, caster.y, 30, tertiaryColor, 0.9);
      finalBurst.setDepth(154);
      scene.tweens.add({
        targets: finalBurst,
        scale: 4,
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => finalBurst.destroy()
      });

      // 각 요소들 사라짐
      [shield, shieldBorder1, shieldBorder2, glowBorder].forEach(element => {
        if (element.active) {
          scene.tweens.add({
            targets: element,
            alpha: 0,
            scale: 1.2,
            duration: 500,
            ease: 'Power2',
            onComplete: () => element.destroy()
          });
        }
      });

      particles.forEach(particle => {
        if (particle.active) {
          scene.tweens.add({
            targets: particle,
            alpha: 0,
            scale: 0.5,
            duration: 400,
            ease: 'Power2',
            onComplete: () => particle.destroy()
          });
        }
      });

      lightRays.forEach(ray => {
        if (ray.active) {
          scene.tweens.add({
            targets: ray,
            alpha: 0,
            scaleY: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => ray.destroy()
          });
        }
      });

      shieldFollow.destroy();
    });
  }

  executeGenericBuff(scene, caster) {
    // 일반 버프 스킬 (기존 로직)
    const effectColor = 0xFF0000;
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

  applyBuffEffects(caster) {
    const scene = caster.scene;
    const effectColor = 0xFF0000;

    // 원본 스탯 저장
    const originalStats = {};

    // 버프/디버프 적용
    this.effects.forEach(effectData => {
      if (effectData.type === 'buff' || effectData.type === 'debuff') {
        const stat = effectData.stat;

        // 특수 처리: damageReduction
        if (stat === 'damageReduction') {
          if (!caster.damageReduction) caster.damageReduction = 0;
          originalStats[stat] = caster.damageReduction;
          caster.damageReduction = effectData.value;
          console.log(`🛡️ 받는 피해 ${Math.floor(effectData.value * 100)}% 감소`);
        } else if (caster.stats[stat] !== undefined) {
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
      // 스탯 복구
      Object.keys(originalStats).forEach(stat => {
        if (stat === 'damageReduction') {
          caster.damageReduction = originalStats[stat];
        } else if (caster.stats[stat] !== undefined) {
          caster.stats[stat] = originalStats[stat];
          console.log(`⏰ ${stat} 원래대로: ${originalStats[stat]}`);
        }
      });

      // 아우라 제거
      if (aura.active) {
        scene.tweens.add({
          targets: aura,
          alpha: 0,
          duration: 300,
          onComplete: () => aura.destroy()
        });
      }
      auraFollow.destroy();
    });
  }
}

/**
 * AOESkill - 광역 스킬 (회전 베기)
 */
export class AOESkill extends Skill {
  execute(caster, target) {
    // 융합 스킬 체크
    if (this.id && this.id.startsWith('fusion_')) {
      const { executeFusionSkill } = require('./FusionistSkills.js');
      return executeFusionSkill(this.id, caster, target);
    }

    const scene = caster.scene;
    const centerX = caster.x;
    const centerY = caster.y;

    // 회전 베기 스킬인 경우 (warrior_skill_3)
    if (this.id === 'warrior_skill_3') {
      this.executeWhirlingSlash(scene, caster, centerX, centerY);
    } else {
      // 일반 AOE 스킬
      this.executeGenericAOE(scene, caster, centerX, centerY);
    }
  }

  executeWhirlingSlash(scene, caster, centerX, centerY) {
    // 회전 베기: 고퀄리티 회전하는 검기 효과
    const slashCount = 8; // 더 많은 검기
    const slashColor = 0xFFD700; // 황금색
    const secondaryColor = 0xFFA500; // 주황색
    const tertiaryColor = 0xFF4500; // 빨강색

    // 배경 충격파 효과
    const backgroundShockwave = scene.add.circle(centerX, centerY, 50, 0xFFFFFF, 0.3);
    backgroundShockwave.setDepth(95);
    scene.tweens.add({
      targets: backgroundShockwave,
      scale: 4,
      alpha: 0,
      duration: 800,
      onComplete: () => backgroundShockwave.destroy()
    });

    // 회전하는 검기들 생성
    for (let i = 0; i < slashCount; i++) {
      scene.time.delayedCall(i * 60, () => { // 더 빠른 간격
        const angle = (i / slashCount) * Math.PI * 2;

        // 메인 검기 선 - 더 길고 두껍게
        const slash = scene.add.rectangle(
          centerX + Math.cos(angle) * (this.radius * 0.8),
          centerY + Math.sin(angle) * (this.radius * 0.8),
          this.radius * 1.2, 12, slashColor, 0.9
        );
        slash.setRotation(angle);
        slash.setDepth(100);

        // 검기 테두리 효과
        const slashOutline = scene.add.rectangle(
          centerX + Math.cos(angle) * (this.radius * 0.8),
          centerY + Math.sin(angle) * (this.radius * 0.8),
          this.radius * 1.25, 16, 0xFFFFFF, 0.4
        );
        slashOutline.setRotation(angle);
        slashOutline.setDepth(99);

        // 고퀄리티 파티클 시스템
        const particleCount = 12; // 더 많은 파티클
        for (let j = 0; j < particleCount; j++) {
          const particleAngle = angle + (j - particleCount/2) * 0.2;
          const particleDistance = this.radius * (0.3 + j * 0.08);
          const particleSize = 4 + Math.random() * 4; // 랜덤 크기

          // 메인 파티클
          const particle = scene.add.circle(
            centerX + Math.cos(particleAngle) * particleDistance,
            centerY + Math.sin(particleAngle) * particleDistance,
            particleSize, slashColor, 0.95
          );
          particle.setDepth(101);

          // 보조 파티클 (더 작은 것들)
          const subParticle = scene.add.circle(
            centerX + Math.cos(particleAngle) * (particleDistance + 10),
            centerY + Math.sin(particleAngle) * (particleDistance + 10),
            particleSize * 0.6, secondaryColor, 0.8
          );
          subParticle.setDepth(102);

          // 파티클 애니메이션
          scene.tweens.add({
            targets: particle,
            x: centerX + Math.cos(particleAngle) * (particleDistance + 60),
            y: centerY + Math.sin(particleAngle) * (particleDistance + 60),
            alpha: 0,
            scale: 1.5,
            duration: 500,
            ease: 'Power2',
            onComplete: () => particle.destroy()
          });

          scene.tweens.add({
            targets: subParticle,
            x: centerX + Math.cos(particleAngle) * (particleDistance + 80),
            y: centerY + Math.sin(particleAngle) * (particleDistance + 80),
            alpha: 0,
            scale: 2,
            duration: 600,
            ease: 'Power2',
            onComplete: () => subParticle.destroy()
          });
        }

        // 검기 사라짐 애니메이션
        scene.tweens.add({
          targets: slash,
          alpha: 0,
          scaleX: 2,
          scaleY: 1.8,
          duration: 500,
          ease: 'Power2',
          onComplete: () => slash.destroy()
        });

        scene.tweens.add({
          targets: slashOutline,
          alpha: 0,
          scaleX: 2.2,
          scaleY: 2,
          duration: 550,
          ease: 'Power2',
          onComplete: () => slashOutline.destroy()
        });
      });
    }

    // 중앙 회전 효과 - 더 화려하게
    const spinEffect = scene.add.circle(centerX, centerY, 40, slashColor, 0.7);
    spinEffect.setDepth(103);
    const spinEffect2 = scene.add.circle(centerX, centerY, 25, secondaryColor, 0.8);
    spinEffect2.setDepth(104);
    const spinEffect3 = scene.add.circle(centerX, centerY, 15, tertiaryColor, 0.9);
    spinEffect3.setDepth(105);

    scene.tweens.add({
      targets: spinEffect,
      angle: 720, // 두 바퀴 회전
      scale: 3,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => spinEffect.destroy()
    });

    scene.tweens.add({
      targets: spinEffect2,
      angle: -720,
      scale: 4,
      alpha: 0,
      duration: 900,
      ease: 'Power2',
      onComplete: () => spinEffect2.destroy()
    });

    scene.tweens.add({
      targets: spinEffect3,
      angle: 1080,
      scale: 5,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => spinEffect3.destroy()
    });

    // 추가 빛나는 효과
    for (let k = 0; k < 16; k++) {
      scene.time.delayedCall(k * 50, () => {
        const sparkleAngle = (k / 16) * Math.PI * 2;
        const sparkleDistance = this.radius * 0.9;
        const sparkle = scene.add.star(
          centerX + Math.cos(sparkleAngle) * sparkleDistance,
          centerY + Math.sin(sparkleAngle) * sparkleDistance,
          5, 8, 4, 0xFFFFFF, 0.8
        );
        sparkle.setDepth(106);

        scene.tweens.add({
          targets: sparkle,
          alpha: 0,
          scale: 0.5,
          duration: 400,
          onComplete: () => sparkle.destroy()
        });
      });
    }

    // 피해 적용 (약간의 지연 후)
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
        }
      });
    });
  }

  executeGenericAOE(scene, caster, centerX, centerY) {
    // 일반 AOE 스킬 (기존 로직)
    const effect = scene.add.circle(centerX, centerY, this.radius, 0xFFFF00, 0.3);
    effect.setDepth(50);
    scene.tweens.add({
      targets: effect,
      alpha: 0,
      scale: 1.2,
      duration: 500,
      onComplete: () => effect.destroy()
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
}

/**
 * RangedSkill - 원거리 스킬 (돌진 베기, 파멸의 일격)
 */
export class RangedSkill extends Skill {
  execute(caster, target) {
    // 융합 스킬 체크
    if (this.id && this.id.startsWith('fusion_')) {
      const { executeFusionSkill } = require('./FusionistSkills.js');
      return executeFusionSkill(this.id, caster, target);
    }

    const scene = caster.scene;

    // 파멸의 일격 스킬인 경우 (warrior_skill_ultimate)
    if (this.id === 'warrior_skill_ultimate') {
      this.executeDoomStrike(scene, caster, target);
    } else {
      // 일반 원거리 스킬
      this.executeGenericRanged(scene, caster, target);
    }
  }

  executeDoomStrike(scene, caster, target) {
    console.log('🔥 파멸의 일격 발동! 🔥');

    // 마우스 방향 계산
    const pointer = scene.input.activePointer;
    const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const angle = Phaser.Math.Angle.Between(caster.x, caster.y, worldPoint.x, worldPoint.y);

    // 충격파 시작점과 끝점
    const startX = caster.x;
    const startY = caster.y;
    const endX = caster.x + Math.cos(angle) * this.range;
    const endY = caster.y + Math.sin(angle) * this.range;

    // 1. 초기 충격파 효과 (캐스터 주변)
    const initialShockwave = scene.add.circle(caster.x, caster.y, 50, 0xFFD700, 0.8);
    initialShockwave.setDepth(100);
    scene.tweens.add({
      targets: initialShockwave,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => initialShockwave.destroy()
    });

    // 2. 메인 충격파 빔 생성
    const beamWidth = 80;
    const beamLength = this.range;
    const beam = scene.add.rectangle(
      caster.x + Math.cos(angle) * (beamLength / 2),
      caster.y + Math.sin(angle) * (beamLength / 2),
      beamLength,
      beamWidth,
      0xFF4500,
      0.7
    );
    beam.setRotation(angle);
    beam.setDepth(90);

    // 빔 확장 애니메이션
    scene.tweens.add({
      targets: beam,
      scaleX: 1.2,
      scaleY: 1.5,
      alpha: 0,
      duration: 800,
      onComplete: () => beam.destroy()
    });

    // 3. 불꽃 파티클 효과
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      scene.time.delayedCall(i * 20, () => {
        const particleX = caster.x + Math.cos(angle) * (i * (beamLength / particleCount));
        const particleY = caster.y + Math.sin(angle) * (i * (beamLength / particleCount));
        
        const particle = scene.add.circle(particleX, particleY, 5 + Math.random() * 10, 0xFF6347, 0.9);
        particle.setDepth(95);
        
        scene.tweens.add({
          targets: particle,
          x: particleX + (Math.random() - 0.5) * 100,
          y: particleY + (Math.random() - 0.5) * 100,
          alpha: 0,
          scale: 0.5,
          duration: 600 + Math.random() * 200,
          onComplete: () => particle.destroy()
        });
      });
    }

    // 4. 번개 효과 (랜덤한 지그재그 라인)
    for (let i = 0; i < 3; i++) {
      const lightningPoints = [];
      let currentX = caster.x;
      let currentY = caster.y;
      
      for (let j = 0; j < 10; j++) {
        lightningPoints.push(currentX, currentY);
        currentX += Math.cos(angle) * (beamLength / 10) + (Math.random() - 0.5) * 30;
        currentY += Math.sin(angle) * (beamLength / 10) + (Math.random() - 0.5) * 30;
      }
      
      const lightning = scene.add.graphics();
      lightning.lineStyle(3, 0xFFFF00, 0.8);
      lightning.strokePoints(lightningPoints);
      lightning.setDepth(95);
      
      scene.tweens.add({
        targets: lightning,
        alpha: 0,
        duration: 400,
        onComplete: () => lightning.destroy()
      });
    }

    // 5. 피해 적용 (충격파 경로상의 몬스터)
    scene.time.delayedCall(100, () => {
      const monsters = scene.monsters.getChildren();
      const baseDamage = Math.floor(caster.stats.attack * this.damageMultiplier + this.damage);
      const comboMultiplier = caster.getComboMultiplier ? caster.getComboMultiplier() : 1.0;
      const totalDamage = Math.floor(baseDamage * comboMultiplier);
      const hitMonsters = new Set();

      monsters.forEach(monster => {
        if (monster.isDead) return;

        // 충격파 경로상에 있는지 계산 (직선 거리 + 폭 고려)
        const dx = endX - startX;
        const dy = endY - startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / length;
        const uy = dy / length;
        
        const vx = monster.x - startX;
        const vy = monster.y - startY;
        const proj = vx * ux + vy * uy;
        const px = startX + proj * ux;
        const py = startY + proj * uy;
        
        const distanceToLine = Math.sqrt((monster.x - px) * (monster.x - px) + (monster.y - py) * (monster.y - py));
        
        if (distanceToLine <= beamWidth / 2 && proj >= 0 && proj <= length) {
          if (hitMonsters.has(monster)) return;
          hitMonsters.add(monster);

          const result = monster.takeDamage(totalDamage, caster);
          scene.showDamageText(monster.x, monster.y - 30, result.damage, result.isCrit, result.isEvaded);

          // 콤보 증가
          if (!result.isEvaded && caster.increaseCombo) {
            caster.increaseCombo();
          }

          // 넉백 적용
          if (!result.isEvaded && this.knockbackPower > 0) {
            monster.applyKnockback(this.knockbackPower, 400, caster);
          }

          // 스턴 적용
          if (!result.isEvaded && this.stunDuration > 0) {
            monster.applyStun(this.stunDuration);
          }

          // 히트 효과
          const hitEffect = scene.add.circle(monster.x, monster.y, 30, 0xFFFFFF, 0.6);
          hitEffect.setDepth(100);
          scene.tweens.add({
            targets: hitEffect,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => hitEffect.destroy()
          });
        }
      });
    });

    // 6. 화면 흔들림 효과
    scene.cameras.main.shake(200, 0.01);

    // 7. 최종 폭발 효과 (끝점)
    scene.time.delayedCall(200, () => {
      const finalExplosion = scene.add.circle(endX, endY, 100, 0xFF0000, 0.5);
      finalExplosion.setDepth(85);
      scene.tweens.add({
        targets: finalExplosion,
        scale: 3,
        alpha: 0,
        duration: 600,
        onComplete: () => finalExplosion.destroy()
      });
    });

    console.log('✅ 파멸의 일격 실행 완료');
  }

  executeGenericRanged(scene, caster, target) {
    // 일반 원거리 스킬 (기존 로직)
    const projectile = scene.add.circle(caster.x, caster.y, 8, 0xFF0000, 0.8);
    projectile.setDepth(50);

    // 타겟이 없으면 마우스 포인터 사용
    let targetX, targetY, targetMonster;
    if (target && !target.isDead) {
      targetX = target.x;
      targetY = target.y;
      targetMonster = target;
    } else {
      // 마우스 방향으로 발사
      const pointer = scene.input.activePointer;
      const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const distance = 200; // 발사 거리
      const angle = Phaser.Math.Angle.Between(caster.x, caster.y, worldPoint.x, worldPoint.y);
      targetX = caster.x + Math.cos(angle) * distance;
      targetY = caster.y + Math.sin(angle) * distance;
      targetMonster = null;
    }

    scene.tweens.add({
      targets: projectile,
      x: targetX,
      y: targetY,
      duration: 300,
      onComplete: () => {
        projectile.destroy();

        // 타겟이 있으면 피해 적용
        if (targetMonster && !targetMonster.isDead) {
          const baseDamage = Math.floor(caster.stats.attack * this.damageMultiplier + this.damage);
          const comboMultiplier = caster.getComboMultiplier ? caster.getComboMultiplier() : 1.0;
          const totalDamage = Math.floor(baseDamage * comboMultiplier);

          const result = targetMonster.takeDamage(totalDamage, caster);
          scene.showDamageText(targetMonster.x, targetMonster.y - 30, result.damage, result.isCrit, result.isEvaded);

          // 콤보 증가
          if (!result.isEvaded && caster.increaseCombo) {
            caster.increaseCombo();
          }

          // 넉백 적용
          if (!result.isEvaded && this.knockbackPower > 0) {
            const knockbackSource = { x: caster.x, y: caster.y };
            targetMonster.applyKnockback(this.knockbackPower, 300, knockbackSource);
          }
        }
      }
    });
  }
}

/**
 * 투사체 스킬 생성 함수
 */
export function createProjectileSkill(skillData, player) {
  return new Skill({
    ...skillData,
    execute: (targetX, targetY) => {
      // 기본 투사체 발사 (전사용)
      const angle = Phaser.Math.Angle.Between(player.x, player.y, targetX, targetY);
      const distance = 400; // 사거리
      const projectile = player.scene.add.circle(player.x, player.y, 8, 0xFF0000, 0.8);
      projectile.setDepth(50);

      player.scene.physics.add.existing(projectile);
      projectile.body.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);

      // 충돌 처리
      player.scene.physics.add.overlap(projectile, player.scene.monsters, (proj, monster) => {
        const damage = Math.floor(player.stats.attack * (skillData.damageMultiplier || 1.0));
        monster.takeDamage(damage, player);
        proj.destroy();
      });

      // 사거리 제한
      player.scene.time.delayedCall(distance / 300 * 1000, () => {
        if (projectile.active) projectile.destroy();
      });
    }
  });
}

/**
 * 장벽 스킬 생성 함수
 */
export function createBarrierSkill(skillData, player) {
  return new Skill({
    ...skillData,
    execute: () => {
      // 전사 장벽 생성 (방어 자세)
      const barrier = player.scene.add.rectangle(player.x, player.y - 20, 120, 8, 0xFFD700, 0.8);
      player.scene.physics.add.existing(barrier);
      barrier.body.setImmovable(true);

      // 일정 시간 후 제거
      player.scene.time.delayedCall(skillData.duration || 3000, () => {
        if (barrier.active) barrier.destroy();
      });
    }
  });
}