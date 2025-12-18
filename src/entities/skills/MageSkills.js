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
  }

  createProjectile(scene, caster, angle) {
    const speed = 500;

    // 마력탄: 마법 구체 형태로 더 화려하게
    const projectile = scene.add.circle(caster.x, caster.y, 12, 0x4444FF, 0.9);
    projectile.setDepth(100);

    // 마력탄 테두리 효과
    const projectileGlow = scene.add.circle(caster.x, caster.y, 16, 0x6666FF, 0.4);
    projectileGlow.setDepth(99);

    scene.physics.add.existing(projectile);
    projectile.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    // 글로우 효과도 함께 이동
    projectile.update = () => {
      projectileGlow.setPosition(projectile.x, projectile.y);
    };

    const totalDamage = Math.floor(caster.stats.attack * this.damageMultiplier + this.damage);
    projectile.damage = totalDamage;
    projectile.owner = caster;
    projectile.isSkillProjectile = true;
    projectile.knockbackPower = this.knockbackPower;

    // 마력탄 파티클 트레일
    const trailTimer = scene.time.addEvent({
      delay: 50,
      callback: () => {
        if (!projectile.active) return;

        const trail = scene.add.circle(projectile.x, projectile.y, 6, 0x8888FF, 0.6);
        trail.setDepth(98);
        scene.tweens.add({
          targets: trail,
          alpha: 0,
          scale: 0.5,
          duration: 300,
          onComplete: () => trail.destroy()
        });
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

    // 일정 거리 후 제거
    scene.time.delayedCall(this.range / speed * 1000, () => {
      if (projectile && projectile.active) {
        if (trailTimer) trailTimer.remove();
        if (projectileGlow && projectileGlow.active) projectileGlow.destroy();
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
  }

  executeFireBlast(scene, caster) {
    // 화염 폭발: 마우스 위치에 화염 폭발
    const pointer = scene.input.activePointer;
    const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const centerX = worldPoint.x;
    const centerY = worldPoint.y;

    // 화염 폭발 이펙트 - 여러 단계로 폭발
    const explosionStages = [
      { radius: 20, color: 0xFF6600, alpha: 0.8, duration: 100 },
      { radius: 35, color: 0xFF3300, alpha: 0.6, duration: 200 },
      { radius: 50, color: 0xCC0000, alpha: 0.4, duration: 300 }
    ];

    explosionStages.forEach((stage, index) => {
      scene.time.delayedCall(index * 50, () => {
        const explosion = scene.add.circle(centerX, centerY, stage.radius, stage.color, stage.alpha);
        explosion.setDepth(100);

        // 폭발 파티클 효과
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const particle = scene.add.circle(
            centerX + Math.cos(angle) * stage.radius * 0.5,
            centerY + Math.sin(angle) * stage.radius * 0.5,
            3, stage.color, 0.9
          );
          particle.setDepth(101);

          scene.tweens.add({
            targets: particle,
            x: centerX + Math.cos(angle) * stage.radius * 1.5,
            y: centerY + Math.sin(angle) * stage.radius * 1.5,
            alpha: 0,
            duration: stage.duration,
            onComplete: () => particle.destroy()
          });
        }

        scene.tweens.add({
          targets: explosion,
          scale: 1.3,
          alpha: 0,
          duration: stage.duration,
          onComplete: () => explosion.destroy()
        });
      });
    });

    // 피해 적용 (마지막 폭발 단계 후)
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

  executeFrostWave(scene, caster) {
    // 냉기 파동: 부채꼴 범위로 냉기 파동
    const centerX = caster.x;
    const centerY = caster.y;

    const pointer = scene.input.activePointer;
    const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const castAngle = Phaser.Math.Angle.Between(centerX, centerY, worldPoint.x, worldPoint.y);

    // 냉기 파동 이펙트 - 부채꼴 모양
    const waveSegments = 12;
    const waveAngle = this.angle || 120; // 부채꼴 각도
    const segmentAngle = (waveAngle / waveSegments) * (Math.PI / 180);

    for (let i = 0; i < waveSegments; i++) {
      const angle = castAngle - (waveAngle / 2) * (Math.PI / 180) + i * segmentAngle;
      const endX = centerX + Math.cos(angle) * this.radius;
      const endY = centerY + Math.sin(angle) * this.radius;

      // 냉기 파동 선
      const waveLine = scene.add.rectangle(
        centerX + Math.cos(angle) * (this.radius / 2),
        centerY + Math.sin(angle) * (this.radius / 2),
        this.radius, 6, 0x00CCFF, 0.7
      );
      waveLine.setRotation(angle);
      waveLine.setDepth(100);

      // 얼음 파티클
      for (let j = 0; j < 5; j++) {
        const particleX = centerX + Math.cos(angle) * (this.radius * j / 5);
        const particleY = centerY + Math.sin(angle) * (this.radius * j / 5);

        const particle = scene.add.circle(particleX, particleY, 2, 0x88DDFF, 0.9);
        particle.setDepth(101);

        scene.tweens.add({
          targets: particle,
          alpha: 0,
          duration: 600,
          onComplete: () => particle.destroy()
        });
      }

      scene.tweens.add({
        targets: waveLine,
        alpha: 0,
        duration: 600,
        onComplete: () => waveLine.destroy()
      });
    }

    // 피해 적용
    const monsters = scene.monsters.getChildren();
    const baseDamage = Math.floor(caster.stats.attack * this.damageMultiplier + this.damage);
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
  }

  executeTimeDistortion(scene, caster) {
    // 시간 왜곡: 시간 정지 효과
    const centerX = caster.x;
    const centerY = caster.y;

    // 시간 정지 영역 표시
    const timeField = scene.add.circle(centerX, centerY, this.radius, 0x9900FF, 0.2);
    timeField.setDepth(50);

    // 시간 왜곡 파티클 효과
    const particleCount = 20;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = Math.random() * this.radius;
      const particle = scene.add.circle(
        centerX + Math.cos(angle) * distance,
        centerY + Math.sin(angle) * distance,
        3, 0xCC66FF, 0.8
      );
      particle.setDepth(101);
      particles.push(particle);

      // 회전하는 파티클 애니메이션
      scene.tweens.add({
        targets: particle,
        angle: 360,
        duration: 2000,
        repeat: -1
      });
    }

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
      // 파티클 제거
      particles.forEach(particle => {
        scene.tweens.add({
          targets: particle,
          alpha: 0,
          duration: 500,
          onComplete: () => particle.destroy()
        });
      });

      scene.tweens.add({
        targets: timeField,
        alpha: 0,
        duration: 1000,
        onComplete: () => timeField.destroy()
      });

      // 해제 시 피해 적용
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
        }
      });
    });
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