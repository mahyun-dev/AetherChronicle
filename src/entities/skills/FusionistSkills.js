// FusionistSkills.js
// 융합술사 스킬 구현

import { Skill } from '../Skill.js';

export function createProjectileSkill(skillData, player) {
  return new Skill({
    ...skillData,
    execute: function(caster, target) {
      console.log('[FusionistSkills] createProjectileSkill execute called');
      
      // 융합 스킬 체크
      if (skillData.id.startsWith('fusion_')) {
        return executeFusionSkill(skillData.id, caster, target, this);
      }
      
      // 다른 클래스 스킬은 원래 로직 사용 (임시로 MageSkills 로직 사용)
      if (skillData.id.startsWith('mage_skill_')) {
        // 마법사 스킬의 원래 속성 사용
        const originalRange = skillData.range || 300; // 마법사 스킬의 원래 사거리
        const originalDamageMultiplier = skillData.damageMultiplier || 1.0;
        const originalSpeed = 400; // 마법사 스킬의 원래 속도
        
        // target 파라미터 처리
        let targetX, targetY;
        if (typeof target === 'object' && target.x !== undefined && target.y !== undefined) {
          targetX = target.x;
          targetY = target.y;
        } else if (typeof target === 'number' && arguments.length >= 3) {
          targetX = target;
          targetY = arguments[2];
        } else {
          // 기본적으로 마우스 포인터 위치 사용
          const pointer = caster.scene.input.activePointer;
          const worldPoint = caster.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
          targetX = worldPoint.x;
          targetY = worldPoint.y;
        }
        
        const scene = caster.scene;
        const angle = Phaser.Math.Angle.Between(caster.x, caster.y, targetX, targetY);
        
        // 마법사 스킬의 원래 속성으로 투사체 생성
        const projectile = scene.add.circle(caster.x, caster.y, 6, 0x4444FF, 0.9);
        projectile.setDepth(50);
        scene.physics.add.existing(projectile);
        projectile.body.setVelocity(Math.cos(angle) * originalSpeed, Math.sin(angle) * originalSpeed);

        // 충돌 처리
        scene.physics.add.overlap(projectile, scene.monsters, (proj, monster) => {
          const damage = Math.floor(caster.stats.attack * originalDamageMultiplier);
          monster.takeDamage(damage, caster);
          proj.destroy();
        });

        // 사거리 제한 (원래 사거리 사용)
        scene.time.delayedCall(originalRange / originalSpeed * 1000, () => {
          if (projectile.active) projectile.destroy();
        });
        
        return true;
      }
      
      // 기본 융합술사 투사체 로직
      let targetX, targetY;
      if (typeof target === 'object' && target.x !== undefined && target.y !== undefined) {
        targetX = target.x;
        targetY = target.y;
      } else if (typeof target === 'number' && arguments.length >= 3) {
        targetX = target;
        targetY = arguments[2];
      } else {
        // 기본적으로 마우스 포인터 위치 사용
        const pointer = caster.scene.input.activePointer;
        const worldPoint = caster.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        targetX = worldPoint.x;
        targetY = worldPoint.y;
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
        return executeFusionSkill(skillData.id, caster, null, this);
      }
      
      const scene = caster.scene;
      const duration = skillData.duration || 2000;

      // 플레이어의 마지막 이동 방향을 사용
      const direction = caster.lastMoveDirection || 'down';
      let angle = 0;
      switch (direction) {
        case 'right': angle = 0; break;
        case 'down': angle = Math.PI / 2; break;
        case 'left': angle = Math.PI; break;
        case 'up': angle = -Math.PI / 2; break;
      }

      // 장벽을 플레이어 앞에 설치 (50px 앞)
      const barrierDistance = 50;
      const barrierX = caster.x + Math.cos(angle) * barrierDistance;
      const barrierY = caster.y + Math.sin(angle) * barrierDistance;

      // 마력 장벽 생성 (방향에 따라 회전)
      const barrier = scene.add.rectangle(barrierX, barrierY, 120, 8, 0x9B59B6, 0.8);
      barrier.setStrokeStyle(2, 0x8E44AD);
      barrier.setRotation(angle); // 방향에 맞춰 회전
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
        return executeFusionSkill(skillData.id, caster, null, this);
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
            if (!monster.isDead && monster.body) {
              monster.isKnockedBack = false;
              monster.body.setVelocity(0);
              monster.waveHit = false;
            }
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

// 융합 스킬 데이터 정의
const FUSION_SKILL_DATA = {
  'fusion_flare_dash': {
    name: '화염 돌격',
    cooldown: 5000,
    mpCost: 60,
    description: '화염을 두르고 돌진하며 경로에 폭발을 일으킴'
  },
  'fusion_ice_pierce': {
    name: '만년설 송곳',
    cooldown: 6000,
    mpCost: 65,
    description: '적을 관통하며 경로의 모든 적을 빙결시킴'
  },
  'fusion_magic_spin': {
    name: '마력 회전 베기',
    cooldown: 4000,
    mpCost: 50,
    description: '마력을 실은 회전 베기로 주변 적들에게 마법 피해'
  },
  'fusion_time_doom': {
    name: '시간 파멸',
    cooldown: 15000,
    mpCost: 100,
    description: '시간을 왜곡시키는 파멸의 충격파로 적들을 영원히 묶음'
  },
  'fusion_pierce_dash': {
    name: '관통 돌진',
    cooldown: 7000,
    mpCost: 70,
    description: '돌진하며 적을 관통하는 화살을 발사'
  },
  'fusion_enhanced_barrier': {
    name: '강화 방벽',
    cooldown: 12000,
    mpCost: 80,
    description: '물리와 마법 방어력이 모두 상승하는 강화된 방벽'
  },
  'fusion_poison_flame': {
    name: '독성 화염',
    cooldown: 8000,
    mpCost: 75,
    description: '독이 섞인 화염 폭발로 적을 불태우고 중독시킴'
  },
  'fusion_shadow_ice': {
    name: '그림자 냉기',
    cooldown: 9000,
    mpCost: 85,
    description: '그림자 속에서 냉기를 뿜어내는 은밀한 공격'
  },
  'fusion_time_clone': {
    name: '시간 복제',
    cooldown: 20000,
    mpCost: 120,
    description: '시간을 조작하여 자신의 분신을 생성'
  },
  'fusion_enhanced_arrow': {
    name: '강화 화살',
    cooldown: 3000,
    mpCost: 40,
    description: '마력이 강화된 화살을 발사'
  },
  'fusion_element_magic': {
    name: '속성 마력탄',
    cooldown: 2500,
    mpCost: 35,
    description: '속성이 부여된 강화 마력탄'
  }
};

// 융합 스킬 execute 메소드들
export function executeFusionSkill(skillId, caster, target, skill) {
  const scene = caster.scene;

  // 스킬 데이터 가져오기
  const skillData = FUSION_SKILL_DATA[skillId];
  if (!skillData) {
    console.error(`[FusionistSkills] 스킬 데이터 없음: ${skillId}`);
    return false;
  }

  const mpCost = skillData.mpCost;
  const cooldown = skillData.cooldown;

  // 쿨타임 체크
  const currentTime = Date.now();
  const lastUsed = caster.fusionSkillCooldowns.get(skillId) || 0;
  if (currentTime - lastUsed < cooldown) {
    const remaining = cooldown - (currentTime - lastUsed);
    console.log(`[FusionistSkills] ${skillData.name} 쿨다운 중: ${(remaining / 1000).toFixed(1)}초 남음`);
    return false;
  }

  // 마나 체크
  if (caster.stats.mp < mpCost) {
    console.log(`[FusionistSkills] MP 부족 (필요: ${mpCost}, 현재: ${caster.stats.mp})`);
    return false;
  }

  // 마나 소모
  caster.stats.mp = Math.max(0, caster.stats.mp - mpCost);
  if (caster.scene) {
    caster.scene.events.emit('player:mp_changed', caster.stats.mp, caster.stats.maxMp);
  }

  // 쿨타임 설정
  caster.fusionSkillCooldowns.set(skillId, currentTime);
  
  // Skill 클래스의 쿨타임도 설정 (UI 표시용)
  if (skill) {
    skill.currentCooldown = cooldown;
  }
  
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
    case 'fusion_element_magic':
      return executeElementMagic(scene, caster, target);
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
  
  return true;
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
        if (!monster.isDead) {
          monster.stats.speed *= 2;
          monster.iceHit = false;
        }
      });
    }
  });
  
  // 사거리 제한
  scene.time.delayedCall(2000, () => {
    if (arrow.active) arrow.destroy();
  });
  
  return true;
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
  
  return true;
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
  
  return true;
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
  
  return true;
    }
  });
}

function executeEnhancedBarrier(scene, caster) {
  // 강화 방벽
  const barrier = scene.add.rectangle(caster.x, caster.y - 20, 150, 10, 0xFFD700, 0.9);
  barrier.setDepth(50);
  scene.physics.add.existing(barrier);
  barrier.body.setImmovable(true);
  
  return true;
  
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
  
  return true;
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
  
  return true;
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
  
  return true;
    
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
  
  return true;
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

function executeElementMagic(scene, caster, target) {
  // 속성 마력탄: 속성이 부여된 강화 마력탄
  const pointer = scene.input.activePointer;
  const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  const angle = Phaser.Math.Angle.Between(caster.x, caster.y, worldPoint.x, worldPoint.y);
  
  // 랜덤 속성 선택
  const elements = ['fire', 'ice', 'lightning'];
  const randomElement = elements[Math.floor(Math.random() * elements.length)];
  
  let color, particleColor, flashColor;
  switch (randomElement) {
    case 'fire':
      color = 0xFF4444;
      particleColor = 0xFF6600;
      flashColor = 0xFF0000;
      break;
    case 'ice':
      color = 0x4444FF;
      particleColor = 0x66CCFF;
      flashColor = 0x0000FF;
      break;
    case 'lightning':
      color = 0xFFFF44;
      particleColor = 0xFFFFFF;
      flashColor = 0xFFFFFF;
      break;
    default:
      color = 0x9B59B6;
      particleColor = 0x8E44AD;
      flashColor = 0x9B59B6;
  }
  
  // 강화된 마력탄 생성 (기존 마력탄보다 크고 강력)
  const projectile = scene.add.circle(caster.x, caster.y, 12, color, 0.9);
  projectile.setDepth(50);
  scene.physics.add.existing(projectile);
  projectile.body.setVelocity(Math.cos(angle) * 550, Math.sin(angle) * 550);
  
  // 색상 변화 애니메이션
  scene.tweens.add({
    targets: projectile,
    tint: { from: color, to: 0xFFFFFF },
    duration: 300,
    yoyo: true,
    repeat: -1
  });
  
  // 강화된 파티클 트레일 (더 크고 많음)
  const trailParticles = [];
  const trailInterval = scene.time.addEvent({
    delay: 30,
    callback: () => {
      const trail = scene.add.circle(projectile.x, projectile.y, 6, particleColor, 0.8);
      trail.setDepth(49);
      trailParticles.push(trail);
      scene.tweens.add({
        targets: trail,
        alpha: 0,
        scale: 1.5,
        duration: 400,
        onComplete: () => trail.destroy()
      });
    },
    loop: true
  });
  
  // 충돌 처리 (강화된 데미지)
  scene.physics.add.overlap(projectile, scene.monsters, (proj, monster) => {
    const damage = Math.floor(caster.stats.attack * 1.8); // 강화된 데미지
    monster.takeDamage(damage, caster);
    
    // 속성별 추가 효과
    if (randomElement === 'fire') {
      // 화염: 추가 화상 데미지
      scene.time.delayedCall(500, () => {
        if (!monster.isDead) {
          monster.takeDamage(Math.floor(damage * 0.3), caster);
        }
      });
    } else if (randomElement === 'ice') {
      // 냉기: 속도 감소
      if (!monster.isDead) {
        monster.stats.speed *= 0.7;
        scene.time.delayedCall(2000, () => {
          if (!monster.isDead) {
            monster.stats.speed /= 0.7;
          }
        });
      }
    } else if (randomElement === 'lightning') {
      // 번개: 연쇄 피해 (근처 몬스터에게)
      const monsters = scene.monsters.getChildren();
      monsters.forEach(otherMonster => {
        if (otherMonster !== monster && !otherMonster.isDead) {
          const chainDistance = Phaser.Math.Distance.Between(monster.x, monster.y, otherMonster.x, otherMonster.y);
          if (chainDistance <= 100) {
            otherMonster.takeDamage(Math.floor(damage * 0.5), caster);
          }
        }
      });
    }
    
    // 폭발 효과
    const explosion = scene.add.circle(proj.x, proj.y, 25, color, 0.7);
    explosion.setDepth(60);
    scene.tweens.add({
      targets: explosion,
      scale: 2,
      alpha: 0,
      duration: 200,
      onComplete: () => explosion.destroy()
    });
    
    // 파티클 정리
    trailInterval.remove();
    trailParticles.forEach(p => p.destroy());
    proj.destroy();
  });
  
  // 사거리 제한
  scene.time.delayedCall(2000, () => {
    if (projectile.active) {
      trailInterval.remove();
      trailParticles.forEach(p => p.destroy());
      projectile.destroy();
    }
  });
  
  return true;
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
  
  return true;
}

// 융합 스킬을 위한 클래스들
export class RangedSkill extends Skill {
  execute(caster, target) {
    // 융합 스킬 체크
    if (this.id && this.id.startsWith('fusion_')) {
      return executeFusionSkill(this.id, caster, target, this);
    }
    // 기본 ranged 스킬 로직 (필요시 구현)
  }
}

export class AOESkill extends Skill {
  execute(caster, target) {
    // 융합 스킬 체크
    if (this.id && this.id.startsWith('fusion_')) {
      return executeFusionSkill(this.id, caster, target, this);
    }
    // 기본 aoe 스킬 로직 (필요시 구현)
  }
}

export class DashSkill extends Skill {
  execute(caster, target) {
    // 융합 스킬 체크
    if (this.id && this.id.startsWith('fusion_')) {
      return executeFusionSkill(this.id, caster, target, this);
    }
    // 기본 dash 스킬 로직 (필요시 구현)
  }
}

export class BuffSkill extends Skill {
  execute(caster, target) {
    // 융합 스킬 체크
    if (this.id && this.id.startsWith('fusion_')) {
      return executeFusionSkill(this.id, caster, target, this);
    }
    // 기본 buff 스킬 로직 (필요시 구현)
  }
}

export class MeleeSkill extends Skill {
  execute(caster, target) {
    // 융합 스킬 체크
    if (this.id && this.id.startsWith('fusion_')) {
      return executeFusionSkill(this.id, caster, target, this);
    }
    // 기본 melee 스킬 로직 (필요시 구현)
  }
}