import Phaser from 'phaser';
import { Skill } from '../Skill.js';

/**
 * RogueSkills - 도적 스킬들
 * (아직 구현되지 않음 - 기본 구조만 제공)
 */

/**
 * MeleeSkill - 근접 스킬 (그림자 베기)
 */
export class MeleeSkill extends Skill {
  execute(caster, target) {
    const scene = caster.scene;
    const centerX = caster.x;
    const centerY = caster.y;

    // 도적 색상 팔레트 (어둠/그림자 테마) - 더 풍부한 색상
    const rogueColors = [0x2F1B14, 0x4B0082, 0x8B008B, 0x9932CC, 0x8A2BE2, 0x9370DB, 0xBA55D3, 0xDA70D6, 0xDDA0DD, 0xEE82EE];

    // 그림자 베기: 초고퀄리티 근접 공격 효과
    const slashCount = 7; // 더 많은 베기

    // 초기 그림자 충격파 (다중 레이어)
    for (let wave = 0; wave < 3; wave++) {
      scene.time.delayedCall(wave * 50, () => {
        const shockwave = scene.add.circle(centerX, centerY, 15 + wave * 8, rogueColors[wave], 0.8 - wave * 0.2);
        shockwave.setDepth(45 + wave);
        scene.tweens.add({
          targets: shockwave,
          scale: 2.5 + wave * 0.5,
          alpha: 0,
          duration: 400 + wave * 100,
          ease: 'Power2',
          onComplete: () => shockwave.destroy()
        });
      });
    }

    // 캐스터 주변 빛 효과
    const casterGlow = scene.add.circle(centerX, centerY, 35, rogueColors[6], 0.4);
    casterGlow.setDepth(44);
    scene.tweens.add({
      targets: casterGlow,
      scale: 1.8,
      alpha: 0,
      duration: 600,
      ease: 'Power3',
      onComplete: () => casterGlow.destroy()
    });

    for (let i = 0; i < slashCount; i++) {
      scene.time.delayedCall(i * 60, () => {
        // 베기 각도 계산 (더 넓은 팬 형태)
        const baseAngle = Math.PI * 1.3; // 전방 130도 범위
        const angleRange = Math.PI * 0.9;
        const angle = baseAngle - angleRange / 2 + (angleRange / (slashCount - 1)) * i;

        // 베기 길이와 위치
        const slashLength = this.range * 0.9;
        const slashWidth = 12;
        const slashX = centerX + Math.cos(angle) * (slashLength / 2);
        const slashY = centerY + Math.sin(angle) * (slashLength / 2);

        // 메인 베기 효과 (더 두껍고 선명하게)
        const slash = scene.add.rectangle(slashX, slashY, slashLength, slashWidth, rogueColors[0], 0.9);
        slash.setRotation(angle);
        slash.setDepth(100);

        // 베기 테두리 효과 (다중 레이어)
        const slashBorder1 = scene.add.rectangle(slashX, slashY, slashLength + 6, slashWidth + 6, rogueColors[1], 0.6);
        slashBorder1.setRotation(angle);
        slashBorder1.setDepth(99);

        const slashBorder2 = scene.add.rectangle(slashX, slashY, slashLength + 12, slashWidth + 12, rogueColors[2], 0.3);
        slashBorder2.setRotation(angle);
        slashBorder2.setDepth(98);

        // 빛나는 베기 효과
        const slashGlow = scene.add.rectangle(slashX, slashY, slashLength * 1.2, slashWidth * 1.5, rogueColors[7], 0.4);
        slashGlow.setRotation(angle);
        slashGlow.setDepth(97);

        // 베기 파티클 효과 (더 많고 다양하게)
        for (let p = 0; p < 12; p++) {
          const particleAngle = angle + (Math.random() - 0.5) * 0.7;
          const particleDistance = Math.random() * slashLength * 0.9;
          const particleX = centerX + Math.cos(particleAngle) * particleDistance;
          const particleY = centerY + Math.sin(particleAngle) * particleDistance;

          // 다양한 모양의 파티클
          let particle;
          if (p % 3 === 0) {
            particle = scene.add.circle(particleX, particleY, 3, rogueColors[Math.floor(Math.random() * rogueColors.length)], 0.95);
          } else if (p % 3 === 1) {
            particle = scene.add.star(particleX, particleY, 4, 6, 4, rogueColors[Math.floor(Math.random() * rogueColors.length)], 0.9);
          } else {
            particle = scene.add.star(particleX, particleY, 3, 4, 3, rogueColors[Math.floor(Math.random() * rogueColors.length)], 0.9);
            particle.setRotation(Math.random() * Math.PI * 2);
          }

          particle.setDepth(101);

          scene.tweens.add({
            targets: particle,
            alpha: 0,
            scale: 0.2,
            duration: 500 + Math.random() * 300,
            ease: 'Power3',
            onComplete: () => particle.destroy()
          });
        }

        // 추가 빛 파티클 (베기 끝에서 방출)
        for (let light = 0; light < 6; light++) {
          const lightAngle = angle + (Math.random() - 0.5) * 0.3;
          const lightDistance = slashLength * 0.8 + Math.random() * slashLength * 0.4;
          const lightX = centerX + Math.cos(lightAngle) * lightDistance;
          const lightY = centerY + Math.sin(lightAngle) * lightDistance;

          const lightParticle = scene.add.circle(lightX, lightY, 2, rogueColors[8], 0.8);
          lightParticle.setDepth(102);

          scene.tweens.add({
            targets: lightParticle,
            x: lightX + Math.cos(lightAngle) * 30,
            y: lightY + Math.sin(lightAngle) * 30,
            alpha: 0,
            scale: 0.5,
            duration: 400,
            ease: 'Power2',
            onComplete: () => lightParticle.destroy()
          });
        }

        // 베기 애니메이션 (더 화려하게)
        scene.tweens.add({
          targets: [slash, slashBorder1, slashBorder2, slashGlow],
          alpha: 0,
          scaleX: 1.5,
          scaleY: 1.3,
          duration: 350,
          ease: 'Power2',
          onComplete: () => {
            slash.destroy();
            slashBorder1.destroy();
            slashBorder2.destroy();
            slashGlow.destroy();
          }
        });
      });
    }

    // 중앙 그림자 폭발 효과 (더 화려하게)
    scene.time.delayedCall(200, () => {
      // 다중 폭발 레이어
      for (let burst = 0; burst < 3; burst++) {
        scene.time.delayedCall(burst * 80, () => {
          const centerBurst = scene.add.circle(centerX, centerY, 20 + burst * 10, rogueColors[3 + burst], 0.8 - burst * 0.2);
          centerBurst.setDepth(103 + burst);
          scene.tweens.add({
            targets: centerBurst,
            scale: 3 + burst,
            alpha: 0,
            duration: 500 + burst * 100,
            ease: 'Power2',
            onComplete: () => centerBurst.destroy()
          });
        });
      }

      // 중앙 빛 폭발
      const lightBurst = scene.add.circle(centerX, centerY, 40, rogueColors[9], 0.5);
      lightBurst.setDepth(106);
      scene.tweens.add({
        targets: lightBurst,
        scale: 4,
        alpha: 0,
        duration: 600,
        ease: 'Power3',
        onComplete: () => lightBurst.destroy()
      });
    });

    // 범위 내 몬스터 공격 (지연 적용)
    scene.time.delayedCall(250, () => {
      const monsters = scene.monsters.getChildren();
      const baseDamage = Math.floor(caster.stats.attack * this.damageMultiplier + this.damage);
      const comboMultiplier = caster.getComboMultiplier ? caster.getComboMultiplier() : 1.0;
      const totalDamage = Math.floor(baseDamage * comboMultiplier);

      monsters.forEach(monster => {
        const distance = Phaser.Math.Distance.Between(centerX, centerY, monster.x, monster.y);
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

          // 피해 입은 몬스터에 고퀄리티 그림자 효과
          if (!result.isEvaded) {
            // 다중 그림자 효과
            for (let shadow = 0; shadow < 3; shadow++) {
              const shadowEffect = scene.add.circle(monster.x, monster.y, 15 + shadow * 8, rogueColors[4 + shadow], 0.7 - shadow * 0.2);
              shadowEffect.setDepth(98 + shadow);
              scene.tweens.add({
                targets: shadowEffect,
                scale: 2 + shadow * 0.5,
                alpha: 0,
                duration: 400 + shadow * 100,
                ease: 'Power2',
                onComplete: () => shadowEffect.destroy()
              });
            }

            // 빛 파티클 효과
            for (let light = 0; light < 8; light++) {
              const lightAngle = Math.random() * Math.PI * 2;
              const lightDistance = Math.random() * 25;
              const lightParticle = scene.add.circle(
                monster.x + Math.cos(lightAngle) * lightDistance,
                monster.y + Math.sin(lightAngle) * lightDistance,
                2, rogueColors[9], 0.9
              );
              lightParticle.setDepth(107);

              scene.tweens.add({
                targets: lightParticle,
                alpha: 0,
                scale: 0.3,
                duration: 500,
                onComplete: () => lightParticle.destroy()
              });
            }
          }
        }
      });
    });
  }
}

/**
 * RangedSkill - 원거리 스킬 (독 단검)
 */
export class RangedSkill extends Skill {
  execute(caster, target) {
    const scene = caster.scene;

    // 마우스 방향으로 투사체 발사
    const pointer = scene.input.activePointer;
    const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const angle = Phaser.Math.Angle.Between(caster.x, caster.y, worldPoint.x, worldPoint.y);

    // 초고퀄리티 독 단검 발사 이펙트
    const rogueColors = [0x2F1B14, 0x4B0082, 0x8B008B, 0x9932CC, 0x8A2BE2, 0x9370DB, 0x32CD32, 0x00FF00, 0xADFF2F, 0x7FFF00];

    // 다중 레이어 발사 충격파
    for (let wave = 0; wave < 4; wave++) {
      scene.time.delayedCall(wave * 30, () => {
        const castWave = scene.add.circle(caster.x, caster.y, 12 + wave * 6, rogueColors[6 + wave % 2], 0.7 - wave * 0.15);
        castWave.setDepth(90 + wave);
        scene.tweens.add({
          targets: castWave,
          scale: 2 + wave * 0.3,
          alpha: 0,
          duration: 300 + wave * 50,
          ease: 'Power2',
          onComplete: () => castWave.destroy()
        });
      });
    }

    // 발사 빛 효과
    const castLight = scene.add.circle(caster.x, caster.y, 25, rogueColors[9], 0.5);
    castLight.setDepth(94);
    scene.tweens.add({
      targets: castLight,
      scale: 3,
      alpha: 0,
      duration: 400,
      ease: 'Power3',
      onComplete: () => castLight.destroy()
    });

    // 발사 시 빛 파티클 방출
    for (let spark = 0; spark < 12; spark++) {
      const sparkAngle = Math.random() * Math.PI * 2;
      const sparkDistance = Math.random() * 20;
      const sparkParticle = scene.add.star(
        caster.x + Math.cos(sparkAngle) * sparkDistance,
        caster.y + Math.sin(sparkAngle) * sparkDistance,
        3, 5, 3, rogueColors[7 + Math.floor(Math.random() * 3)], 0.9
      );
      sparkParticle.setDepth(95);

      scene.tweens.add({
        targets: sparkParticle,
        x: caster.x + Math.cos(sparkAngle) * (sparkDistance + 15),
        y: caster.y + Math.sin(sparkAngle) * (sparkDistance + 15),
        alpha: 0,
        scale: 0.3,
        duration: 300,
        ease: 'Power2',
        onComplete: () => sparkParticle.destroy()
      });
    }

    // 일반 원거리 스킬
    const projectileCount = this.projectileCount || 1;
    for (let i = 0; i < projectileCount; i++) {
      // 여러 발 발사 시 약간의 각도 분산
      const spreadAngle = projectileCount > 1 ? (i - (projectileCount - 1) / 2) * 0.2 : 0;
      this.createProjectile(scene, caster, angle + spreadAngle, rogueColors);
    }
  }

  createProjectile(scene, caster, angle, rogueColors) {
    const speed = 700; // 더 빠르게

    // 초고퀄리티 독 단검 투사체 생성
    const projectile = scene.add.rectangle(caster.x, caster.y, 16, 4, rogueColors[0], 1);
    projectile.setRotation(angle);
    projectile.setDepth(100);

    // 다중 빛나는 테두리
    const projectileGlow1 = scene.add.rectangle(caster.x, caster.y, 20, 6, rogueColors[6], 0.7);
    projectileGlow1.setRotation(angle);
    projectileGlow1.setDepth(99);

    const projectileGlow2 = scene.add.rectangle(caster.x, caster.y, 24, 8, rogueColors[7], 0.4);
    projectileGlow2.setRotation(angle);
    projectileGlow2.setDepth(98);

    scene.physics.add.existing(projectile);
    projectile.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    // 빛나는 테두리들도 함께 이동
    projectileGlow1.body = projectile.body;
    projectileGlow2.body = projectile.body;

    const totalDamage = Math.floor(caster.stats.attack * this.damageMultiplier + this.damage);
    projectile.damage = totalDamage;
    projectile.owner = caster;
    projectile.isSkillProjectile = true;
    projectile.knockbackPower = this.knockbackPower;

    // 독 효과 설정 (강화)
    projectile.poisonDamage = Math.floor(totalDamage * 0.4); // 피해의 40%
    projectile.poisonDuration = 5000; // 5초 독 지속

    // 초고퀄리티 트레일 효과 시스템
    const trailTimer = scene.time.addEvent({
      delay: 20, // 더 빈번하게
      callback: () => {
        if (!projectile.active) return;

        // 메인 트레일 (다중 레이어)
        for (let layer = 0; layer < 3; layer++) {
          const trail = scene.add.circle(projectile.x, projectile.y, 3 + layer * 2, rogueColors[6 + layer], 0.8 - layer * 0.2);
          trail.setDepth(95 + layer);
          scene.tweens.add({
            targets: trail,
            alpha: 0,
            scale: 2 + layer * 0.5,
            duration: 500 + layer * 100,
            ease: 'Power2',
            onComplete: () => trail.destroy()
          });
        }

        // 독 안개 파티클 (더 많고 다양하게)
        for (let i = 0; i < 5; i++) {
          const mistAngle = angle + (Math.random() - 0.5) * 1.2;
          const mistDistance = Math.random() * 12;
          const mistX = projectile.x + Math.cos(mistAngle) * mistDistance;
          const mistY = projectile.y + Math.sin(mistAngle) * mistDistance;

          // 다양한 모양의 안개 파티클
          let mistParticle;
          if (i % 2 === 0) {
            mistParticle = scene.add.circle(mistX, mistY, 2.5, rogueColors[8], 0.7);
          } else {
            mistParticle = scene.add.star(mistX, mistY, 4, 3, 3, rogueColors[9], 0.6);
            mistParticle.setRotation(Math.random() * Math.PI * 2);
          }

          mistParticle.setDepth(94);

          scene.tweens.add({
            targets: mistParticle,
            alpha: 0,
            scale: 2,
            duration: 600,
            ease: 'Power3',
            onComplete: () => mistParticle.destroy()
          });
        }

        // 빛나는 스파크 파티클
        if (Math.random() < 0.3) { // 30% 확률로
          const sparkAngle = angle + (Math.random() - 0.5) * 0.5;
          const sparkDistance = Math.random() * 8;
          const spark = scene.add.star(
            projectile.x + Math.cos(sparkAngle) * sparkDistance,
            projectile.y + Math.sin(sparkAngle) * sparkDistance,
            3, 4, 3, rogueColors[7], 0.9
          );
          spark.setDepth(96);

          scene.tweens.add({
            targets: spark,
            alpha: 0,
            scale: 0.5,
            duration: 300,
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

    // 일정 거리 후 제거 - 초화려한 사라짐 효과
    scene.time.delayedCall(this.range / speed * 1000, () => {
      if (projectile && projectile.active) {
        trailTimer.remove();

        // 다중 레이어 사라짐 폭발
        for (let burst = 0; burst < 3; burst++) {
          scene.time.delayedCall(burst * 50, () => {
            const vanishBurst = scene.add.circle(projectile.x, projectile.y, 12 + burst * 8, rogueColors[6 + burst], 0.8 - burst * 0.2);
            vanishBurst.setDepth(103 + burst);

            scene.tweens.add({
              targets: vanishBurst,
              scale: 3 + burst,
              alpha: 0,
              duration: 400 + burst * 100,
              ease: 'Power2',
              onComplete: () => vanishBurst.destroy()
            });
          });
        }

        // 독 파티클 폭발 (더 많고 화려하게)
        for (let i = 0; i < 16; i++) {
          const particleAngle = (i / 16) * Math.PI * 2;
          const particleDistance = Math.random() * 15;
          const particleX = projectile.x + Math.cos(particleAngle) * particleDistance;
          const particleY = projectile.y + Math.sin(particleAngle) * particleDistance;

          let explosionParticle;
          if (i % 4 === 0) {
            explosionParticle = scene.add.star(particleX, particleY, 4, 6, 4, rogueColors[8], 0.95);
          } else if (i % 4 === 1) {
            explosionParticle = scene.add.circle(particleX, particleY, 3, rogueColors[9], 0.9);
          } else {
            explosionParticle = scene.add.star(particleX, particleY, 3, 4, 3, rogueColors[7], 0.85);
            explosionParticle.setRotation(Math.random() * Math.PI * 2);
          }

          explosionParticle.setDepth(106);

          scene.tweens.add({
            targets: explosionParticle,
            x: projectile.x + Math.cos(particleAngle) * (particleDistance + 25),
            y: projectile.y + Math.sin(particleAngle) * (particleDistance + 25),
            alpha: 0,
            scale: 0.3,
            duration: 500,
            ease: 'Power3',
            onComplete: () => explosionParticle.destroy()
          });
        }

        // 최종 빛 폭발
        const finalLight = scene.add.circle(projectile.x, projectile.y, 30, rogueColors[9], 0.6);
        finalLight.setDepth(107);
        scene.tweens.add({
          targets: finalLight,
          scale: 4,
          alpha: 0,
          duration: 600,
          ease: 'Power3',
          onComplete: () => {
            finalLight.destroy();
            projectile.destroy();
            projectileGlow1.destroy();
            projectileGlow2.destroy();
          }
        });
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
    const rogueColors = [0x2F1B14, 0x4B0082, 0x8B008B, 0x9932CC, 0x8A2BE2, 0x9370DB, 0xBA55D3, 0xDA70D6, 0xDDA0DD, 0xEE82EE];

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
    const teleportDistance = 70; // 몬스터 뒤 70px (조금 더 멀리)
    const targetX = closestMonster.x - Math.cos(angleToMonster) * teleportDistance;
    const targetY = closestMonster.y - Math.sin(angleToMonster) * teleportDistance;

    // 초고퀄리티 순간이동 효과
    const originalX = caster.x;
    const originalY = caster.y;

    // 출발지 그림자 효과 - 초다중 레이어 (더 화려하게)
    for (let i = 0; i < 5; i++) {
      scene.time.delayedCall(i * 20, () => {
        const shadowBurst = scene.add.circle(originalX, originalY, 12 + i * 6, rogueColors[i % 6], 0.9 - i * 0.15);
        shadowBurst.setDepth(40 + i);
        scene.tweens.add({
          targets: shadowBurst,
          scale: 3 + i * 0.4,
          alpha: 0,
          duration: 400 + i * 80,
          ease: 'Power2',
          onComplete: () => shadowBurst.destroy()
        });
      });
    }

    // 출발지 빛 효과
    const departureLight = scene.add.circle(originalX, originalY, 30, rogueColors[9], 0.5);
    departureLight.setDepth(45);
    scene.tweens.add({
      targets: departureLight,
      scale: 4,
      alpha: 0,
      duration: 500,
      ease: 'Power3',
      onComplete: () => departureLight.destroy()
    });

    // 그림자 파티클 효과 (출발지) - 더 많고 다양하게
    for (let i = 0; i < 20; i++) {
      const particleAngle = (i / 20) * Math.PI * 2;
      const particleDistance = Math.random() * 35;
      const particleX = originalX + Math.cos(particleAngle) * particleDistance;
      const particleY = originalY + Math.sin(particleAngle) * particleDistance;

      // 다양한 모양의 파티클
      let particle;
      if (i % 4 === 0) {
        particle = scene.add.star(particleX, particleY, 4, 6, 4, rogueColors[Math.floor(Math.random() * 6)], 0.8);
      } else if (i % 4 === 1) {
        particle = scene.add.circle(particleX, particleY, 3, rogueColors[Math.floor(Math.random() * 6)], 0.9);
      } else {
        particle = scene.add.star(particleX, particleY, 3, 4, 3, rogueColors[Math.floor(Math.random() * 6)], 0.85);
        particle.setRotation(Math.random() * Math.PI * 2);
      }

      particle.setDepth(46);

      scene.tweens.add({
        targets: particle,
        alpha: 0,
        scale: 0.2,
        duration: 600,
        ease: 'Power3',
        onComplete: () => particle.destroy()
      });
    }

    // 초고퀄리티 순간이동 잔상 효과 (더 많고 정교하게)
    const afterimageCount = 8;
    for (let i = 0; i < afterimageCount; i++) {
      scene.time.delayedCall(i * 30, () => {
        const progress = i / (afterimageCount - 1);
        const currentX = originalX + (targetX - originalX) * progress;
        const currentY = originalY + (targetY - originalY) * progress;

        // 다중 레이어 잔상
        for (let layer = 0; layer < 2; layer++) {
          const afterimage = scene.add.circle(currentX, currentY, 15 - layer * 3, rogueColors[2 + layer], 0.5 - progress * 0.2 - layer * 0.1);
          afterimage.setDepth(47 + layer);

          scene.tweens.add({
            targets: afterimage,
            alpha: 0,
            scale: 0.6,
            duration: 250,
            ease: 'Power2',
            onComplete: () => afterimage.destroy()
          });
        }

        // 잔상 주변 빛 파티클
        if (i % 2 === 0) { // 절반만
          for (let spark = 0; spark < 4; spark++) {
            const sparkAngle = Math.random() * Math.PI * 2;
            const sparkDistance = Math.random() * 10;
            const sparkParticle = scene.add.circle(
              currentX + Math.cos(sparkAngle) * sparkDistance,
              currentY + Math.sin(sparkAngle) * sparkDistance,
              2, rogueColors[8], 0.7
            );
            sparkParticle.setDepth(49);

            scene.tweens.add({
              targets: sparkParticle,
              alpha: 0,
              scale: 0.3,
              duration: 200,
              onComplete: () => sparkParticle.destroy()
            });
          }
        }
      });
    }

    // 순간이동
    caster.x = targetX;
    caster.y = targetY;

    // 도착지 초폭발 효과 - 다중 레이어 (더 화려하게)
    for (let i = 0; i < 6; i++) {
      scene.time.delayedCall(i * 25, () => {
        const arrivalBurst = scene.add.circle(targetX, targetY, 8 + i * 5, rogueColors[3 + i % 4], 0.95 - i * 0.12);
        arrivalBurst.setDepth(50 + i);
        scene.tweens.add({
          targets: arrivalBurst,
          scale: 3.5 - i * 0.3,
          alpha: 0,
          duration: 500 + i * 60,
          ease: 'Power2',
          onComplete: () => arrivalBurst.destroy()
        });
      });
    }

    // 도착지 빛 폭발
    const arrivalLight = scene.add.circle(targetX, targetY, 35, rogueColors[9], 0.6);
    arrivalLight.setDepth(56);
    scene.tweens.add({
      targets: arrivalLight,
      scale: 5,
      alpha: 0,
      duration: 700,
      ease: 'Power3',
      onComplete: () => arrivalLight.destroy()
    });

    // 도착지 그림자 파티클 (더 많고 화려하게)
    for (let i = 0; i < 24; i++) {
      const particleAngle = (i / 24) * Math.PI * 2;
      const particleDistance = 20 + Math.random() * 30;
      const particleX = targetX + Math.cos(particleAngle) * particleDistance;
      const particleY = targetY + Math.sin(particleAngle) * particleDistance;

      // 더 다양한 파티클 모양
      let particle;
      const particleType = Math.floor(Math.random() * 4);
      if (particleType === 0) {
        particle = scene.add.star(particleX, particleY, 5, 7, 5, rogueColors[Math.floor(Math.random() * rogueColors.length)], 0.8);
      } else if (particleType === 1) {
        particle = scene.add.circle(particleX, particleY, 4, rogueColors[Math.floor(Math.random() * rogueColors.length)], 0.9);
      } else if (particleType === 2) {
        particle = scene.add.star(particleX, particleY, 4, 6, 4, rogueColors[Math.floor(Math.random() * rogueColors.length)], 0.85);
        particle.setRotation(Math.random() * Math.PI * 2);
      } else {
        particle = scene.add.triangle(particleX, particleY, 0, 0, 6, 0, 3, 8, rogueColors[Math.floor(Math.random() * rogueColors.length)], 0.8);
      }

      particle.setDepth(57);

      scene.tweens.add({
        targets: particle,
        x: targetX + Math.cos(particleAngle) * (particleDistance * 2.5),
        y: targetY + Math.sin(particleAngle) * (particleDistance * 2.5),
        alpha: 0,
        scale: 0.3,
        duration: 800,
        ease: 'Power3',
        onComplete: () => particle.destroy()
      });
    }

    // 백어택 피해 (1.5배 배율) - 지연 적용
    scene.time.delayedCall(200, () => {
      const baseDamage = Math.floor(caster.stats.attack * this.damageMultiplier + this.damage);
      const comboMultiplier = caster.getComboMultiplier ? caster.getComboMultiplier() : 1.0;
      const totalDamage = Math.floor(baseDamage * comboMultiplier * 1.5); // 백어택 보너스

      const result = closestMonster.takeDamage(totalDamage, caster);
      scene.showDamageText(closestMonster.x, closestMonster.y - 30, result.damage, result.isCrit, result.isEvaded);

      // 콤보 증가
      if (!result.isEvaded && caster.increaseCombo) {
        caster.increaseCombo();
      }

      // 넉백 적용
      if (!result.isEvaded && this.knockbackPower > 0) {
        closestMonster.applyKnockback(this.knockbackPower * 1.5, 400, caster); // 강화된 넉백
      }

      // 백어택 성공 시 초고퀄리티 추가 효과
      if (!result.isEvaded) {
        // 다중 레이어 백스탭 효과
        for (let effect = 0; effect < 4; effect++) {
          scene.time.delayedCall(effect * 40, () => {
            const backstabEffect = scene.add.circle(closestMonster.x, closestMonster.y, 20 + effect * 10, rogueColors[4 + effect], 0.9 - effect * 0.15);
            backstabEffect.setDepth(58 + effect);
            scene.tweens.add({
              targets: backstabEffect,
              scale: 4 + effect,
              alpha: 0,
              duration: 600 + effect * 100,
              ease: 'Power2',
              onComplete: () => backstabEffect.destroy()
            });
          });
        }

        // 백스탭 빛 파티클
        for (let light = 0; light < 16; light++) {
          const lightAngle = (light / 16) * Math.PI * 2;
          const lightDistance = Math.random() * 40;
          const lightParticle = scene.add.star(
            closestMonster.x + Math.cos(lightAngle) * lightDistance,
            closestMonster.y + Math.sin(lightAngle) * lightDistance,
            4, 6, 4, rogueColors[9], 0.8
          );
          lightParticle.setDepth(62);

          scene.tweens.add({
            targets: lightParticle,
            alpha: 0,
            scale: 0.4,
            duration: 700,
            onComplete: () => lightParticle.destroy()
          });
        }

        console.log(`⚔️ 그림자 밟기: ${closestMonster.name}의 뒤를 찔렀다! (백어택 보너스 적용)`);
      } else {
        console.log(`그림자 밟기: ${closestMonster.name}의 뒤로 이동했지만 공격이 빗나갔다!`);
      }
    });
  }
}

/**
 * BuffSkill - 버프 스킬 (독 칠하기)
 */
export class BuffSkill extends Skill {
  execute(caster, target) {
    const scene = caster.scene;
    const rogueColors = [0x2F1B14, 0x4B0082, 0x8B008B, 0x9932CC, 0x32CD32, 0x00FF00, 0xADFF2F];

    // 독 칠하기 스킬인 경우 (rogue_skill_2)
    if (this.id === 'rogue_skill_2') {
      this.executePoisonCoat(scene, caster, rogueColors);
    } else {
      // 일반 버프 스킬
      const effectColor = rogueColors[4]; // 독 효과 색상
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

  executePoisonCoat(scene, caster, rogueColors) {
    // 독 칠하기: 무기에 독을 칠해 다음 공격에 독 효과 적용

    // 초고퀄리티 시전 이펙트 - 다중 레이어 (더 화려하게)
    for (let i = 0; i < 5; i++) {
      scene.time.delayedCall(i * 40, () => {
        const castEffect = scene.add.circle(caster.x, caster.y, 15 + i * 8, rogueColors[4 + i % 3], 0.9 - i * 0.15);
        castEffect.setDepth(90 + i);
        scene.tweens.add({
          targets: castEffect,
          scale: 3 + i * 0.4,
          alpha: 0,
          duration: 500 + i * 80,
          ease: 'Power2',
          onComplete: () => castEffect.destroy()
        });
      });
    }

    // 시전 빛 효과
    const castLight = scene.add.circle(caster.x, caster.y, 35, rogueColors[9], 0.5);
    castLight.setDepth(95);
    scene.tweens.add({
      targets: castLight,
      scale: 4.5,
      alpha: 0,
      duration: 600,
      ease: 'Power3',
      onComplete: () => castLight.destroy()
    });

    // 독 파티클 효과 (더 많고 다양하게)
    for (let i = 0; i < 32; i++) {
      const particleAngle = (i / 32) * Math.PI * 2;
      const particleDistance = Math.random() * 40;
      const particleX = caster.x + Math.cos(particleAngle) * particleDistance;
      const particleY = caster.y + Math.sin(particleAngle) * particleDistance;

      // 다양한 모양의 독 파티클
      let particle;
      if (i % 4 === 0) {
        particle = scene.add.star(particleX, particleY, 4, 6, 4, rogueColors[5 + Math.floor(Math.random() * 2)], 0.85);
      } else if (i % 4 === 1) {
        particle = scene.add.circle(particleX, particleY, 3.5, rogueColors[6 + Math.floor(Math.random() * 2)], 0.9);
      } else {
        particle = scene.add.star(particleX, particleY, 3, 4, 3, rogueColors[7 + Math.floor(Math.random() * 2)], 0.8);
        particle.setRotation(Math.random() * Math.PI * 2);
      }

      particle.setDepth(96);

      scene.tweens.add({
        targets: particle,
        alpha: 0,
        scale: 0.2,
        duration: 700,
        ease: 'Power3',
        onComplete: () => particle.destroy()
      });
    }

    // 독 버프 적용
    caster.hasPoisonCoat = true;
    caster.poisonCoatEffects = this.effects; // 독 효과 저장

    // 초고퀄리티 버프 아우라 (지속 시간 동안) - 더 많은 레이어
    const auraLayers = [];
    for (let i = 0; i < 3; i++) {
      const aura = scene.add.circle(caster.x, caster.y, 50 + i * 12, rogueColors[4 + i], 0.12 - i * 0.03);
      aura.setDepth(1 + i);
      auraLayers.push(aura);

      // 회전하는 독 파티클 링 (다른 방향으로)
      scene.tweens.add({
        targets: aura,
        rotation: i % 2 === 0 ? Math.PI * 2 : -Math.PI * 2,
        duration: 4000 + i * 500,
        repeat: -1,
        ease: 'Linear'
      });
    }

    // 독 안개 효과 (더 많고 복잡하게 주변에 떠다니는 독 파티클)
    const mistParticles = [];
    for (let i = 0; i < 8; i++) {
      const mistAngle = (i / 8) * Math.PI * 2;
      const mistDistance = 40;
      const mistX = caster.x + Math.cos(mistAngle) * mistDistance;
      const mistY = caster.y + Math.sin(mistAngle) * mistDistance;

      // 더 큰 안개 파티클
      const mist = scene.add.circle(mistX, mistY, 10, rogueColors[6], 0.35);
      mist.setDepth(4);
      mistParticles.push(mist);

      // 안개가 플레이어를 따라다니며 움직임 (더 복잡한 패턴)
      scene.tweens.add({
        targets: mist,
        angle: 360,
        scale: 1.3,
        duration: 5000,
        repeat: -1,
        ease: 'Linear'
      });
    }

    // 추가 빛 파티클 링
    const lightParticles = [];
    for (let i = 0; i < 12; i++) {
      const lightAngle = (i / 12) * Math.PI * 2;
      const lightDistance = 45;
      const lightX = caster.x + Math.cos(lightAngle) * lightDistance;
      const lightY = caster.y + Math.sin(lightAngle) * lightDistance;

      const lightParticle = scene.add.star(lightX, lightY, 3, 5, 3, rogueColors[8], 0.6);
      lightParticle.setDepth(5);
      lightParticles.push(lightParticle);

      // 빛 파티클 회전
      scene.tweens.add({
        targets: lightParticle,
        rotation: Math.PI * 2,
        duration: 3000,
        repeat: -1,
        ease: 'Linear'
      });
    }

    // 플레이어를 따라다니는 효과들 (더 빈번한 업데이트)
    const followTimer = scene.time.addEvent({
      delay: 12, // 더 부드럽게 (약 83fps)
      callback: () => {
        if (!caster.active) return;

        auraLayers.forEach((aura, index) => {
          if (aura.active) {
            aura.setPosition(caster.x, caster.y);
          }
        });

        mistParticles.forEach((mist, index) => {
          if (mist.active) {
            const mistAngle = (index / mistParticles.length) * Math.PI * 2 + scene.time.now * 0.0015;
            const mistDistance = 40 + Math.sin(scene.time.now * 0.003 + index) * 8;
            mist.setPosition(
              caster.x + Math.cos(mistAngle) * mistDistance,
              caster.y + Math.sin(mistAngle) * mistDistance
            );
          }
        });

        lightParticles.forEach((light, index) => {
          if (light.active) {
            const lightAngle = (index / lightParticles.length) * Math.PI * 2 - scene.time.now * 0.0008;
            const lightDistance = 45 + Math.cos(scene.time.now * 0.002 + index) * 3;
            light.setPosition(
              caster.x + Math.cos(lightAngle) * lightDistance,
              caster.y + Math.sin(lightAngle) * lightDistance
            );
          }
        });
      },
      loop: true
    });

    // 버프 종료
    scene.time.delayedCall(this.duration, () => {
      followTimer.remove();
      caster.hasPoisonCoat = false;
      caster.poisonCoatEffects = null;

      // 종료 시 초화려한 독 폭발 효과
      for (let burst = 0; burst < 4; burst++) {
        scene.time.delayedCall(burst * 60, () => {
          const endBurst = scene.add.circle(caster.x, caster.y, 25 + burst * 12, rogueColors[4 + burst], 0.85 - burst * 0.15);
          endBurst.setDepth(97 + burst);
          scene.tweens.add({
            targets: endBurst,
            scale: 4 + burst,
            alpha: 0,
            duration: 600 + burst * 100,
            ease: 'Power2',
            onComplete: () => endBurst.destroy()
          });
        });
      }

      // 종료 빛 효과
      const endLight = scene.add.circle(caster.x, caster.y, 40, rogueColors[9], 0.6);
      endLight.setDepth(101);
      scene.tweens.add({
        targets: endLight,
        scale: 5,
        alpha: 0,
        duration: 800,
        ease: 'Power3',
        onComplete: () => endLight.destroy()
      });

      // 독 파티클 폭발
      for (let i = 0; i < 24; i++) {
        const particleAngle = (i / 24) * Math.PI * 2;
        const particleDistance = Math.random() * 30;
        const particleX = caster.x + Math.cos(particleAngle) * particleDistance;
        const particleY = caster.y + Math.sin(particleAngle) * particleDistance;

        let explosionParticle;
        if (i % 3 === 0) {
          explosionParticle = scene.add.star(particleX, particleY, 4, 6, 4, rogueColors[7], 0.9);
        } else if (i % 3 === 1) {
          explosionParticle = scene.add.circle(particleX, particleY, 3, rogueColors[8], 0.95);
        } else {
          explosionParticle = scene.add.star(particleX, particleY, 3, 4, 3, rogueColors[9], 0.85);
          explosionParticle.setRotation(Math.random() * Math.PI * 2);
        }

        explosionParticle.setDepth(102);

        scene.tweens.add({
          targets: explosionParticle,
          x: particleX + Math.cos(particleAngle) * 40,
          y: particleY + Math.sin(particleAngle) * 40,
          alpha: 0,
          scale: 0.3,
          duration: 600,
          ease: 'Power3',
          onComplete: () => explosionParticle.destroy()
        });
      }

      // 모든 효과 사라짐 (더 부드럽게)
      [...auraLayers, ...mistParticles, ...lightParticles].forEach((effect, index) => {
        if (effect && effect.active) {
          scene.tweens.add({
            targets: effect,
            alpha: 0,
            scale: 1.3,
            duration: 1000,
            delay: Math.random() * 400,
            onComplete: () => effect.destroy()
          });
        }
      });

      console.log(`⏰ 독 칠하기: 독 효과가 사라졌다`);
    });

    console.log(`🧪 독 칠하기: ${this.duration / 1000}초간 무기에 강력한 독 효과 적용`);
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
    const rogueColors = [0x2F1B14, 0x4B0082, 0x8B008B, 0x9932CC, 0x8A2BE2, 0x9370DB];

    // 환영 분신 스킬인 경우 (rogue_skill_ultimate)
    if (this.id === 'rogue_skill_ultimate') {
      this.executePhantomClone(scene, caster, centerX, centerY, rogueColors);
    } else {
      // 그림자 베기: 일반 AOE 스킬
      this.executeShadowSlash(scene, caster, centerX, centerY, rogueColors);
    }
  }

  executeShadowSlash(scene, caster, centerX, centerY, rogueColors) {
    // 그림자 베기: 초고퀄리티 다중 베기 공격
    const slashCount = 16; // 더 많은 베기

    // 초기 그림자 충격파 (더 화려하게)
    for (let i = 0; i < 4; i++) {
      scene.time.delayedCall(i * 40, () => {
        const shockwave = scene.add.circle(centerX, centerY, 15 + i * 12, rogueColors[i], 0.8 - i * 0.15);
        shockwave.setDepth(40 + i);
        scene.tweens.add({
          targets: shockwave,
          scale: 3 + i * 0.5,
          alpha: 0,
          duration: 400 + i * 80,
          ease: 'Power2',
          onComplete: () => shockwave.destroy()
        });
      });
    }

    // 그림자 영역 표시 (더 선명하게)
    const shadowField = scene.add.circle(centerX, centerY, this.radius, rogueColors[1], 0.4);
    shadowField.setDepth(44);

    // 회전하는 그림자 링
    const shadowRing = scene.add.circle(centerX, centerY, this.radius + 15, rogueColors[2], 0.2);
    shadowRing.setDepth(43);
    scene.tweens.add({
      targets: shadowRing,
      rotation: Math.PI * 2,
      duration: 2000,
      repeat: -1,
      ease: 'Linear'
    });

    // 베기 애니메이션 (여러 방향으로, 더 빠르고 화려하게)
    for (let i = 0; i < slashCount; i++) {
      scene.time.delayedCall(i * 45, () => {
        const angle = (i / slashCount) * Math.PI * 2;
        const slashLength = this.radius * 0.95;
        const slashWidth = 10;

        // 메인 베기 (더 두껍고 선명하게)
        const slash = scene.add.rectangle(
          centerX + Math.cos(angle) * (slashLength / 2),
          centerY + Math.sin(angle) * (slashLength / 2),
          slashLength, slashWidth, rogueColors[2], 0.95
        );
        slash.setRotation(angle);
        slash.setDepth(100);

        // 베기 테두리 효과 (다중 레이어)
        const slashBorder1 = scene.add.rectangle(
          centerX + Math.cos(angle) * (slashLength / 2),
          centerY + Math.sin(angle) * (slashLength / 2),
          slashLength + 8, slashWidth + 8, rogueColors[3], 0.7
        );
        slashBorder1.setRotation(angle);
        slashBorder1.setDepth(99);

        const slashBorder2 = scene.add.rectangle(
          centerX + Math.cos(angle) * (slashLength / 2),
          centerY + Math.sin(angle) * (slashLength / 2),
          slashLength + 16, slashWidth + 16, rogueColors[4], 0.4
        );
        slashBorder2.setRotation(angle);
        slashBorder2.setDepth(98);

        // 빛나는 베기 효과
        const slashGlow = scene.add.rectangle(
          centerX + Math.cos(angle) * (slashLength / 2),
          centerY + Math.sin(angle) * (slashLength / 2),
          slashLength * 1.3, slashWidth * 1.8, rogueColors[7], 0.5
        );
        slashGlow.setRotation(angle);
        slashGlow.setDepth(97);

        // 베기 파티클 효과 (더 많고 다양하게)
        for (let p = 0; p < 15; p++) {
          const particleAngle = angle + (Math.random() - 0.5) * 0.8;
          const particleDistance = Math.random() * slashLength * 0.9;
          const particleX = centerX + Math.cos(particleAngle) * particleDistance;
          const particleY = centerY + Math.sin(particleAngle) * particleDistance;

          // 다양한 모양의 파티클
          let particle;
          if (p % 4 === 0) {
            particle = scene.add.star(particleX, particleY, 5, 7, 5, rogueColors[Math.floor(Math.random() * rogueColors.length)], 0.9);
          } else if (p % 4 === 1) {
            particle = scene.add.circle(particleX, particleY, 3, rogueColors[Math.floor(Math.random() * rogueColors.length)], 0.95);
          } else if (p % 4 === 2) {
            particle = scene.add.star(particleX, particleY, 4, 4, 4, rogueColors[Math.floor(Math.random() * rogueColors.length)], 0.85);
            particle.setRotation(Math.random() * Math.PI * 2);
          } else {
            particle = scene.add.triangle(particleX, particleY, 0, 0, 5, 0, 2.5, 7, rogueColors[Math.floor(Math.random() * rogueColors.length)], 0.8);
          }

          particle.setDepth(101);

          scene.tweens.add({
            targets: particle,
            alpha: 0,
            scale: 0.2,
            duration: 600 + Math.random() * 400,
            ease: 'Power3',
            onComplete: () => particle.destroy()
          });
        }

        // 추가 빛 파티클 (베기 끝에서 방출)
        for (let light = 0; light < 8; light++) {
          const lightAngle = angle + (Math.random() - 0.5) * 0.4;
          const lightDistance = slashLength * 0.85 + Math.random() * slashLength * 0.3;
          const lightX = centerX + Math.cos(lightAngle) * lightDistance;
          const lightY = centerY + Math.sin(lightAngle) * lightDistance;

          const lightParticle = scene.add.circle(lightX, lightY, 2.5, rogueColors[8], 0.9);
          lightParticle.setDepth(102);

          scene.tweens.add({
            targets: lightParticle,
            x: lightX + Math.cos(lightAngle) * 35,
            y: lightY + Math.sin(lightAngle) * 35,
            alpha: 0,
            scale: 0.6,
            duration: 500,
            ease: 'Power2',
            onComplete: () => lightParticle.destroy()
          });
        }

        // 베기 애니메이션 (더 화려하게)
        scene.tweens.add({
          targets: [slash, slashBorder1, slashBorder2, slashGlow],
          alpha: 0,
          scaleX: 1.6,
          scaleY: 1.4,
          duration: 400,
          ease: 'Power2',
          onComplete: () => {
            slash.destroy();
            slashBorder1.destroy();
            slashBorder2.destroy();
            slashGlow.destroy();
          }
        });
      });
    }

    // 중앙 그림자 폭발 (더 화려하게)
    scene.time.delayedCall(500, () => {
      // 다중 레이어 폭발
      for (let burst = 0; burst < 4; burst++) {
        scene.time.delayedCall(burst * 60, () => {
          const centerBurst = scene.add.circle(centerX, centerY, 25 + burst * 15, rogueColors[3 + burst], 0.85 - burst * 0.15);
          centerBurst.setDepth(103 + burst);
          scene.tweens.add({
            targets: centerBurst,
            scale: 4 + burst,
            alpha: 0,
            duration: 600 + burst * 100,
            ease: 'Power2',
            onComplete: () => centerBurst.destroy()
          });
        });
      }

      // 중앙 빛 폭발
      const lightBurst = scene.add.circle(centerX, centerY, 45, rogueColors[9], 0.6);
      lightBurst.setDepth(107);
      scene.tweens.add({
        targets: lightBurst,
        scale: 6,
        alpha: 0,
        duration: 800,
        ease: 'Power3',
        onComplete: () => lightBurst.destroy()
      });

      // 그림자 파티클 폭발 (더 많고 다양하게)
      for (let i = 0; i < 32; i++) {
        const particleAngle = (i / 32) * Math.PI * 2;
        const particleDistance = Math.random() * this.radius * 0.8;
        const particleX = centerX + Math.cos(particleAngle) * particleDistance;
        const particleY = centerY + Math.sin(particleAngle) * particleDistance;

        let particle;
        const particleType = Math.floor(Math.random() * 4);
        if (particleType === 0) {
          particle = scene.add.star(particleX, particleY, 6, 8, 6, rogueColors[Math.floor(Math.random() * rogueColors.length)], 0.8);
        } else if (particleType === 1) {
          particle = scene.add.circle(particleX, particleY, 4, rogueColors[Math.floor(Math.random() * rogueColors.length)], 0.9);
        } else if (particleType === 2) {
          particle = scene.add.star(particleX, particleY, 5, 5, 5, rogueColors[Math.floor(Math.random() * rogueColors.length)], 0.85);
          particle.setRotation(Math.random() * Math.PI * 2);
        } else {
          particle = scene.add.triangle(particleX, particleY, 0, 0, 7, 0, 3.5, 10, rogueColors[Math.floor(Math.random() * rogueColors.length)], 0.8);
        }

        particle.setDepth(108);

        scene.tweens.add({
          targets: particle,
          x: centerX + Math.cos(particleAngle) * (particleDistance * 2),
          y: centerY + Math.sin(particleAngle) * (particleDistance * 2),
          alpha: 0,
          scale: 0.3,
          duration: 800,
          ease: 'Power3',
          onComplete: () => particle.destroy()
        });
      }
    });

    // 범위 내 몬스터 대미지 (지연 적용)
    scene.time.delayedCall(350, () => {
      const monsters = scene.monsters.getChildren();
      const baseDamage = Math.floor(caster.stats.attack * this.damageMultiplier + this.damage);
      const comboMultiplier = caster.getComboMultiplier ? caster.getComboMultiplier() : 1.0;
      const totalDamage = Math.floor(baseDamage * comboMultiplier);

      monsters.forEach(monster => {
        const distance = Phaser.Math.Distance.Between(centerX, centerY, monster.x, monster.y);
        if (distance <= this.radius && !monster.isDead) {
          const result = monster.takeDamage(totalDamage, caster);
          scene.showDamageText(monster.x, monster.y - 30, result.damage, result.isCrit, result.isEvaded);

          // 콤ombo 증가
          if (!result.isEvaded && caster.increaseCombo) {
            caster.increaseCombo();
          }

          // 넉백 적용
          if (!result.isEvaded && this.knockbackPower > 0) {
            const knockbackSource = { x: centerX, y: centerY };
            monster.applyKnockback(this.knockbackPower, 300, knockbackSource);
          }

          // 피해 입은 몬스터에 고퀄리티 그림자 효과
          if (!result.isEvaded) {
            // 다중 그림자 효과
            for (let shadow = 0; shadow < 4; shadow++) {
              const shadowEffect = scene.add.circle(monster.x, monster.y, 20 + shadow * 10, rogueColors[4 + shadow], 0.8 - shadow * 0.15);
              shadowEffect.setDepth(98 + shadow);
              scene.tweens.add({
                targets: shadowEffect,
                scale: 3 + shadow * 0.5,
                alpha: 0,
                duration: 500 + shadow * 100,
                ease: 'Power2',
                onComplete: () => shadowEffect.destroy()
              });
            }

            // 빛 파티클 효과
            for (let light = 0; light < 12; light++) {
              const lightAngle = Math.random() * Math.PI * 2;
              const lightDistance = Math.random() * 30;
              const lightParticle = scene.add.circle(
                monster.x + Math.cos(lightAngle) * lightDistance,
                monster.y + Math.sin(lightAngle) * lightDistance,
                2, rogueColors[9], 0.95
              );
              lightParticle.setDepth(102);

              scene.tweens.add({
                targets: lightParticle,
                alpha: 0,
                scale: 0.4,
                duration: 600,
                onComplete: () => lightParticle.destroy()
              });
            }
          }
        }
      });

      // 그림자 필드와 링 사라짐
      scene.tweens.add({
        targets: [shadowField, shadowRing],
        alpha: 0,
        scale: 1.4,
        duration: 800,
        onComplete: () => {
          shadowField.destroy();
          shadowRing.destroy();
        }
      });
    });
  }

  executePhantomClone(scene, caster, centerX, centerY, rogueColors) {
    // 환영 분신: 초고퀄리티 분신 생성 및 AOE 피해
    const cloneCount = 6; // 분신 수 대폭 증가

    // 초기 환영 충격파 (더 화려하게)
    for (let i = 0; i < 4; i++) {
      const phantomWave = scene.add.circle(centerX, centerY, 30 + i * 20, rogueColors[5 + i % 3], 0.7 - i * 0.12);
      phantomWave.setDepth(45 - i);
      scene.tweens.add({
        targets: phantomWave,
        scale: 4 + i * 0.8,
        alpha: 0,
        duration: 600 + i * 200,
        ease: 'Power2',
        onComplete: () => phantomWave.destroy()
      });
    }

    // 초기 파티클 폭발
    for (let burst = 0; burst < 24; burst++) {
      const burstAngle = (burst / 24) * Math.PI * 2;
      const burstDistance = Math.random() * 50;
      const burstParticle = scene.add.polygon(
        centerX + Math.cos(burstAngle) * burstDistance,
        centerY + Math.sin(burstAngle) * burstDistance,
        [0, -8, 6, 4, -6, 4], rogueColors[Math.floor(Math.random() * rogueColors.length)], 0.9
      );
      burstParticle.setDepth(46);
      burstParticle.setRotation(Math.random() * Math.PI * 2);

      scene.tweens.add({
        targets: burstParticle,
        x: centerX + Math.cos(burstAngle) * (burstDistance * 2.5),
        y: centerY + Math.sin(burstAngle) * (burstDistance * 2.5),
        alpha: 0,
        scale: 0.3,
        rotation: burstParticle.rotation + Math.PI,
        duration: 800,
        ease: 'Power3',
        onComplete: () => burstParticle.destroy()
      });
    }

    // 환영 영역 표시 (더 화려하게)
    const phantomField = scene.add.circle(centerX, centerY, this.radius, rogueColors[4], 0.3);
    phantomField.setDepth(50);

    // 회전하는 환영 링 (다중 레이어)
    for (let ring = 0; ring < 3; ring++) {
      const phantomRing = scene.add.circle(centerX, centerY, this.radius + 15 + ring * 8, rogueColors[3 - ring], 0.2 - ring * 0.05);
      phantomRing.setDepth(49 - ring);
      scene.tweens.add({
        targets: phantomRing,
        rotation: Math.PI * 2 * (ring % 2 === 0 ? 1 : -1),
        duration: 3000 - ring * 500,
        repeat: -1,
        ease: 'Linear'
      });

      // 링에 부착된 파티클
      for (let p = 0; p < 8; p++) {
        const particleAngle = (p / 8) * Math.PI * 2;
        const particle = scene.add.star(
          centerX + Math.cos(particleAngle) * (this.radius + 15 + ring * 8),
          centerY + Math.sin(particleAngle) * (this.radius + 15 + ring * 8),
          3, 4, 2, rogueColors[6 + ring], 0.8
        );
        particle.setDepth(48 - ring);

        scene.tweens.add({
          targets: particle,
          rotation: particle.rotation + Math.PI * 4,
          alpha: 0.3,
          duration: 3000 - ring * 500,
          repeat: -1,
          ease: 'Linear'
        });
      }
    }

    // 분신 생성 및 효과 (더 화려하게)
    for (let i = 0; i < cloneCount; i++) {
      const angle = (i * 360 / cloneCount) * Math.PI / 180;
      const distance = 120; // 거리 증가
      const cloneX = centerX + Math.cos(angle) * distance;
      const cloneY = centerY + Math.sin(angle) * distance;

      // 분신 생성 이펙트 (다중 레이어)
      for (let appear = 0; appear < 3; appear++) {
        const cloneAppear = scene.add.circle(cloneX, cloneY, 20 + appear * 8, rogueColors[2 - appear], 0.8 - appear * 0.2);
        cloneAppear.setDepth(95 - appear);
        scene.tweens.add({
          targets: cloneAppear,
          scale: 2.5 + appear * 0.3,
          alpha: 0,
          duration: 400 + appear * 100,
          onComplete: () => cloneAppear.destroy()
        });
      }

      // 분신 생성 파티클
      for (let createP = 0; createP < 16; createP++) {
        const createAngle = Math.random() * Math.PI * 2;
        const createDistance = Math.random() * 40;
        const createParticle = scene.add.triangle(
          cloneX + Math.cos(createAngle) * createDistance,
          cloneY + Math.sin(createAngle) * createDistance,
          0, -6, 5, 3, -5, 3, rogueColors[Math.floor(Math.random() * 5)], 0.9
        );
        createParticle.setDepth(94);
        createParticle.setRotation(Math.random() * Math.PI * 2);

        scene.tweens.add({
          targets: createParticle,
          x: cloneX,
          y: cloneY,
          alpha: 0,
          scale: 0.2,
          duration: 500,
          ease: 'Power2',
          onComplete: () => createParticle.destroy()
        });
      }

      // 분신 본체 (더 화려하게)
      const clone = scene.add.circle(cloneX, cloneY, 22, rogueColors[1], 0.7);
      clone.setDepth(96);

      // 분신 주변 빛 효과
      const cloneGlow = scene.add.circle(cloneX, cloneY, 35, rogueColors[0], 0.3);
      cloneGlow.setDepth(95);
      scene.tweens.add({
        targets: cloneGlow,
        alpha: 0.1,
        scale: 1.5,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Power2'
      });

      // 분신에서 뻗어나가는 충격파 (초고퀄리티)
      scene.time.delayedCall(i * 200 + 300, () => {
        // 다중 충격파 (더 많이)
        for (let wave = 0; wave < 4; wave++) {
          scene.time.delayedCall(wave * 120, () => {
            const shockwave = scene.add.circle(cloneX, cloneY, 10 + wave * 8, rogueColors[3 + wave % 4], 0.85 - wave * 0.15);
            shockwave.setDepth(97 + wave);

            scene.tweens.add({
              targets: shockwave,
              scale: this.radius / (10 + wave * 8) * 1.2,
              alpha: 0,
              duration: 600 + wave * 120,
              ease: 'Power2',
              onComplete: () => shockwave.destroy()
            });
          });
        }

        // 분신 파괴 이펙트 (더 화려하게)
        scene.tweens.add({
          targets: clone,
          alpha: 0,
          scale: 0.2,
          duration: 500,
          onComplete: () => clone.destroy()
        });

        scene.tweens.add({
          targets: cloneGlow,
          alpha: 0,
          scale: 2,
          duration: 500,
          onComplete: () => cloneGlow.destroy()
        });

        // 분신 폭발 파티클 (대폭 증가)
        for (let p = 0; p < 20; p++) {
          const particleAngle = (p / 20) * Math.PI * 2;
          const particleDistance = Math.random() * 40;
          const particle = scene.add.star(
            cloneX + Math.cos(particleAngle) * particleDistance,
            cloneY + Math.sin(particleAngle) * particleDistance,
            5, 8, 5, rogueColors[Math.floor(Math.random() * rogueColors.length)], 0.9
          );
          particle.setDepth(98);
          particle.setRotation(Math.random() * Math.PI * 2);

          scene.tweens.add({
            targets: particle,
            x: cloneX + Math.cos(particleAngle) * (particleDistance * 3),
            y: cloneY + Math.sin(particleAngle) * (particleDistance * 3),
            alpha: 0,
            scale: 0.3,
            rotation: particle.rotation + Math.PI * 2,
            duration: 800,
            ease: 'Power3',
            onComplete: () => particle.destroy()
          });
        }

        // 추가 폭발 파티클
        for (let exp = 0; exp < 12; exp++) {
          const expAngle = Math.random() * Math.PI * 2;
          const expDistance = Math.random() * 60;
          const expParticle = scene.add.polygon(
            cloneX + Math.cos(expAngle) * expDistance,
            cloneY + Math.sin(expAngle) * expDistance,
            [0, -10, 8, 5, -8, 5], rogueColors[Math.floor(Math.random() * 3)], 0.8
          );
          expParticle.setDepth(99);
          expParticle.setRotation(Math.random() * Math.PI * 2);

          scene.tweens.add({
            targets: expParticle,
            alpha: 0,
            scale: 0.1,
            rotation: expParticle.rotation + Math.PI,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => expParticle.destroy()
          });
        }
      });
    }

    // 범위 내 모든 몬스터 대미지 (지연 적용)
    scene.time.delayedCall(800, () => {
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

          // 피해 입은 몬스터에 초고퀄리티 환영 효과
          if (!result.isEvaded) {
            // 다중 환영 효과 레이어
            for (let phantom = 0; phantom < 5; phantom++) {
              const phantomEffect = scene.add.circle(monster.x, monster.y, 25 + phantom * 12, rogueColors[4 + phantom % 3], 0.8 - phantom * 0.12);
              phantomEffect.setDepth(99 + phantom);
              scene.tweens.add({
                targets: phantomEffect,
                scale: 3.5 + phantom * 0.4,
                alpha: 0,
                duration: 700 + phantom * 150,
                ease: 'Power2',
                onComplete: () => phantomEffect.destroy()
              });
            }

            // 환영 파티클 폭발
            for (let burst = 0; burst < 20; burst++) {
              const burstAngle = Math.random() * Math.PI * 2;
              const burstDistance = Math.random() * 50;
              const burstParticle = scene.add.star(
                monster.x + Math.cos(burstAngle) * burstDistance,
                monster.y + Math.sin(burstAngle) * burstDistance,
                4, 6, 4, rogueColors[Math.floor(Math.random() * rogueColors.length)], 0.9
              );
              burstParticle.setDepth(104);
              burstParticle.setRotation(Math.random() * Math.PI * 2);

              scene.tweens.add({
                targets: burstParticle,
                x: monster.x + Math.cos(burstAngle) * (burstDistance * 2.5),
                y: monster.y + Math.sin(burstAngle) * (burstDistance * 2.5),
                alpha: 0,
                scale: 0.2,
                rotation: burstParticle.rotation + Math.PI * 3,
                duration: 900,
                ease: 'Power3',
                onComplete: () => burstParticle.destroy()
              });
            }

            // 빛 파티클 효과 (증가)
            for (let light = 0; light < 16; light++) {
              const lightAngle = Math.random() * Math.PI * 2;
              const lightDistance = Math.random() * 40;
              const lightParticle = scene.add.circle(
                monster.x + Math.cos(lightAngle) * lightDistance,
                monster.y + Math.sin(lightAngle) * lightDistance,
                3, rogueColors[9], 0.95
              );
              lightParticle.setDepth(105);

              scene.tweens.add({
                targets: lightParticle,
                alpha: 0,
                scale: 0.3,
                duration: 800,
                onComplete: () => lightParticle.destroy()
              });
            }

            // 추가 다각형 파티클
            for (let poly = 0; poly < 12; poly++) {
              const polyAngle = (poly / 12) * Math.PI * 2;
              const polyDistance = Math.random() * 60;
              const polyParticle = scene.add.polygon(
                monster.x + Math.cos(polyAngle) * polyDistance,
                monster.y + Math.sin(polyAngle) * polyDistance,
                [0, -8, 6, 4, -6, 4], rogueColors[Math.floor(Math.random() * 4)], 0.8
              );
              polyParticle.setDepth(106);
              polyParticle.setRotation(Math.random() * Math.PI * 2);

              scene.tweens.add({
                targets: polyParticle,
                alpha: 0,
                scale: 0.1,
                rotation: polyParticle.rotation + Math.PI,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => polyParticle.destroy()
              });
            }
          }
        }
      });

      // 모든 효과 사라짐 (더 화려하게)
      scene.tweens.add({
        targets: [phantomField],
        alpha: 0,
        scale: 1.5,
        duration: 1000,
        onComplete: () => {
          phantomField.destroy();
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
      // 도적 투사체 발사 (단검)
      const angle = Phaser.Math.Angle.Between(player.x, player.y, targetX, targetY);
      const distance = 350; // 사거리
      const dagger = player.scene.add.rectangle(player.x, player.y, 8, 2, 0x808080, 1);
      dagger.setRotation(angle);
      dagger.setDepth(50);

      player.scene.physics.add.existing(dagger);
      dagger.body.setVelocity(Math.cos(angle) * 600, Math.sin(angle) * 600);

      // 충돌 처리
      player.scene.physics.add.overlap(dagger, player.scene.monsters, (dag, monster) => {
        const damage = Math.floor(player.stats.attack * (skillData.damageMultiplier || 1.3));
        monster.takeDamage(damage, player);
        dag.destroy();
      });

      // 사거리 제한
      player.scene.time.delayedCall(distance / 600 * 1000, () => {
        if (dagger.active) dagger.destroy();
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
      // 도적 장벽 생성 (그림자 벽)
      const barrier = player.scene.add.rectangle(player.x, player.y - 20, 90, 6, 0x333333, 0.8);
      player.scene.physics.add.existing(barrier);
      barrier.body.setImmovable(true);

      // 일정 시간 후 제거
      player.scene.time.delayedCall(skillData.duration || 1800, () => {
        if (barrier.active) barrier.destroy();
      });
    }
  });
}