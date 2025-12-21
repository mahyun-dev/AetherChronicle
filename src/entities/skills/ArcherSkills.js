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
    // 후퇴 사격: 고퀄리티 후방 도약 + 화살 난사
    const retreatDistance = 180; // 더 먼 거리
    const retreatX = caster.x - Math.cos(angle) * retreatDistance;
    const retreatY = caster.y - Math.sin(angle) * retreatDistance;

    const dashColors = [0xFFFFFF, 0xFFFF00, 0xFFA500];

    // 초기 도약 충격파
    const initialShockwave = scene.add.circle(caster.x, caster.y, 15, dashColors[0], 0.9);
    initialShockwave.setDepth(90);
    scene.tweens.add({
      targets: initialShockwave,
      scale: 2,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => initialShockwave.destroy()
    });

    // 도약 이펙트 - 다중 레이어
    for (let i = 0; i < 3; i++) {
      const dashEffect = scene.add.circle(caster.x, caster.y, 25 - i * 5, dashColors[i], 0.7 - i * 0.2);
      dashEffect.setDepth(95 - i);
      scene.tweens.add({
        targets: dashEffect,
        scale: 0.3,
        alpha: 0,
        duration: 250 + i * 50,
        ease: 'Power2',
        onComplete: () => dashEffect.destroy()
      });
    }

    // 고퀄리티 도약 잔상 효과
    for (let i = 0; i < 8; i++) {
      scene.time.delayedCall(i * 25, () => {
        const trailSize = 18 - i * 1.5;
        const trail = scene.add.circle(caster.x, caster.y, trailSize, dashColors[0], 0.5 - i * 0.05);
        trail.setDepth(94);
        scene.tweens.add({
          targets: trail,
          alpha: 0,
          scale: 0.2,
          duration: 200,
          ease: 'Power2',
          onComplete: () => trail.destroy()
        });
      });
    }

    // 바람 효과 (도약 방향으로)
    for (let i = 0; i < 6; i++) {
      scene.time.delayedCall(i * 30, () => {
        const windAngle = angle + Math.PI + (Math.random() - 0.5) * 0.5;
        const windDistance = 30 + Math.random() * 20;
        const wind = scene.add.rectangle(
          caster.x + Math.cos(windAngle) * windDistance,
          caster.y + Math.sin(windAngle) * windDistance,
          4, 15 + Math.random() * 10, dashColors[1], 0.6
        );
        wind.setRotation(windAngle);
        wind.setDepth(93);

        scene.tweens.add({
          targets: wind,
          alpha: 0,
          scaleY: 0.3,
          duration: 300,
          onComplete: () => wind.destroy()
        });
      });
    }

    // 도약 애니메이션
    scene.tweens.add({
      targets: caster,
      x: retreatX,
      y: retreatY,
      duration: 250, // 약간 더 느리게
      ease: 'Power3',
      onUpdate: (tween) => {
        // 도약 중 추가 잔상
        if (Math.random() < 0.3) {
          const currentTrail = scene.add.circle(caster.x, caster.y, 12, dashColors[2], 0.4);
          currentTrail.setDepth(92);
          scene.tweens.add({
            targets: currentTrail,
            alpha: 0,
            scale: 0.5,
            duration: 150,
            onComplete: () => currentTrail.destroy()
          });
        }
      },
      onComplete: () => {
        // 고퀄리티 착지 효과
        for (let i = 0; i < 4; i++) {
          const landingEffect = scene.add.circle(retreatX, retreatY, 35 - i * 5, dashColors[i % 3], 0.8 - i * 0.15);
          landingEffect.setDepth(95);
          scene.tweens.add({
            targets: landingEffect,
            scale: 2 + i * 0.5,
            alpha: 0,
            duration: 400 + i * 100,
            ease: 'Power2',
            onComplete: () => landingEffect.destroy()
          });
        }

        // 착지 시 먼지 효과
        for (let i = 0; i < 12; i++) {
          const dustAngle = (i / 12) * Math.PI * 2;
          const dustDistance = Math.random() * 25;
          const dust = scene.add.circle(
            retreatX + Math.cos(dustAngle) * dustDistance,
            retreatY + Math.sin(dustAngle) * dustDistance,
            3, 0x8B4513, 0.7
          );
          dust.setDepth(91);

          scene.tweens.add({
            targets: dust,
            x: retreatX + Math.cos(dustAngle) * (dustDistance + 20),
            y: retreatY + Math.sin(dustAngle) * (dustDistance + 20),
            alpha: 0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => dust.destroy()
          });
        }

        // 도약 후 전방에 5발 화살 발사 (더 넓고 빠르게)
        for (let i = 0; i < 5; i++) {
          const spreadAngle = (i - 2) * 0.3; // -0.6, -0.3, 0, 0.3, 0.6 라디안 분산
          scene.time.delayedCall(i * 80, () => { // 0.08초 간격으로 발사
            this.createProjectile(scene, caster, angle + spreadAngle);
          });
        }

        // 화살 난사 시 추가 효과
        scene.time.delayedCall(100, () => {
          const arrowStorm = scene.add.circle(caster.x, caster.y, 40, dashColors[1], 0.4);
          arrowStorm.setDepth(96);
          scene.tweens.add({
            targets: arrowStorm,
            scale: 1.5,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => arrowStorm.destroy()
          });
        });
      }
    });
  }

  executePoisonArrow(scene, caster, angle) {
    // 독화살: 고퀄리티 독 효과가 적용된 단일 화살 발사
    const projectile = this.createProjectile(scene, caster, angle);

    const poisonColors = [0x00FF00, 0x32CD32, 0x228B22, 0x006400];

    // 독 효과 적용 (다중 틴트로 더 독특하게)
    projectile.setTint(poisonColors[0]);

    // 독 효과 값 설정
    projectile.poisonDamage = this.poisonDamage || Math.floor(caster.stats.attack * 0.25); // 공격력의 25%
    projectile.poisonDuration = this.poisonDuration || 6000; // 6초 지속

    // 고퀄리티 독 화살 발사 효과
    for (let i = 0; i < 4; i++) {
      const poisonTrail = scene.add.circle(caster.x, caster.y, 30 - i * 5, poisonColors[i], 0.6 - i * 0.1);
      poisonTrail.setDepth(95);
      scene.tweens.add({
        targets: poisonTrail,
        scale: 2 + i * 0.5,
        alpha: 0,
        duration: 400 + i * 100,
        ease: 'Power2',
        onComplete: () => poisonTrail.destroy()
      });
    }

    // 독 안개 효과
    for (let i = 0; i < 8; i++) {
      scene.time.delayedCall(i * 50, () => {
        const mistAngle = Math.random() * Math.PI * 2;
        const mistDistance = 20 + Math.random() * 15;
        const mist = scene.add.circle(
          caster.x + Math.cos(mistAngle) * mistDistance,
          caster.y + Math.sin(mistAngle) * mistDistance,
          8, poisonColors[1], 0.4
        );
        mist.setDepth(94);

        scene.tweens.add({
          targets: mist,
          alpha: 0,
          scale: 1.5,
          duration: 800,
          ease: 'Power2',
          onComplete: () => mist.destroy()
        });
      });
    }

    // 독 화살 트레일 효과 강화
    const enhancedTrailTimer = scene.time.addEvent({
      delay: 20,
      callback: () => {
        if (!projectile.active) return;

        // 독 파티클 트레일
        for (let i = 0; i < 3; i++) {
          const trailAngle = angle + (Math.random() - 0.5) * 0.3;
          const trailDistance = Math.random() * 10;
          const poisonParticle = scene.add.circle(
            projectile.x + Math.cos(trailAngle) * trailDistance,
            projectile.y + Math.sin(trailAngle) * trailDistance,
            3, poisonColors[Math.floor(Math.random() * poisonColors.length)], 0.8
          );
          poisonParticle.setDepth(97);

          scene.tweens.add({
            targets: poisonParticle,
            alpha: 0,
            scale: 1.2,
            duration: 400,
            ease: 'Power2',
            onComplete: () => poisonParticle.destroy()
          });
        }
      },
      loop: true
    });

    // 화살이 사라질 때 트레일 타이머도 제거
    const originalDestroy = projectile.destroy;
    projectile.destroy = () => {
      if (enhancedTrailTimer) enhancedTrailTimer.remove();
      originalDestroy.call(projectile);
    };
  }

  createProjectile(scene, caster, angle) {
    const speed = 600; // 더 빠르게
    const projectile = scene.add.sprite(caster.x, caster.y, 'arrow');
    projectile.setDepth(100);
    projectile.setScale(1.0); // 화살 크기 키움

    // 화살 회전 설정 (발사 방향으로)
    projectile.setRotation(angle);

    // 화살 발사 시 빛나는 효과
    const launchGlow = scene.add.circle(caster.x, caster.y, 15, 0xFFFF00, 0.8);
    launchGlow.setDepth(95);
    scene.tweens.add({
      targets: launchGlow,
      scale: 2,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => launchGlow.destroy()
    });

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

    // 고퀄리티 화살 트레일 효과
    const trailTimer = scene.time.addEvent({
      delay: 25,
      callback: () => {
        if (!projectile.active) return;

        // 메인 트레일
        const trail1 = scene.add.circle(projectile.x, projectile.y, 6, 0xFFFF00, 0.6);
        trail1.setDepth(98);
        const trail2 = scene.add.circle(projectile.x, projectile.y, 4, 0xFFA500, 0.7);
        trail2.setDepth(97);

        scene.tweens.add({
          targets: trail1,
          alpha: 0,
          scale: 1.5,
          duration: 300,
          ease: 'Power2',
          onComplete: () => trail1.destroy()
        });

        scene.tweens.add({
          targets: trail2,
          alpha: 0,
          scale: 1.2,
          duration: 250,
          ease: 'Power2',
          onComplete: () => trail2.destroy()
        });

        // 추가 스파크 효과
        for (let i = 0; i < 2; i++) {
          const sparkAngle = angle + (Math.random() - 0.5) * 0.5;
          const sparkDistance = Math.random() * 8;
          const spark = scene.add.circle(
            projectile.x + Math.cos(sparkAngle) * sparkDistance,
            projectile.y + Math.sin(sparkAngle) * sparkDistance,
            2, 0xFFFFFF, 0.9
          );
          spark.setDepth(96);

          scene.tweens.add({
            targets: spark,
            alpha: 0,
            scale: 0.5,
            duration: 200,
            onComplete: () => spark.destroy()
          });
        }
      },
      loop: true
    });

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
            if (distance <= 35) { // 투사체 범위 증가
              projectile.hitMonsters.add(monster);

              // 고퀄리티 관통 시각 효과
              const pierceColors = [0xFFFF00, 0xFF6600, 0xFF3300];

              for (let stage = 0; stage < 3; stage++) {
                scene.time.delayedCall(stage * 50, () => {
                  for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2;
                    const particleX = monster.x + Math.cos(angle) * (20 + stage * 10);
                    const particleY = monster.y + Math.sin(angle) * (20 + stage * 10);

                    const particle = scene.add.circle(particleX, particleY, 4, pierceColors[stage], 0.9);
                    particle.setDepth(102);
                    scene.tweens.add({
                      targets: particle,
                      x: particleX + Math.cos(angle) * 40,
                      y: particleY + Math.sin(angle) * 40,
                      alpha: 0,
                      scale: 1.5,
                      duration: 500,
                      ease: 'Power2',
                      onComplete: () => particle.destroy()
                    });
                  }
                });
              }

              // 화살 섬광 효과 - 더 화려하게
              const flash1 = scene.add.circle(monster.x, monster.y, 25, 0xFFFFFF, 1);
              flash1.setDepth(101);
              const flash2 = scene.add.circle(monster.x, monster.y, 20, 0xFFFF00, 0.9);
              flash2.setDepth(102);

              scene.tweens.add({
                targets: flash1,
                scale: 2,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => flash1.destroy()
              });

              scene.tweens.add({
                targets: flash2,
                scale: 2.5,
                alpha: 0,
                duration: 400,
                ease: 'Power2',
                onComplete: () => flash2.destroy()
              });

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
        loop: true
      });
    }

    // 일정 거리 후 제거 - 화려한 사라짐 효과
    scene.time.delayedCall(this.range / speed * 1000, () => {
      if (projectile && projectile.active) {
        if (trailTimer) trailTimer.remove();
        if (projectile.updateTimer) projectile.updateTimer.remove();

        // 사라짐 시 빛 폭발 효과
        const vanishBurst = scene.add.circle(projectile.x, projectile.y, 12, 0xFFFF00, 0.9);
        vanishBurst.setDepth(103);
        scene.tweens.add({
          targets: vanishBurst,
          scale: 3,
          alpha: 0,
          duration: 400,
          ease: 'Power2',
          onComplete: () => vanishBurst.destroy()
        });

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
    // 폭풍우 화살: 고퀄리티 폭풍우 효과
    const stormDuration = 8000;
    const damageInterval = 600; // 더 빠른 피해 간격
    const stormRadius = this.radius || 400;

    // 폭풍우 색상 팔레트 (파란색/하늘색 계열)
    const stormColors = [0x87CEEB, 0x4682B4, 0x1E90FF, 0x00BFFF, 0x6495ED, 0x4169E1, 0x0000FF];

    // 초기 폭풍우 충격파 - 다중 레이어
    for (let i = 0; i < 3; i++) {
      const shockwave = scene.add.circle(centerX, centerY, 20 + i * 15, 0xFFFFFF, 0.8 - i * 0.2);
      shockwave.setDepth(45 - i);
      scene.tweens.add({
        targets: shockwave,
        scale: 3 + i,
        alpha: 0,
        duration: 500 + i * 200,
        ease: 'Power2',
        onComplete: () => shockwave.destroy()
      });
    }

    // 메인 폭풍우 영역 표시 - 다중 레이어
    const stormField = scene.add.circle(centerX, centerY, stormRadius, stormColors[0], 0.2);
    stormField.setDepth(50);

    const stormFieldBorder1 = scene.add.circle(centerX, centerY, stormRadius + 5, stormColors[1], 0.15);
    stormFieldBorder1.setDepth(49);

    const stormFieldBorder2 = scene.add.circle(centerX, centerY, stormRadius + 10, stormColors[2], 0.1);
    stormFieldBorder2.setDepth(48);

    // 번개 링 효과 - 다중 회전
    const lightningRings = [];
    for (let i = 0; i < 3; i++) {
      const ring = scene.add.circle(centerX, centerY, stormRadius + 15 + i * 8, stormColors[3 + i], 0.08);
      ring.setDepth(47 - i);
      lightningRings.push(ring);

      // 각 링마다 다른 방향과 속도로 회전
      scene.tweens.add({
        targets: ring,
        rotation: (i % 2 === 0 ? 1 : -1) * Math.PI * 2,
        duration: 2000 + i * 500,
        repeat: -1,
        ease: 'Linear'
      });
    }

    // 폭풍우 구름 효과 - 중앙에 떠다니는 구름들
    const clouds = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const distance = stormRadius * 0.6;
      const cloud = scene.add.circle(
        centerX + Math.cos(angle) * distance,
        centerY + Math.sin(angle) * distance,
        25 + Math.random() * 15, stormColors[4], 0.3
      );
      cloud.setDepth(46);
      clouds.push(cloud);

      // 구름이 천천히 회전하며 움직임
      scene.tweens.add({
        targets: cloud,
        angle: 360,
        scale: 1.2,
        duration: 4000 + Math.random() * 2000,
        repeat: -1,
        ease: 'Linear'
      });
    }

    // 화살 비 이펙트 - 고퀄리티 강화
    const arrowRain = scene.time.addEvent({
      delay: 120, // 더 빠른 화살 생성
      callback: () => {
        // 폭풍우 영역 내 랜덤 위치에 화살 생성 (더 넓은 범위)
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * stormRadius * 0.9; // 90% 범위까지
        const arrowX = centerX + Math.cos(angle) * distance;
        const arrowY = centerY + Math.sin(angle) * distance;

        // 실제 화살 이미지 사용 + 빛나는 효과
        const arrow = scene.add.sprite(arrowX, arrowY, 'arrow');
        arrow.setDepth(100);
        arrow.setScale(0.7); // 약간 더 크게
        arrow.setRotation(angle + Math.PI / 2); // 아래로 향하게

        // 화살 주변 빛나는 오라 효과
        const arrowGlow = scene.add.circle(arrowX, arrowY, 8, stormColors[5], 0.6);
        arrowGlow.setDepth(99);

        // 화살 낙하 애니메이션 + 회전 + 빛 효과
        scene.tweens.add({
          targets: [arrow, arrowGlow],
          y: arrowY + 100, // 더 멀리 떨어지게
          rotation: arrow.rotation + Math.PI * 1.5, // 더 많이 회전
          alpha: 0,
          duration: 700, // 더 긴 낙하 시간
          onComplete: () => {
            arrow.destroy();
            arrowGlow.destroy();
          }
        });

        // 화살 궤적 파티클 효과
        const trailParticles = [];
        for (let i = 0; i < 5; i++) {
          scene.time.delayedCall(i * 50, () => {
            if (arrow.active) {
              const trailX = arrow.x + (Math.random() - 0.5) * 10;
              const trailY = arrow.y + Math.random() * 20;
              const trail = scene.add.circle(trailX, trailY, 2, stormColors[6], 0.8);
              trail.setDepth(98);
              trailParticles.push(trail);

              scene.tweens.add({
                targets: trail,
                alpha: 0,
                scale: 0.5,
                duration: 300,
                onComplete: () => trail.destroy()
              });
            }
          });
        }

        // 착지 시 고퀄리티 폭발 효과
        scene.time.delayedCall(500, () => {
          if (arrow && arrow.active) {
            const impactX = arrow.x;
            const impactY = arrow.y;

            // 다중 레이어 폭발
            for (let layer = 0; layer < 3; layer++) {
              for (let i = 0; i < 8; i++) {
                const particleAngle = (i / 8) * Math.PI * 2 + (layer * Math.PI / 8);
                const particleDistance = 15 + layer * 10;
                const particle = scene.add.star(
                  impactX + Math.cos(particleAngle) * particleDistance,
                  impactY + Math.sin(particleAngle) * particleDistance,
                  4, 8, 4, stormColors[layer + 3], 0.9
                );
                particle.setDepth(101);

                scene.tweens.add({
                  targets: particle,
                  x: impactX + Math.cos(particleAngle) * (particleDistance * 3),
                  y: impactY + Math.sin(particleAngle) * (particleDistance * 3),
                  alpha: 0,
                  scale: 0.3,
                  duration: 600 + layer * 100,
                  ease: 'Power3',
                  onComplete: () => particle.destroy()
                });
              }
            }

            // 중앙 번개 섬광
            const lightningFlash = scene.add.circle(impactX, impactY, 30, 0xFFFFFF, 0.8);
            lightningFlash.setDepth(102);
            scene.tweens.add({
              targets: lightningFlash,
              scale: 2,
              alpha: 0,
              duration: 200,
              onComplete: () => lightningFlash.destroy()
            });
          }
        });
      },
      loop: true
    });

    // 지속 피해 - 고퀄리티 번개 효과
    const damageTimer = scene.time.addEvent({
      delay: damageInterval,
      callback: () => {
        const monsters = scene.monsters.getChildren();
        const damagePerTick = Math.floor(caster.stats.attack * 0.25); // 공격력의 25%

        monsters.forEach(monster => {
          const distance = Phaser.Math.Distance.Between(centerX, centerY, monster.x, monster.y);
          if (distance <= stormRadius && !monster.isDead) {
            const result = monster.takeDamage(damagePerTick, caster);
            scene.showDamageText(monster.x, monster.y - 30, result.damage, result.isCrit, result.isEvaded);

            // 고퀄리티 번개 피해 효과
            if (!result.isEvaded) {
              // 번개 체인 효과
              for (let chain = 0; chain < 3; chain++) {
                scene.time.delayedCall(chain * 100, () => {
                  const lightningBolt = scene.add.circle(monster.x, monster.y, 35 - chain * 5, 0xFFFFFF, 0.9 - chain * 0.2);
                  lightningBolt.setDepth(103);

                  // 번개 파티클
                  for (let i = 0; i < 6; i++) {
                    const sparkAngle = Math.random() * Math.PI * 2;
                    const sparkDistance = Math.random() * 25;
                    const spark = scene.add.circle(
                      monster.x + Math.cos(sparkAngle) * sparkDistance,
                      monster.y + Math.sin(sparkAngle) * sparkDistance,
                      3, stormColors[Math.floor(Math.random() * stormColors.length)], 0.8
                    );
                    spark.setDepth(104);

                    scene.tweens.add({
                      targets: spark,
                      alpha: 0,
                      scale: 0.2,
                      duration: 400,
                      onComplete: () => spark.destroy()
                    });
                  }

                  scene.tweens.add({
                    targets: lightningBolt,
                    scale: 1.5,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => lightningBolt.destroy()
                  });
                });
              }
            }
          }
        });
      },
      repeat: stormDuration / damageInterval - 1
    });

    // 폭풍우 종료 - 대규모 폭발 효과
    scene.time.delayedCall(stormDuration, () => {
      arrowRain.remove();
      damageTimer.remove();

      // 최종 폭풍우 폭발 - 다중 레이어
      for (let burst = 0; burst < 5; burst++) {
        scene.time.delayedCall(burst * 200, () => {
          for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const distance = stormRadius * (0.5 + burst * 0.1);
            const finalExplosion = scene.add.star(
              centerX + Math.cos(angle) * distance,
              centerY + Math.sin(angle) * distance,
              6, 12, 6, stormColors[burst % stormColors.length], 0.8
            );
            finalExplosion.setDepth(105 + burst);

            scene.tweens.add({
              targets: finalExplosion,
              x: centerX + Math.cos(angle) * (distance * 2),
              y: centerY + Math.sin(angle) * (distance * 2),
              alpha: 0,
              scale: 0.5,
              duration: 1000,
              ease: 'Power3',
              onComplete: () => finalExplosion.destroy()
            });
          }
        });
      }

      // 중앙 대폭발
      const centerExplosion = scene.add.circle(centerX, centerY, 50, 0xFFFFFF, 0.9);
      centerExplosion.setDepth(110);
      scene.tweens.add({
        targets: centerExplosion,
        scale: 4,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => centerExplosion.destroy()
      });

      // 모든 요소 사라짐 애니메이션
      const allElements = [
        stormField, stormFieldBorder1, stormFieldBorder2,
        ...lightningRings, ...clouds
      ];

      allElements.forEach((element, index) => {
        if (element && element.active) {
          scene.tweens.add({
            targets: element,
            alpha: 0,
            scale: 1.3 + Math.random() * 0.4,
            angle: element.angle + 180 + Math.random() * 180,
            duration: 1000 + Math.random() * 500,
            delay: Math.random() * 500,
            ease: 'Power2',
            onComplete: () => element.destroy()
          });
        }
      });
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
      // 궁수 투사체 발사 (화살)
      const angle = Phaser.Math.Angle.Between(player.x, player.y, targetX, targetY);
      const distance = 600; // 사거리
      const arrow = player.scene.add.rectangle(player.x, player.y, 12, 3, 0x8B4513, 1);
      arrow.setRotation(angle);
      arrow.setDepth(50);

      player.scene.physics.add.existing(arrow);
      arrow.body.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);

      // 충돌 처리
      player.scene.physics.add.overlap(arrow, player.scene.monsters, (arr, monster) => {
        const damage = Math.floor(player.stats.attack * (skillData.damageMultiplier || 1.5));
        monster.takeDamage(damage, player);
        arr.destroy();
      });

      // 사거리 제한
      player.scene.time.delayedCall(distance / 500 * 1000, () => {
        if (arrow.active) arrow.destroy();
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
      // 궁수 장벽 생성 (가시 트랩)
      const barrier = player.scene.add.rectangle(player.x, player.y - 20, 80, 4, 0x8B4513, 0.6);
      player.scene.physics.add.existing(barrier);
      barrier.body.setImmovable(true);

      // 일정 시간 후 제거
      player.scene.time.delayedCall(skillData.duration || 2500, () => {
        if (barrier.active) barrier.destroy();
      });
    }
  });
}