// FusionistSkills.js
// 융합술사 스킬 구현

import { Skill } from '../Skill.js';

export function createProjectileSkill(skillData, player) {
  return new Skill({
    ...skillData,
    execute: function(caster, targetX, targetY) {
      console.log('[FusionistSkills] createProjectileSkill execute called');
      
      // 융합 스킬 체크
      if (skillData.id.startsWith('fusion_')) {
        return executeFusionSkill(skillData.id, caster, { x: targetX, y: targetY });
      }
      
      const scene = caster.scene;
      const angle = Phaser.Math.Angle.Between(caster.x, caster.y, targetX, targetY);
      const distance = 500; // 사거리 증가
      const speed = 450;

      // 속성에 따른 색상과 효과
      const element = skillData.element || 'fire';
      let color, particleColor;
      switch (element) {
        case 'fire':
          color = 0xFF4444;
          particleColor = 0xFF6600;
          break;
        case 'ice':
          color = 0x4444FF;
          particleColor = 0x66CCFF;
          break;
        case 'lightning':
          color = 0xFFFF44;
          particleColor = 0xFFFFFF;
          break;
        default:
          color = 0x9B59B6;
          particleColor = 0x8E44AD;
      }

      // 투사체 생성
      const projectile = scene.add.circle(caster.x, caster.y, 8, color, 0.9);
      projectile.setDepth(50);
      scene.physics.add.existing(projectile);
      projectile.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

      // 파티클 트레일 (circle로 대체)
      const trailParticles = [];
      const trailInterval = scene.time.addEvent({
        delay: 50,
        callback: () => {
          const trail = scene.add.circle(projectile.x, projectile.y, 3, particleColor, 0.6);
          trail.setDepth(49);
          trailParticles.push(trail);
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

      // 발사 효과음 (없으면 생략)
      // scene.sound.play('projectile_launch');

      // 충돌 처리
      scene.physics.add.overlap(projectile, scene.monsters, (proj, monster) => {
        const damage = Math.floor(caster.stats.attack * skillData.damageMultiplier);
        monster.takeDamage(damage, caster);

        // 폭발 효과
        const explosion = scene.add.circle(proj.x, proj.y, 20, color, 0.7);
        explosion.setDepth(60);
        scene.tweens.add({
          targets: explosion,
          scale: 2,
          alpha: 0,
          duration: 200,
          onComplete: () => explosion.destroy()
        });

        // 파티클 제거
        trailInterval.remove();
        proj.destroy();
      });

      // 사거리 제한
      scene.time.delayedCall(distance / speed * 1000, () => {
        if (projectile.active) {
          trailInterval.remove();
          projectile.destroy();
        }
      });
    }
  });
}

export function createBarrierSkill(skillData, player) {
  return new Skill({
    ...skillData,
    execute: function(caster) {
      console.log('[FusionistSkills] createBarrierSkill execute called');
      
      // 융합 스킬 체크
      if (skillData.id.startsWith('fusion_')) {
        return executeFusionSkill(skillData.id, caster);
      }
      
      const scene = caster.scene;
      const duration = skillData.duration || 2000;

      // 마력 장벽 생성
      const barrier = scene.add.rectangle(caster.x, caster.y - 20, 120, 8, 0x9B59B6, 0.8);
      barrier.setStrokeStyle(2, 0x8E44AD);
      barrier.setDepth(40);
      scene.physics.add.existing(barrier);
      barrier.body.setImmovable(true);

      // 장벽 파티클 효과 (circle로 대체)
      const barrierParticles = [];
      const particleInterval = scene.time.addEvent({
        delay: 100,
        callback: () => {
          const px = barrier.x + (Math.random() - 0.5) * barrier.width;
          const py = barrier.y + (Math.random() - 0.5) * barrier.height;
          const particle = scene.add.circle(px, py, 2, 0x9B59B6, 0.8);
          particle.setDepth(41);
          barrierParticles.push(particle);
          scene.tweens.add({
            targets: particle,
            alpha: 0,
            y: py - 20,
            duration: 800,
            onComplete: () => particle.destroy()
          });
        },
        loop: true
      });

      // 장벽 주위 회전 파티클 (생략)

      // 지속 시간 동안 파티클 유지
      scene.time.delayedCall(duration, () => {
        particleInterval.remove();
        barrierParticles.forEach(p => p.destroy());
        barrier.destroy();
      });

      // 투사체 막기
      const projectiles = scene.physics.add.group();
      scene.physics.add.overlap(barrier, projectiles, (bar, proj) => {
        // 막는 효과
        const blockEffect = scene.add.circle(proj.x, proj.y, 15, 0xFFFFFF, 0.8);
        blockEffect.setDepth(60);
        scene.tweens.add({
          targets: blockEffect,
          scale: 1.5,
          alpha: 0,
          duration: 150,
          onComplete: () => blockEffect.destroy()
        });
        proj.destroy();
      });
    }
  });
}

export function createWaveSkill(skillData, player) {
  return new Skill({
    ...skillData,
    execute: function(caster) {
      console.log('[FusionistSkills] createWaveSkill execute called');
      
      // 융합 스킬 체크
      if (skillData.id.startsWith('fusion_')) {
        return executeFusionSkill(skillData.id, caster);
      }
      
      const scene = caster.scene;
      const centerX = caster.x;
      const centerY = caster.y;
      const radius = 120;
      const duration = 800;

      // 파동 생성
      const wave = scene.add.circle(centerX, centerY, radius, 0xFF44FF, 0.3);
      wave.setStrokeStyle(3, 0xE91E63);
      wave.setDepth(45);
      scene.physics.add.existing(wave);
      wave.body.setCircle(radius);

      // 파동 확장 애니메이션
      scene.tweens.add({
        targets: wave,
        scale: 1.5,
        alpha: 0,
        duration: duration,
        ease: 'Power2'
      });

      // 파동 파티클 효과 (circle로 대체)
      const waveParticles = [];
      const waveParticleInterval = scene.time.addEvent({
        delay: 50,
        callback: () => {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * radius;
          const px = centerX + Math.cos(angle) * dist;
          const py = centerY + Math.sin(angle) * dist;
          const particle = scene.add.circle(px, py, 4, 0xFF44FF, 0.7);
          particle.setDepth(46);
          waveParticles.push(particle);
          scene.tweens.add({
            targets: particle,
            alpha: 0,
            scale: 1.5,
            duration: 400,
            onComplete: () => particle.destroy()
          });
        },
        loop: true
      });

      // 중앙 폭발 효과
      const centerExplosion = scene.add.circle(centerX, centerY, 30, 0xFFFFFF, 0.9);
      centerExplosion.setDepth(50);
      scene.tweens.add({
        targets: centerExplosion,
        scale: 3,
        alpha: 0,
        duration: 400,
        onComplete: () => centerExplosion.destroy()
      });

      // 몬스터 피해 및 밀쳐내기
      scene.physics.add.overlap(wave, scene.monsters, (wv, monster) => {
        if (!monster.waveHit) { // 중복 피해 방지
          monster.waveHit = true;
          const damage = Math.floor(caster.stats.attack * skillData.damageMultiplier);
          monster.takeDamage(damage, caster);

          // 밀쳐내기
          const angle = Phaser.Math.Angle.Between(centerX, centerY, monster.x, monster.y);
          const knockbackDistance = 150;
          monster.body.setVelocity(Math.cos(angle) * knockbackDistance, Math.sin(angle) * knockbackDistance);
          monster.isKnockedBack = true;

          // 넉백 해제
          scene.time.delayedCall(600, () => {
            monster.isKnockedBack = false;
            monster.body.setVelocity(0);
            monster.waveHit = false;
          });

          // 몬스터별 파티클 효과
          const hitParticle = scene.add.circle(monster.x, monster.y, 6, 0xFF44FF, 0.9);
          hitParticle.setDepth(50);
          scene.tweens.add({
            targets: hitParticle,
            alpha: 0,
            scale: 2,
            duration: 300,
            onComplete: () => hitParticle.destroy()
          });
        }
      });

      // 파동 제거
      scene.time.delayedCall(duration, () => {
        waveParticleInterval.remove();
        waveParticles.forEach(p => p.destroy());
        wave.destroy();
      });
    }
  });
}

export function createUltimateSkill(skillData, player) {
  return new Skill({
    ...skillData,
    execute: function(caster) {
      console.log('[FusionistSkills] createUltimateSkill execute called');
      // 융합술사 궁극기 구현 (생략)
    }
  });
}

export function createPassiveSkill(skillData, player) {
  return new Skill({
    ...skillData,
    execute: function(caster) {
      console.log('[FusionistSkills] createPassiveSkill execute called');
      // 패시브 스킬 구현 (생략)
    }
  });
}

export class SystemSkill extends Skill {
  constructor(config) {
    super(config);
  }

  execute(caster) {
    // SystemSkill은 쿨타임을 적용하지 않음
    return false;
  }
}

// 융합 스킬 execute 메소드들
export function executeFusionSkill(skillId, caster, target) {
  const scene = caster.scene;
  
  switch (skillId) {
    case 'fusion_flare_dash':
      return executeFlareDash(scene, caster, target);
    case 'fusion_ice_pierce':
      return executeIcePierce(scene, caster, target);
    case 'fusion_magic_spin':
      return executeMagicSpin(scene, caster);
    case 'fusion_time_doom':
      return executeTimeDoom(scene, caster, target);
    case 'fusion_pierce_dash':
      return executePierceDash(scene, caster, target);
    case 'fusion_enhanced_barrier':
      return executeEnhancedBarrier(scene, caster);
    case 'fusion_poison_flame':
      return executePoisonFlame(scene, caster, target);
    case 'fusion_shadow_ice':
      return executeShadowIce(scene, caster, target);
    case 'fusion_time_clone':
      return executeTimeClone(scene, caster);
    case 'fusion_enhanced_arrow':
      return executeEnhancedArrow(scene, caster, target);
    default:
      // 기본 융합 스킬 실행 (간단한 AOE)
      return executeDefaultFusion(scene, caster);
  }
}

function executeFlareDash(scene, caster, target) {
  // 화염 돌격: 돌진하면서 화염 폭발
  const pointer = scene.input.activePointer;
  const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  const angle = Phaser.Math.Angle.Between(caster.x, caster.y, worldPoint.x, worldPoint.y);
  
  const dashDistance = 400;
  const targetX = caster.x + Math.cos(angle) * dashDistance;
  const targetY = caster.y + Math.sin(angle) * dashDistance;
  
  // 돌진 트윈
  scene.tweens.add({
    targets: caster,
    x: targetX,
    y: targetY,
    duration: 300,
    onUpdate: (tween) => {
      // 화염 트레일
      const trail = scene.add.circle(caster.x, caster.y, 15, 0xFF4500, 0.8);
      trail.setDepth(50);
      scene.tweens.add({
        targets: trail,
        alpha: 0,
        scale: 2,
        duration: 200,
        onComplete: () => trail.destroy()
      });
    },
    onComplete: () => {
      // 도착 시 폭발
      const explosion = scene.add.circle(targetX, targetY, 80, 0xFF0000, 0.6);
      explosion.setDepth(50);
      scene.tweens.add({
        targets: explosion,
        scale: 3,
        alpha: 0,
        duration: 400,
        onComplete: () => explosion.destroy()
      });
      
      // 폭발 범위 피해
      const monsters = scene.monsters.getChildren();
      monsters.forEach(monster => {
        const distance = Phaser.Math.Distance.Between(targetX, targetY, monster.x, monster.y);
        if (distance <= 80 && !monster.isDead) {
          const damage = Math.floor(caster.stats.attack * 2.0);
          monster.takeDamage(damage, caster);
        }
      });
    }
  });
}

function executeIcePierce(scene, caster, target) {
  // 만년설 송곳: 관통 화살 + 냉기
  const pointer = scene.input.activePointer;
  const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  const angle = Phaser.Math.Angle.Between(caster.x, caster.y, worldPoint.x, worldPoint.y);
  
  const arrow = scene.add.circle(caster.x, caster.y, 6, 0x4444FF, 0.9);
  arrow.setDepth(50);
  scene.physics.add.existing(arrow);
  arrow.body.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);
  
  // 관통 처리
  scene.physics.add.overlap(arrow, scene.monsters, (arr, monster) => {
    if (!monster.iceHit) {
      monster.iceHit = true;
      const damage = Math.floor(caster.stats.attack * 1.8);
      monster.takeDamage(damage, caster);
      
      // 냉기 효과
      const iceEffect = scene.add.circle(monster.x, monster.y, 20, 0x66CCFF, 0.7);
      iceEffect.setDepth(55);
      scene.tweens.add({
        targets: iceEffect,
        alpha: 0,
        scale: 2,
        duration: 300,
        onComplete: () => iceEffect.destroy()
      });
      
      // 일시적으로 느려짐
      monster.stats.speed *= 0.5;
      scene.time.delayedCall(3000, () => {
        monster.stats.speed *= 2;
        monster.iceHit = false;
      });
    }
  });
  
  // 사거리 제한
  scene.time.delayedCall(2000, () => {
    if (arrow.active) arrow.destroy();
  });
}

function executeMagicSpin(scene, caster) {
  // 마력 회전 베기
  const spinEffect = scene.add.circle(caster.x, caster.y, 100, 0x9B59B6, 0.4);
  spinEffect.setDepth(50);
  scene.tweens.add({
    targets: spinEffect,
    angle: 360,
    scale: 1.5,
    alpha: 0,
    duration: 600,
    onComplete: () => spinEffect.destroy()
  });
  
  // 회전 중 피해
  scene.time.delayedCall(200, () => {
    const monsters = scene.monsters.getChildren();
    monsters.forEach(monster => {
      const distance = Phaser.Math.Distance.Between(caster.x, caster.y, monster.x, monster.y);
      if (distance <= 100 && !monster.isDead) {
        const damage = Math.floor(caster.stats.attack * 1.5);
        monster.takeDamage(damage, caster);
      }
    });
  });
}

function executeTimeDoom(scene, caster, target) {
  // 시간 파멸: 강력한 충격파
  const pointer = scene.input.activePointer;
  const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  const angle = Phaser.Math.Angle.Between(caster.x, caster.y, worldPoint.x, worldPoint.y);
  
  const beamLength = 500;
  const beam = scene.add.rectangle(
    caster.x + Math.cos(angle) * (beamLength / 2),
    caster.y + Math.sin(angle) * (beamLength / 2),
    beamLength,
    60,
    0x8A2BE2,
    0.7
  );
  beam.setRotation(angle);
  beam.setDepth(50);
  
  scene.tweens.add({
    targets: beam,
    alpha: 0,
    scaleY: 1.5,
    duration: 800,
    onComplete: () => beam.destroy()
  });
  
  // 시간 왜곡 효과
  scene.time.delayedCall(200, () => {
    const monsters = scene.monsters.getChildren();
    monsters.forEach(monster => {
      const distance = Phaser.Math.Distance.Between(caster.x, caster.y, monster.x, monster.y);
      if (distance <= beamLength && !monster.isDead) {
        const damage = Math.floor(caster.stats.attack * 3.0);
        monster.takeDamage(damage, caster);
        // 시간 정지 효과 (일시적으로)
        monster.isStunned = true;
        scene.time.delayedCall(2000, () => {
          monster.isStunned = false;
        });
      }
    });
  });
}

function executePierceDash(scene, caster, target) {
  // 관통 돌진
  const pointer = scene.input.activePointer;
  const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  const angle = Phaser.Math.Angle.Between(caster.x, caster.y, worldPoint.x, worldPoint.y);
  
  const dashDistance = 350;
  const targetX = caster.x + Math.cos(angle) * dashDistance;
  const targetY = caster.y + Math.sin(angle) * dashDistance;
  
  scene.tweens.add({
    targets: caster,
    x: targetX,
    y: targetY,
    duration: 250,
    onUpdate: () => {
      // 관통 화살 발사
      const arrow = scene.add.circle(caster.x, caster.y, 4, 0xFFD700, 0.8);
      arrow.setDepth(50);
      scene.physics.add.existing(arrow);
      arrow.body.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
      
      scene.physics.add.overlap(arrow, scene.monsters, (arr, monster) => {
        const damage = Math.floor(caster.stats.attack * 1.2);
        monster.takeDamage(damage, caster);
        arr.destroy();
      });
      
      scene.time.delayedCall(1000, () => {
        if (arrow.active) arrow.destroy();
      });
    }
  });
}

function executeEnhancedBarrier(scene, caster) {
  // 강화 방벽
  const barrier = scene.add.rectangle(caster.x, caster.y - 20, 150, 10, 0xFFD700, 0.9);
  barrier.setDepth(50);
  scene.physics.add.existing(barrier);
  barrier.body.setImmovable(true);
  
  scene.time.delayedCall(4000, () => {
    barrier.destroy();
  });
}

function executePoisonFlame(scene, caster, target) {
  // 독성 화염
  const pointer = scene.input.activePointer;
  const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  
  const explosion = scene.add.circle(worldPoint.x, worldPoint.y, 70, 0xFF4500, 0.6);
  explosion.setDepth(50);
  scene.tweens.add({
    targets: explosion,
    scale: 2,
    alpha: 0,
    duration: 500,
    onComplete: () => explosion.destroy()
  });
  
  // 독성 피해
  scene.time.delayedCall(100, () => {
    const monsters = scene.monsters.getChildren();
    monsters.forEach(monster => {
      const distance = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, monster.x, monster.y);
      if (distance <= 70 && !monster.isDead) {
        const damage = Math.floor(caster.stats.attack * 1.6);
        monster.takeDamage(damage, caster);
        // 독 데미지 (시간 경과)
        let poisonTicks = 0;
        const poisonInterval = scene.time.addEvent({
          delay: 500,
          callback: () => {
            if (monster.isDead) {
              poisonInterval.remove();
              return;
            }
            monster.takeDamage(Math.floor(damage * 0.2), caster);
            poisonTicks++;
            if (poisonTicks >= 5) poisonInterval.remove();
          },
          loop: true
        });
      }
    });
  });
}

function executeShadowIce(scene, caster, target) {
  // 그림자 냉기
  const pointer = scene.input.activePointer;
  const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  
  // 그림자 이동
  scene.tweens.add({
    targets: caster,
    x: worldPoint.x,
    y: worldPoint.y,
    duration: 200,
    onComplete: () => {
      // 냉기 파동
      const wave = scene.add.circle(caster.x, caster.y, 80, 0x4444FF, 0.5);
      wave.setDepth(50);
      scene.tweens.add({
        targets: wave,
        scale: 2,
        alpha: 0,
        duration: 400,
        onComplete: () => wave.destroy()
      });
      
      const monsters = scene.monsters.getChildren();
      monsters.forEach(monster => {
        const distance = Phaser.Math.Distance.Between(caster.x, caster.y, monster.x, monster.y);
        if (distance <= 80 && !monster.isDead) {
          const damage = Math.floor(caster.stats.attack * 1.4);
          monster.takeDamage(damage, caster);
          monster.stats.speed *= 0.6;
          scene.time.delayedCall(2500, () => {
            monster.stats.speed /= 0.6;
          });
        }
      });
    }
  });
}

function executeTimeClone(scene, caster) {
  // 시간 분신
  for (let i = 0; i < 3; i++) {
    const angle = (i * 120) * (Math.PI / 180);
    const distance = 50;
    const cloneX = caster.x + Math.cos(angle) * distance;
    const cloneY = caster.y + Math.sin(angle) * distance;
    
    const clone = scene.add.circle(cloneX, cloneY, 15, 0x8A2BE2, 0.7);
    clone.setDepth(50);
    scene.tweens.add({
      targets: clone,
      alpha: 0,
      duration: 3000,
      onComplete: () => clone.destroy()
    });
  }
}

function executeEnhancedArrow(scene, caster, target) {
  // 속성 관통 화살
  const pointer = scene.input.activePointer;
  const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  const angle = Phaser.Math.Angle.Between(caster.x, caster.y, worldPoint.x, worldPoint.y);
  
  const arrow = scene.add.circle(caster.x, caster.y, 5, 0xFF6347, 0.9);
  arrow.setDepth(50);
  scene.physics.add.existing(arrow);
  arrow.body.setVelocity(Math.cos(angle) * 600, Math.sin(angle) * 600);
  
  scene.physics.add.overlap(arrow, scene.monsters, (arr, monster) => {
    const damage = Math.floor(caster.stats.attack * 2.0);
    monster.takeDamage(damage, caster);
    arr.destroy();
  });
  
  scene.time.delayedCall(1500, () => {
    if (arrow.active) arrow.destroy();
  });
}

function executeDefaultFusion(scene, caster) {
  // 기본 융합 스킬
  const effect = scene.add.circle(caster.x, caster.y, 60, 0x9B59B6, 0.5);
  effect.setDepth(50);
  scene.tweens.add({
    targets: effect,
    scale: 2,
    alpha: 0,
    duration: 500,
    onComplete: () => effect.destroy()
  });
  
  const monsters = scene.monsters.getChildren();
  monsters.forEach(monster => {
    const distance = Phaser.Math.Distance.Between(caster.x, caster.y, monster.x, monster.y);
    if (distance <= 60 && !monster.isDead) {
      const damage = Math.floor(caster.stats.attack * 1.5);
      monster.takeDamage(damage, caster);
    }
  });
}

// 융합 스킬을 위한 클래스들
export class RangedSkill extends Skill {
  execute(caster, target) {
    // 융합 스킬 체크
    if (this.id && this.id.startsWith('fusion_')) {
      return executeFusionSkill(this.id, caster, target);
    }
    // 기본 ranged 스킬 로직 (필요시 구현)
  }
}

export class AOESkill extends Skill {
  execute(caster, target) {
    // 융합 스킬 체크
    if (this.id && this.id.startsWith('fusion_')) {
      return executeFusionSkill(this.id, caster, target);
    }
    // 기본 aoe 스킬 로직 (필요시 구현)
  }
}

export class DashSkill extends Skill {
  execute(caster, target) {
    // 융합 스킬 체크
    if (this.id && this.id.startsWith('fusion_')) {
      return executeFusionSkill(this.id, caster, target);
    }
    // 기본 dash 스킬 로직 (필요시 구현)
  }
}

export class BuffSkill extends Skill {
  execute(caster, target) {
    // 융합 스킬 체크
    if (this.id && this.id.startsWith('fusion_')) {
      return executeFusionSkill(this.id, caster, target);
    }
    // 기본 buff 스킬 로직 (필요시 구현)
  }
}

export class MeleeSkill extends Skill {
  execute(caster, target) {
    // 융합 스킬 체크
    if (this.id && this.id.startsWith('fusion_')) {
      return executeFusionSkill(this.id, caster, target);
    }
    // 기본 melee 스킬 로직 (필요시 구현)
  }
}