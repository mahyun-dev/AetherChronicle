import Phaser from 'phaser';
import { Skill } from '../Skill.js';

/**
 * ArcherSkills - 궁수 스킬들
 * 관통 화살, 후퇴 사격
 */

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

    // 후퇴사격 스킬인 경우 (archer_skill_2)
    if (this.id === 'archer_skill_2') {
      this.executeRetreatShot(scene, caster, angle);
    } else if (this.id === 'archer_skill_3') {
      // 독화살 스킬
      this.executePoisonArrow(scene, caster, angle);
    } else {
      // 일반 원거리 스킬
      const projectileCount = this.projectileCount || 1;
      for (let i = 0; i < projectileCount; i++) {
        // 여러 발 발사 시 약간의 각도 분산
        const spreadAngle = projectileCount > 1 ? (i - (projectileCount - 1) / 2) * 0.2 : 0;
        this.createProjectile(scene, caster, angle + spreadAngle);
      }
    }
  }

  executeRetreatShot(scene, caster, angle) {
    // 후퇴 사격: 후방 도약 + 화살 난사
    const retreatDistance = 150;
    const retreatX = caster.x - Math.cos(angle) * retreatDistance;
    const retreatY = caster.y - Math.sin(angle) * retreatDistance;

    // 도약 이펙트
    const dashEffect = scene.add.circle(caster.x, caster.y, 20, 0xFFFFFF, 0.8);
    dashEffect.setDepth(95);
    scene.tweens.add({
      targets: dashEffect,
      scale: 0.5,
      alpha: 0,
      duration: 200,
      onComplete: () => dashEffect.destroy()
    });

    // 도약 잔상 효과
    for (let i = 0; i < 5; i++) {
      scene.time.delayedCall(i * 30, () => {
        const trail = scene.add.circle(caster.x, caster.y, 15, 0xFFFFFF, 0.4);
        trail.setDepth(94);
        scene.tweens.add({
          targets: trail,
          alpha: 0,
          scale: 0.3,
          duration: 150,
          onComplete: () => trail.destroy()
        });
      });
    }

    // 도약 애니메이션
    scene.tweens.add({
      targets: caster,
      x: retreatX,
      y: retreatY,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        // 착지 효과
        const landingEffect = scene.add.circle(retreatX, retreatY, 30, 0xFFFFFF, 0.6);
        landingEffect.setDepth(95);
        scene.tweens.add({
          targets: landingEffect,
          scale: 1.5,
          alpha: 0,
          duration: 300,
          onComplete: () => landingEffect.destroy()
        });

        // 도약 후 전방에 3발 화살 발사 (더 넓은 범위로)
        for (let i = 0; i < 3; i++) {
          const spreadAngle = (i - 1) * 0.4; // -0.4, 0, 0.4 라디안 분산 (더 넓게)
          scene.time.delayedCall(i * 100, () => { // 0.1초 간격으로 발사
            this.createProjectile(scene, caster, angle + spreadAngle);
          });
        }
      }
    });
  }

  executePoisonArrow(scene, caster, angle) {
    // 독화살: 독 효과가 적용된 단일 화살 발사
    const projectile = this.createProjectile(scene, caster, angle);

    // 독 효과 적용 (초록색 화살로 표시)
    projectile.setTint(0x00FF00); // 초록색 틴트

    // 독 효과 값 설정
    projectile.poisonDamage = this.poisonDamage || Math.floor(caster.stats.attack * 0.2); // 공격력의 20%
    projectile.poisonDuration = this.poisonDuration || 5000; // 5초 지속

    // 독 화살 발사 효과
    const poisonTrail = scene.add.circle(caster.x, caster.y, 25, 0x00FF00, 0.4);
    poisonTrail.setDepth(95);
    scene.tweens.add({
      targets: poisonTrail,
      scale: 1.2,
      alpha: 0,
      duration: 300,
      onComplete: () => poisonTrail.destroy()
    });
  }

  createProjectile(scene, caster, angle) {
    const speed = 500;
    const projectile = scene.add.sprite(caster.x, caster.y, 'arrow');
    projectile.setDepth(100);
    projectile.setScale(0.9); // 화살 크기 조정

    // 화살 회전 설정 (발사 방향으로)
    projectile.setRotation(angle);

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

    // 관통 화살인 경우 (archer_skill_1)
    if (this.id === 'archer_skill_1') {
      projectile.isPiercing = true;
      projectile.hitMonsters = new Set();

      // 투사체 이동 중 적 체크
      projectile.updateTimer = scene.time.addEvent({
        delay: 16, // 60fps
        callback: () => {
          if (!projectile.active) return;

          const monsters = scene.monsters.getChildren();
          monsters.forEach(monster => {
            if (projectile.hitMonsters.has(monster) || monster.isDead) return;

            const distance = Phaser.Math.Distance.Between(projectile.x, projectile.y, monster.x, monster.y);
            if (distance <= 30) { // 투사체 범위
              projectile.hitMonsters.add(monster);

              // 관통 시각 효과 - 불꽃 파티클
              for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const particleX = monster.x + Math.cos(angle) * 15;
                const particleY = monster.y + Math.sin(angle) * 15;

                const particle = scene.add.circle(particleX, particleY, 3, 0xFF6600, 0.9);
                particle.setDepth(102);
                scene.tweens.add({
                  targets: particle,
                  x: particleX + Math.cos(angle) * 25,
                  y: particleY + Math.sin(angle) * 25,
                  alpha: 0,
                  scale: 0.5,
                  duration: 400,
                  onComplete: () => particle.destroy()
                });
              }

              // 화살 섬광 효과
              const flash = scene.add.circle(monster.x, monster.y, 20, 0xFFFFFF, 0.8);
              flash.setDepth(101);
              scene.tweens.add({
                targets: flash,
                scale: 1.5,
                alpha: 0,
                duration: 200,
                onComplete: () => flash.destroy()
              });

              const result = monster.takeDamage(totalDamage, caster);
              scene.showDamageText(monster.x, monster.y - 30, result.damage, result.isCrit, result.isEvaded);

              // 콤보 증가
              if (!result.isEvaded && caster.increaseCombo) {
                caster.increaseCombo();
              }

              // 넉백 적용
              if (!result.isEvaded && this.knockbackPower > 0) {
                monster.applyKnockback(this.knockbackPower, 300, projectile);
              }
            }
          });
        },
        loop: true
      });
    }

    // 일정 거리 후 제거
    scene.time.delayedCall(this.range / speed * 1000, () => {
      if (projectile && projectile.active) {
        if (projectile.updateTimer) {
          projectile.updateTimer.remove();
        }
        projectile.destroy();
      }
    });

    return projectile;
  }
}

/**
 * AOESkill - 광역 스킬 (폭풍우 화살)
 */
export class AOESkill extends Skill {
  execute(caster, target) {
    const scene = caster.scene;
    const centerX = caster.x;
    const centerY = caster.y;

    // 폭풍우 화살 스킬인 경우 (archer_skill_ultimate)
    if (this.id === 'archer_skill_ultimate') {
      this.executeArrowStorm(scene, caster, centerX, centerY);
    } else {
      // 일반 AOE 스킬 - 화살 폭풍
      const arrowCount = 12;
      const effectRadius = this.radius || 200;

      // 중앙 폭발 효과
      const centerExplosion = scene.add.circle(centerX, centerY, 30, 0xFFFF00, 0.7);
      centerExplosion.setDepth(50);
      scene.tweens.add({
        targets: centerExplosion,
        scale: 2,
        alpha: 0,
        duration: 600,
        onComplete: () => centerExplosion.destroy()
      });

      // 방사형 화살 발사
      for (let i = 0; i < arrowCount; i++) {
        const angle = (i / arrowCount) * Math.PI * 2;
        const targetX = centerX + Math.cos(angle) * effectRadius;
        const targetY = centerY + Math.sin(angle) * effectRadius;

        // 화살 생성 및 발사
        const arrow = scene.add.sprite(centerX, centerY, 'arrow');
        arrow.setDepth(100);
        arrow.setScale(0.8);
        arrow.setRotation(angle);

        scene.tweens.add({
          targets: arrow,
          x: targetX,
          y: targetY,
          duration: 400,
          ease: 'Power2',
          onComplete: () => {
            // 화살 도착 시 폭발 효과
            const impact = scene.add.circle(targetX, targetY, 15, 0xFF6600, 0.8);
            impact.setDepth(99);
            scene.tweens.add({
              targets: impact,
              scale: 1.5,
              alpha: 0,
              duration: 300,
              onComplete: () => impact.destroy()
            });
            arrow.destroy();
          }
        });
      }

      // 범위 내 모든 몬스터 대미지
      scene.time.delayedCall(200, () => {
        const monsters = scene.monsters.getChildren();
        const baseDamage = Math.floor(caster.stats.attack * this.damageMultiplier + this.damage);
        const comboMultiplier = caster.getComboMultiplier ? caster.getComboMultiplier() : 1.0;
        const totalDamage = Math.floor(baseDamage * comboMultiplier);

        monsters.forEach(monster => {
          const distance = Phaser.Math.Distance.Between(centerX, centerY, monster.x, monster.y);
          if (distance <= effectRadius && !monster.isDead) {
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
  }

  executeArrowStorm(scene, caster, centerX, centerY) {
    // 폭풍우 화살: 8초간 지속되는 화살 비
    const stormDuration = 8000;
    const damageInterval = 800; // 0.8초마다 피해 (더 빠르게)
    const stormRadius = this.radius || 400;

    // 폭풍우 영역 표시 - 더 화려하게
    const stormArea = scene.add.circle(centerX, centerY, stormRadius, 0x4444FF, 0.15);
    stormArea.setDepth(1);

    // 회전하는 외곽 효과
    const outerRing = scene.add.circle(centerX, centerY, stormRadius, 0x6666FF, 0.1);
    outerRing.setDepth(1);
    scene.tweens.add({
      targets: outerRing,
      rotation: Math.PI * 2,
      duration: 3000,
      repeat: -1,
      ease: 'Linear'
    });

    // 화살 비 이펙트 - 실제 화살 이미지 사용
    const arrowRain = scene.time.addEvent({
      delay: 150, // 0.15초마다 화살 생성 (더 빠르게)
      callback: () => {
        // 폭풍우 영역 내 랜덤 위치에 화살 생성
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * stormRadius;
        const arrowX = centerX + Math.cos(angle) * distance;
        const arrowY = centerY + Math.sin(angle) * distance;

        // 실제 화살 이미지 사용
        const arrow = scene.add.sprite(arrowX, arrowY, 'arrow');
        arrow.setDepth(100);
        arrow.setScale(0.6); // 폭풍우 화살은 작게
        arrow.setRotation(angle + Math.PI / 2); // 아래로 향하게

        // 화살 낙하 애니메이션 + 회전
        scene.tweens.add({
          targets: arrow,
          y: arrowY + 80,
          rotation: arrow.rotation + Math.PI,
          alpha: 0,
          duration: 600,
          onComplete: () => arrow.destroy()
        });

        // 착지 시 파티클 효과
        scene.time.delayedCall(400, () => {
          if (arrow && arrow.active) {
            const impactX = arrow.x;
            const impactY = arrow.y;

            // 착지 파티클
            for (let i = 0; i < 6; i++) {
              const particleAngle = (i / 6) * Math.PI * 2;
              const particle = scene.add.circle(
                impactX + Math.cos(particleAngle) * 5,
                impactY + Math.sin(particleAngle) * 5,
                2, 0xFFFF00, 0.8
              );
              particle.setDepth(99);
              scene.tweens.add({
                targets: particle,
                x: impactX + Math.cos(particleAngle) * 20,
                y: impactY + Math.sin(particleAngle) * 20,
                alpha: 0,
                duration: 300,
                onComplete: () => particle.destroy()
              });
            }
          }
        });
      },
      loop: true
    });

    // 지속 피해 - 더 강력하게
    const damageTimer = scene.time.addEvent({
      delay: damageInterval,
      callback: () => {
        const monsters = scene.monsters.getChildren();
        const damagePerTick = Math.floor(caster.stats.attack * 0.3); // 공격력의 30%

        monsters.forEach(monster => {
          const distance = Phaser.Math.Distance.Between(centerX, centerY, monster.x, monster.y);
          if (distance <= stormRadius && !monster.isDead) {
            const result = monster.takeDamage(damagePerTick, caster);
            scene.showDamageText(monster.x, monster.y - 30, result.damage, result.isCrit, result.isEvaded);

            // 피해 입을 때 번개 효과
            const lightning = scene.add.circle(monster.x, monster.y, 25, 0xFFFFFF, 0.7);
            lightning.setDepth(98);
            scene.tweens.add({
              targets: lightning,
              scale: 1.8,
              alpha: 0,
              duration: 250,
              onComplete: () => lightning.destroy()
            });
          }
        });
      },
      repeat: stormDuration / damageInterval - 1
    });

    // 폭풍우 종료 - 더 화려하게
    scene.time.delayedCall(stormDuration, () => {
      arrowRain.remove();
      damageTimer.remove();

      // 종료 폭발 효과
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const distance = stormRadius * 0.8;
        const explosion = scene.add.circle(
          centerX + Math.cos(angle) * distance,
          centerY + Math.sin(angle) * distance,
          15, 0xFF6600, 0.8
        );
        explosion.setDepth(97);
        scene.tweens.add({
          targets: explosion,
          scale: 2,
          alpha: 0,
          duration: 800,
          onComplete: () => explosion.destroy()
        });
      }

      scene.tweens.add({
        targets: [stormArea, outerRing],
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          stormArea.destroy();
          outerRing.destroy();
        }
      });
    });
  }
}