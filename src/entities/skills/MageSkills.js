import Phaser from 'phaser';
import { Skill } from '../Skill.js';

/**
 * MageSkills - 마법사 스킬들
 * 마력탄, 화염 폭발, 냉기 파동, 시간 왜곡
 */

/**
 * RangedSkill - 원거리 스킬 (마력탄)
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
    return true;
  }

  createProjectile(scene, caster, angle) {
    const speed = 500;

    // 마력탄: 고퀄리티 마법 구체 형태로 더 화려하게
    const projectileColor = 0x4444FF;
    const secondaryColor = 0x6666FF;
    const tertiaryColor = 0xAAAAFF;

    // 메인 마력 구체
    const projectile = scene.add.circle(caster.x, caster.y, 14, projectileColor, 0.95);
    projectile.setDepth(100);

    // 다중 글로우 효과
    const projectileGlow1 = scene.add.circle(caster.x, caster.y, 18, secondaryColor, 0.5);
    projectileGlow1.setDepth(99);
    const projectileGlow2 = scene.add.circle(caster.x, caster.y, 22, tertiaryColor, 0.3);
    projectileGlow2.setDepth(98);

    // 마력탄 내부 코어 (빛나는 중심)
    const core = scene.add.circle(caster.x, caster.y, 6, tertiaryColor, 1);
    core.setDepth(101);

    scene.physics.add.existing(projectile);
    projectile.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    // 모든 요소가 함께 이동하도록 업데이트
    projectile.update = () => {
      projectileGlow1.setPosition(projectile.x, projectile.y);
      projectileGlow2.setPosition(projectile.x, projectile.y);
      core.setPosition(projectile.x, projectile.y);
    };

    // 코어 회전 애니메이션
    scene.tweens.add({
      targets: core,
      angle: 360,
      duration: 1000,
      repeat: -1,
      ease: 'Linear'
    });

    const totalDamage = Math.floor(caster.stats.magicAttack * this.damageMultiplier + this.damage);
    projectile.damage = totalDamage;
    projectile.owner = caster;
    projectile.isSkillProjectile = true;
    projectile.knockbackPower = this.knockbackPower;

    // 고퀄리티 마력탄 파티클 트레일
    const trailTimer = scene.time.addEvent({
      delay: 30,
      callback: () => {
        if (!projectile.active) return;

        // 메인 트레일 파티클
        const trail1 = scene.add.circle(projectile.x, projectile.y, 8, secondaryColor, 0.7);
        trail1.setDepth(97);
        const trail2 = scene.add.circle(projectile.x, projectile.y, 5, tertiaryColor, 0.8);
        trail2.setDepth(96);

        // 트레일 파티클 확산 애니메이션
        scene.tweens.add({
          targets: trail1,
          alpha: 0,
          scale: 2,
          duration: 400,
          ease: 'Power2',
          onComplete: () => trail1.destroy()
        });

        scene.tweens.add({
          targets: trail2,
          alpha: 0,
          scale: 1.5,
          duration: 300,
          ease: 'Power2',
          onComplete: () => trail2.destroy()
        });

        // 추가 스파크 파티클
        for (let i = 0; i < 3; i++) {
          const sparkAngle = Math.random() * Math.PI * 2;
          const sparkDistance = Math.random() * 6;
          const spark = scene.add.circle(
            projectile.x + Math.cos(sparkAngle) * sparkDistance,
            projectile.y + Math.sin(sparkAngle) * sparkDistance,
            2, tertiaryColor, 0.9
          );
          spark.setDepth(95);

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

    // 일정 거리 후 제거 - 화려한 사라짐 효과
    scene.time.delayedCall(this.range / speed * 1000, () => {
      if (projectile && projectile.active) {
        // 사라짐 시 빛 폭발 효과
        const burst = scene.add.circle(projectile.x, projectile.y, 10, tertiaryColor, 0.9);
        burst.setDepth(102);
        scene.tweens.add({
          targets: burst,
          scale: 3,
          alpha: 0,
          duration: 300,
          ease: 'Power2',
          onComplete: () => burst.destroy()
        });

        if (trailTimer) trailTimer.remove();
        if (projectileGlow1 && projectileGlow1.active) projectileGlow1.destroy();
        if (projectileGlow2 && projectileGlow2.active) projectileGlow2.destroy();
        if (core && core.active) core.destroy();
        projectile.destroy();
      }
    });

    return projectile;
  }
}

/**
 * AOESkill - 광역 스킬 (화염 폭발, 냉기 파동, 시간 왜곡)
 */
export class AOESkill extends Skill {
  execute(caster, target) {
    const scene = caster.scene;

    // 화염 폭발 스킬인 경우 (mage_skill_2)
    if (this.id === 'mage_skill_2') {
      this.executeFireBlast(scene, caster);
    } else if (this.id === 'mage_skill_3') {
      // 냉기 파동
      this.executeFrostWave(scene, caster);
    } else if (this.id === 'mage_skill_ultimate') {
      // 시간 왜곡
      this.executeTimeDistortion(scene, caster);
    } else {
      // 일반 AOE 스킬 (임시)
      this.executeGenericAOE(scene, caster);
    }
    return true;
  }

  executeFireBlast(scene, caster) {
    // 화염 폭발: 고퀄리티 마우스 위치에 화염 폭발
    const pointer = scene.input.activePointer;
    const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const centerX = worldPoint.x;
    const centerY = worldPoint.y;

    const fireColors = [0xFFFF00, 0xFF6600, 0xFF3300, 0xCC0000, 0x880000]; // 노랑 → 주황 → 빨강 계열

    // 초기 충격파
    const initialShockwave = scene.add.circle(centerX, centerY, 15, 0xFFFFFF, 0.8);
    initialShockwave.setDepth(95);
    scene.tweens.add({
      targets: initialShockwave,
      scale: 2,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => initialShockwave.destroy()
    });

    // 화염 폭발 이펙트 - 더 많은 단계와 화려하게
    const explosionStages = [
      { radius: 25, color: fireColors[0], alpha: 0.9, duration: 150, particleCount: 12 },
      { radius: 45, color: fireColors[1], alpha: 0.8, duration: 250, particleCount: 16 },
      { radius: 65, color: fireColors[2], alpha: 0.6, duration: 350, particleCount: 20 },
      { radius: 85, color: fireColors[3], alpha: 0.4, duration: 450, particleCount: 24 }
    ];

    explosionStages.forEach((stage, index) => {
      scene.time.delayedCall(index * 60, () => {
        // 메인 폭발 원
        const explosion = scene.add.circle(centerX, centerY, stage.radius, stage.color, stage.alpha);
        explosion.setDepth(100);

        // 폭발 테두리
        const explosionBorder = scene.add.circle(centerX, centerY, stage.radius + 5, fireColors[index + 1] || fireColors[4], stage.alpha * 0.5);
        explosionBorder.setDepth(99);

        // 고퀄리티 폭발 파티클 효과
        for (let i = 0; i < stage.particleCount; i++) {
          const angle = (i / stage.particleCount) * Math.PI * 2 + Math.random() * 0.5;
          const distance = stage.radius * (0.3 + Math.random() * 0.4);
          const particleSize = 4 + Math.random() * 6;

          // 메인 파티클
          const particle = scene.add.circle(
            centerX + Math.cos(angle) * distance,
            centerY + Math.sin(angle) * distance,
            particleSize, stage.color, 0.95
          );
          particle.setDepth(101);

          // 보조 파티클 (더 작고 밝게)
          const subParticle = scene.add.circle(
            centerX + Math.cos(angle) * (distance + 10),
            centerY + Math.sin(angle) * (distance + 10),
            particleSize * 0.6, fireColors[Math.min(index + 1, fireColors.length - 1)], 0.8
          );
          subParticle.setDepth(102);

          // 파티클 확산 애니메이션
          const targetDistance = stage.radius * (1.5 + Math.random() * 0.5);
          scene.tweens.add({
            targets: particle,
            x: centerX + Math.cos(angle) * targetDistance,
            y: centerY + Math.sin(angle) * targetDistance,
            alpha: 0,
            scale: 1.5,
            duration: stage.duration,
            ease: 'Power2',
            onComplete: () => particle.destroy()
          });

          scene.tweens.add({
            targets: subParticle,
            x: centerX + Math.cos(angle) * (targetDistance + 20),
            y: centerY + Math.sin(angle) * (targetDistance + 20),
            alpha: 0,
            scale: 2,
            duration: stage.duration + 100,
            ease: 'Power2',
            onComplete: () => subParticle.destroy()
          });
        }

        // 불꽃 잔상 효과
        for (let i = 0; i < 8; i++) {
          scene.time.delayedCall(i * 30, () => {
            const flameAngle = Math.random() * Math.PI * 2;
            const flameDistance = Math.random() * stage.radius;
            const flame = scene.add.rectangle(
              centerX + Math.cos(flameAngle) * flameDistance,
              centerY + Math.sin(flameAngle) * flameDistance,
              6, 20 + Math.random() * 10, stage.color, 0.7
            );
            flame.setRotation(flameAngle);
            flame.setDepth(103);

            scene.tweens.add({
              targets: flame,
              alpha: 0,
              scaleY: 0.3,
              duration: 300,
              onComplete: () => flame.destroy()
            });
          });
        }

        // 폭발 사라짐 애니메이션
        scene.tweens.add({
          targets: explosion,
          scale: 1.4,
          alpha: 0,
          duration: stage.duration,
          ease: 'Power2',
          onComplete: () => explosion.destroy()
        });

        scene.tweens.add({
          targets: explosionBorder,
          scale: 1.5,
          alpha: 0,
          duration: stage.duration + 50,
          ease: 'Power2',
          onComplete: () => explosionBorder.destroy()
        });
      });
    });

    // 피해 적용 (마지막 폭발 단계 후)
    scene.time.delayedCall(300, () => {
      const monsters = scene.monsters.getChildren();
      const baseDamage = Math.floor(caster.stats.magicAttack * this.damageMultiplier + this.damage);
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
    return true;
  }

  executeFrostWave(scene, caster) {
    // 냉기 파동: 고퀄리티 부채꼴 범위로 냉기 파동
    const centerX = caster.x;
    const centerY = caster.y;

    const pointer = scene.input.activePointer;
    const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const castAngle = Phaser.Math.Angle.Between(centerX, centerY, worldPoint.x, worldPoint.y);

    const iceColors = [0xE0F7FF, 0xB3E5FC, 0x81D4FA, 0x4FC3F7, 0x00CCFF]; // 밝은 청색 계열

    // 초기 냉기 충격파
    const initialWave = scene.add.circle(centerX, centerY, 20, 0xFFFFFF, 0.6);
    initialWave.setDepth(95);
    scene.tweens.add({
      targets: initialWave,
      scale: 1.5,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => initialWave.destroy()
    });

    // 냉기 파동 이펙트 - 더 많은 세그먼트와 화려하게
    const waveSegments = 20; // 더 많은 세그먼트
    const waveAngle = this.angle || 120; // 부채꼴 각도
    const segmentAngle = (waveAngle / waveSegments) * (Math.PI / 180);

    for (let i = 0; i < waveSegments; i++) {
      const angle = castAngle - (waveAngle / 2) * (Math.PI / 180) + i * segmentAngle;
      const endX = centerX + Math.cos(angle) * this.radius;
      const endY = centerY + Math.sin(angle) * this.radius;

      // 메인 냉기 파동 선
      const waveLine = scene.add.rectangle(
        centerX + Math.cos(angle) * (this.radius / 2),
        centerY + Math.sin(angle) * (this.radius / 2),
        this.radius, 8, iceColors[0], 0.8
      );
      waveLine.setRotation(angle);
      waveLine.setDepth(100);

      // 파동 테두리
      const waveBorder = scene.add.rectangle(
        centerX + Math.cos(angle) * (this.radius / 2),
        centerY + Math.sin(angle) * (this.radius / 2),
        this.radius + 4, 12, iceColors[1], 0.4
      );
      waveBorder.setRotation(angle);
      waveBorder.setDepth(99);

      // 고퀄리티 얼음 파티클
      const particleCount = 8; // 더 많은 파티클
      for (let j = 0; j < particleCount; j++) {
        const particleX = centerX + Math.cos(angle) * (this.radius * j / particleCount);
        const particleY = centerY + Math.sin(angle) * (this.radius * j / particleCount);
        const particleSize = 3 + Math.random() * 4;

        // 메인 얼음 파티클
        const particle = scene.add.circle(particleX, particleY, particleSize, iceColors[2], 0.95);
        particle.setDepth(101);

        // 보조 얼음 파티클 (크리스탈 모양)
        const crystalParticle = scene.add.star(particleX + Math.random() * 6 - 3, particleY + Math.random() * 6 - 3, 4, 6, 3, iceColors[3], 0.8);
        crystalParticle.setDepth(102);

        // 파티클 애니메이션
        scene.tweens.add({
          targets: particle,
          alpha: 0,
          scale: 1.5,
          duration: 800,
          ease: 'Power2',
          onComplete: () => particle.destroy()
        });

        scene.tweens.add({
          targets: crystalParticle,
          alpha: 0,
          scale: 2,
          angle: 180,
          duration: 900,
          ease: 'Power2',
          onComplete: () => crystalParticle.destroy()
        });
      }

      // 얼음 잔상 효과
      for (let k = 0; k < 3; k++) {
        const trailX = centerX + Math.cos(angle) * (this.radius * k / 3);
        const trailY = centerY + Math.sin(angle) * (this.radius * k / 3);
        const iceTrail = scene.add.circle(trailX, trailY, 6, iceColors[4], 0.6);
        iceTrail.setDepth(103);

        scene.tweens.add({
          targets: iceTrail,
          alpha: 0,
          scale: 0.5,
          duration: 600,
          delay: k * 100,
          onComplete: () => iceTrail.destroy()
        });
      }

      // 파동 사라짐 애니메이션
      scene.tweens.add({
        targets: waveLine,
        alpha: 0,
        scaleX: 1.2,
        duration: 800,
        ease: 'Power2',
        onComplete: () => waveLine.destroy()
      });

      scene.tweens.add({
        targets: waveBorder,
        alpha: 0,
        scaleX: 1.3,
        duration: 850,
        ease: 'Power2',
        onComplete: () => waveBorder.destroy()
      });
    }

    // 중앙 냉기 코어 효과
    const frostCore = scene.add.circle(centerX, centerY, 15, iceColors[0], 0.7);
    frostCore.setDepth(104);
    scene.tweens.add({
      targets: frostCore,
      scale: 2,
      alpha: 0,
      angle: 360,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => frostCore.destroy()
    });

    // 피해 적용
    const monsters = scene.monsters.getChildren();
    const baseDamage = Math.floor(caster.stats.magicAttack * this.damageMultiplier + this.damage);
    const comboMultiplier = caster.getComboMultiplier ? caster.getComboMultiplier() : 1.0;
    const totalDamage = Math.floor(baseDamage * comboMultiplier);

    monsters.forEach(monster => {
      const distance = Phaser.Math.Distance.Between(centerX, centerY, monster.x, monster.y);
      const monsterAngle = Phaser.Math.Angle.Between(centerX, centerY, monster.x, monster.y);
      const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(monsterAngle - castAngle));

      // 부채꼴 범위 체크
      const inRange = distance <= this.radius && angleDiff <= (waveAngle / 2) * (Math.PI / 180);

      if (inRange && !monster.isDead) {
        const result = monster.takeDamage(totalDamage, caster);
        scene.showDamageText(monster.x, monster.y - 30, result.damage, result.isCrit, result.isEvaded);

        // 콤보 증가
        if (!result.isEvaded && caster.increaseCombo) {
          caster.increaseCombo();
        }

        // 둔화 효과 적용
        if (!result.isEvaded && this.slowDuration && this.slowAmount) {
          monster.applySlow(this.slowAmount * 100, this.slowDuration);
        }
      }
    });
    return true;
  }

  executeTimeDistortion(scene, caster) {
    // 시간 왜곡: 고퀄리티 시간 정지 효과
    const centerX = caster.x;
    const centerY = caster.y;

    const timeColors = [0xE6E6FA, 0xDDA0DD, 0xBA55D3, 0x9932CC, 0x8A2BE2, 0x9370DB, 0x8B008B]; // 보라색 계열 확장

    // 초기 시간 왜곡 충격파 - 다중 레이어
    for (let i = 0; i < 3; i++) {
      const shockwave = scene.add.circle(centerX, centerY, 15 + i * 8, 0xFFFFFF, 0.8 - i * 0.2);
      shockwave.setDepth(45 - i);
      scene.tweens.add({
        targets: shockwave,
        scale: 2 + i * 0.5,
        alpha: 0,
        duration: 400 + i * 100,
        ease: 'Power2',
        onComplete: () => shockwave.destroy()
      });
    }

    // 메인 시간 정지 영역 표시 - 다중 레이어
    const timeField = scene.add.circle(centerX, centerY, this.radius, timeColors[0], 0.3);
    timeField.setDepth(50);

    const timeFieldBorder1 = scene.add.circle(centerX, centerY, this.radius + 3, timeColors[1], 0.2);
    timeFieldBorder1.setDepth(49);

    const timeFieldBorder2 = scene.add.circle(centerX, centerY, this.radius + 6, timeColors[2], 0.1);
    timeFieldBorder2.setDepth(48);

    // 빛나는 시간 필드 테두리
    const glowBorder = scene.add.circle(centerX, centerY, this.radius + 10, timeColors[3], 0.05);
    glowBorder.setDepth(47);

    // 시간 왜곡 파티클 효과 - 고퀄리티 확장 (파티클 수 감소 및 분산 개선)
    const particleCount = 24; // 파티클 수 감소 (40 -> 24)
    const particles = [];
    const stars = [];
    const crystals = [];
    const hourglasses = []; // 모래시계 파티클 추가
    const ripples = []; // 리플 효과 추가

    for (let i = 0; i < particleCount; i++) {
      // 더 랜덤한 각도 분산으로 몰림 현상 완화
      const angle = Math.random() * Math.PI * 2; // 랜덤 각도 사용
      const minDistance = this.radius * 0.3; // 최소 거리 설정으로 중심 몰림 방지
      const maxDistance = this.radius * 0.9; // 최대 거리 제한
      const distance = minDistance + Math.random() * (maxDistance - minDistance);
      const particleSize = 3 + Math.random() * 3;

      // 메인 시간 파티클
      const particle = scene.add.circle(
        centerX + Math.cos(angle) * distance,
        centerY + Math.sin(angle) * distance,
        particleSize, timeColors[3], 0.9
      );
      particle.setDepth(101);
      particles.push(particle);

      // 시간 왜곡 스타 파티클 - 더 넓게 분산
      const starAngle = angle + (Math.random() - 0.5) * Math.PI * 0.5; // ±90도 랜덤 오프셋
      const starDistance = distance * (0.4 + Math.random() * 0.4); // 40-80% 거리
      const starParticle = scene.add.star(
        centerX + Math.cos(starAngle) * starDistance,
        centerY + Math.sin(starAngle) * starDistance,
        5, 8, 4, timeColors[4], 0.7
      );
      starParticle.setDepth(102);
      stars.push(starParticle);

      // 크리스탈 파티클 (시간 결정체) - 더 고르게 분산
      const crystalAngle = angle + Math.PI + (Math.random() - 0.5) * Math.PI * 0.3; // 반대쪽 ±54도
      const crystalDistance = distance * (0.6 + Math.random() * 0.3); // 60-90% 거리
      const crystalParticle = scene.add.polygon(
        centerX + Math.cos(crystalAngle) * crystalDistance,
        centerY + Math.sin(crystalAngle) * crystalDistance,
        [0, -8, 6, 4, -6, 4], timeColors[2], 0.8
      );
      crystalParticle.setDepth(103);
      crystals.push(crystalParticle);

      // 모래시계 파티클 (시간의 흐름 상징) - 가장 바깥쪽에 배치
      const hourglassAngle = angle + Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.4; // 90도 방향 ±72도
      const hourglassDistance = distance * (0.8 + Math.random() * 0.2); // 80-100% 거리
      const hourglassParticle = scene.add.polygon(
        centerX + Math.cos(hourglassAngle) * hourglassDistance,
        centerY + Math.sin(hourglassAngle) * hourglassDistance,
        [0, -6, 4, -2, 4, 2, 0, 6, -4, 2, -4, -2], timeColors[5], 0.6
      );
      hourglassParticle.setDepth(104);
      hourglasses.push(hourglassParticle);

      // 리플 효과 파티클 - 가장 넓게 분산
      const rippleAngle = angle + Math.PI / 4 + (Math.random() - 0.5) * Math.PI * 0.6; // 45도 방향 ±108도
      const rippleDistance = distance * (0.9 + Math.random() * 0.1); // 90-100% 거리
      const rippleParticle = scene.add.circle(
        centerX + Math.cos(rippleAngle) * rippleDistance,
        centerY + Math.sin(rippleAngle) * rippleDistance,
        1, timeColors[6], 0.4
      );
      rippleParticle.setDepth(100);
      ripples.push(rippleParticle);

      // 복합 회전 애니메이션 (시간 왜곡 느낌) - 더 복잡하게
      scene.tweens.add({
        targets: particle,
        angle: 720 + Math.random() * 360, // 랜덤 회전
        duration: 3000 + Math.random() * 2000,
        repeat: -1,
        ease: 'Linear'
      });

      scene.tweens.add({
        targets: starParticle,
        angle: -720 - Math.random() * 360,
        scale: 1.2 + Math.random() * 0.3,
        duration: 4000 + Math.random() * 2000,
        repeat: -1,
        ease: 'Linear'
      });

      scene.tweens.add({
        targets: crystalParticle,
        angle: 1080 + Math.random() * 720,
        scale: 1.5 + Math.random() * 0.5,
        duration: 5000 + Math.random() * 3000,
        repeat: -1,
        ease: 'Linear'
      });

      // 모래시계 회전
      scene.tweens.add({
        targets: hourglassParticle,
        angle: 360 + Math.random() * 720,
        scale: 0.8 + Math.random() * 0.4,
        duration: 6000 + Math.random() * 2000,
        repeat: -1,
        ease: 'Power2'
      });

      // 리플 확장
      scene.tweens.add({
        targets: rippleParticle,
        scale: 3 + Math.random() * 2,
        alpha: 0,
        duration: 2000 + Math.random() * 1000,
        repeat: -1,
        ease: 'Power3'
      });
    }

    // 시간 왜곡 빛줄기 효과
    const lightRays = [];
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const rayLength = this.radius * 0.8;
      const ray = scene.add.rectangle(
        centerX + Math.cos(angle) * (rayLength / 2),
        centerY + Math.sin(angle) * (rayLength / 2),
        4, rayLength, timeColors[4], 0.2
      );
      ray.setRotation(angle);
      ray.setDepth(46);
      lightRays.push(ray);

      // 빛줄기 펄스 애니메이션
      scene.tweens.add({
        targets: ray,
        alpha: 0.4,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Power2'
      });
    }

    // 중앙 시간 코어 (시계 모양)
    const timeCore = scene.add.circle(centerX, centerY, 12, timeColors[0], 0.8);
    timeCore.setDepth(104);

    // 시간 코어 내부 시계 바늘 효과
    const hourHand = scene.add.rectangle(centerX, centerY, 2, 8, timeColors[4], 1);
    hourHand.setDepth(105);
    const minuteHand = scene.add.rectangle(centerX, centerY, 1, 10, timeColors[3], 1);
    minuteHand.setDepth(106);

    // 시계 바늘 회전 애니메이션
    scene.tweens.add({
      targets: hourHand,
      angle: 360,
      duration: 12000, // 느린 회전으로 시간 왜곡 느낌
      repeat: -1,
      ease: 'Linear'
    });

    scene.tweens.add({
      targets: minuteHand,
      angle: -720,
      duration: 6000,
      repeat: -1,
      ease: 'Linear'
    });

    // 시간 정지 효과 (기절)
    const monsters = scene.monsters.getChildren();
    monsters.forEach(monster => {
      const distance = Phaser.Math.Distance.Between(centerX, centerY, monster.x, monster.y);
      if (distance <= this.radius && !monster.isDead) {
        monster.applyStun(this.stunDuration || 5000);
      }
    });

    // 시간 왜곡 해제 후 피해
    scene.time.delayedCall(this.stunDuration || 5000, () => {
      // 다중 최종 시간 폭발 효과
      for (let i = 0; i < 5; i++) {
        const finalBurst = scene.add.circle(centerX, centerY, 25 + i * 10, timeColors[4 - i] || timeColors[0], 0.9 - i * 0.1);
        finalBurst.setDepth(107 + i);
        scene.tweens.add({
          targets: finalBurst,
          scale: 3 + i * 0.5,
          alpha: 0,
          angle: 360 + i * 72,
          duration: 600 + i * 100,
          ease: 'Power2',
          onComplete: () => finalBurst.destroy()
        });
      }

      // 시간 폭발 파티클 효과
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const distance = 30 + Math.random() * 40;
        const explosionParticle = scene.add.star(
          centerX + Math.cos(angle) * distance,
          centerY + Math.sin(angle) * distance,
          6, 12, 6, timeColors[Math.floor(Math.random() * timeColors.length)], 0.8
        );
        explosionParticle.setDepth(120);
        scene.tweens.add({
          targets: explosionParticle,
          x: centerX + Math.cos(angle) * (distance * 2),
          y: centerY + Math.sin(angle) * (distance * 2),
          alpha: 0,
          scale: 0.5,
          duration: 800,
          ease: 'Power3',
          onComplete: () => explosionParticle.destroy()
        });
      }

      // 시간 왜곡 충격파 해제
      const releaseShockwave = scene.add.circle(centerX, centerY, this.radius, 0xFFFFFF, 0.6);
      releaseShockwave.setDepth(130);
      scene.tweens.add({
        targets: releaseShockwave,
        scale: 1.5,
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => releaseShockwave.destroy()
      });

      // 모든 요소들 사라짐 애니메이션 - 확장
      const allElements = [
        timeField, timeFieldBorder1, timeFieldBorder2, glowBorder, timeCore, hourHand, minuteHand,
        ...particles, ...stars, ...crystals, ...hourglasses, ...ripples, ...lightRays
      ];

      allElements.forEach((element, index) => {
        if (element && element.active) {
          scene.tweens.add({
            targets: element,
            alpha: 0,
            scale: 1.2 + Math.random() * 0.3,
            angle: element.angle + 180 + Math.random() * 180,
            duration: 800 + Math.random() * 400,
            delay: Math.random() * 300,
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
            duration: 600,
            ease: 'Power2',
            onComplete: () => particle.destroy()
          });
        }
      });

      stars.forEach(star => {
        if (star.active) {
          scene.tweens.add({
            targets: star,
            alpha: 0,
            scale: 0.3,
            duration: 700,
            ease: 'Power2',
            onComplete: () => star.destroy()
          });
        }
      });

      crystals.forEach(crystal => {
        if (crystal.active) {
          scene.tweens.add({
            targets: crystal,
            alpha: 0,
            scale: 0.2,
            duration: 800,
            ease: 'Power2',
            onComplete: () => crystal.destroy()
          });
        }
      });

      lightRays.forEach(ray => {
        if (ray.active) {
          scene.tweens.add({
            targets: ray,
            alpha: 0,
            scaleY: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => ray.destroy()
          });
        }
      });

      // 해제 시 피해 적용
      const baseDamage = Math.floor(caster.stats.magicAttack * this.damageMultiplier + this.damage);
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
        }
      });
    });
    return true;
  }

  executeGenericAOE(scene, caster) {
    // 일반 AOE 스킬 (기존 로직)
    const centerX = caster.x;
    const centerY = caster.y;

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
    const baseDamage = Math.floor(caster.stats.magicAttack * this.damageMultiplier + this.damage);
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
    return true;
  }
}

/**
 * 투사체 스킬 생성 함수
 */
export function createProjectileSkill(skillData, player) {
  return new Skill({
    ...skillData,
    execute: (targetX, targetY) => {
      // 마법사 투사체 발사
      const angle = Phaser.Math.Angle.Between(player.x, player.y, targetX, targetY);
      const distance = 500; // 사거리
      const projectile = player.scene.add.circle(player.x, player.y, 6, 0x4444FF, 0.9);
      projectile.setDepth(50);

      player.scene.physics.add.existing(projectile);
      projectile.body.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);

      // 충돌 처리
      player.scene.physics.add.overlap(projectile, player.scene.monsters, (proj, monster) => {
        const damage = Math.floor(player.stats.attack * (skillData.damageMultiplier || 1.2));
        monster.takeDamage(damage, player);
        proj.destroy();
      });

      // 사거리 제한
      player.scene.time.delayedCall(distance / 400 * 1000, () => {
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
      // 마법사 장벽 생성
      const barrier = player.scene.add.rectangle(player.x, player.y - 20, 100, 5, 0x4444FF, 0.7);
      player.scene.physics.add.existing(barrier);
      barrier.body.setImmovable(true);

      // 일정 시간 후 제거
      player.scene.time.delayedCall(skillData.duration || 2000, () => {
        if (barrier.active) barrier.destroy();
      });
    }
  });
}