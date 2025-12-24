import Phaser from 'phaser';
import { Entity } from './Entity.js';
import { DEPTH } from '../config/Constants.js';

/**
 * Monster - 몬스터 베이스 클래스
 */
export class Monster extends Entity {
  constructor(scene, x, y, config = {}) {
    super(scene, x, y, {
      maxHp: config.maxHp || 50,
      speed: config.speed || 80,
      attack: config.attack || 5,
      defense: config.defense || 2,
      showHealthBar: true
    });

    // config 저장
    this.config = config;

    // 마지막 이동 방향 (idle 상태에서 사용)
    this.lastMoveDirection = 'down';

    this.monsterType = config.type || 'unknown';
    this.level = config.level || 1;
    this.expReward = config.expReward || 10;
    this.goldReward = config.goldReward || [1, 5];
    this.drops = config.drops || []; // 드롭 아이템 목록 추가
    
    // AI 상태
    this.state = 'idle'; // idle, chase, attack, return
    this.aiType = config.ai || 'normal'; // normal, aggressive, ranged, tank, boss
    this.target = null;
    this.spawnX = x;
    this.spawnY = y;
    
    // AI 설정
    this.aggroRange = config.aggroRange || 300;
    this.attackRange = config.attackRange || 50;
    this.returnRange = config.returnRange || 600;
    this.attackCooldown = config.attackCooldown || 1000;
    this.canAttack = true;
    
    // 보스 설정
    this.isBoss = config.isBoss || false;
    this.phases = config.phases || [];
    this.currentPhase = 0;
    this.baseSpeed = config.speed || 80;
    this.baseAttack = config.attack || 5;

    // 몬스터 스프라이트 또는 기본 도형
    const spriteKey = this.extractMonsterId();
    if (scene.textures.exists(spriteKey)) {
      // spritesheet이 있는 경우
      this.sprite = scene.add.sprite(0, 0, spriteKey);
      this.sprite.setScale(this.isBoss ? 2 : 1);
      this.add(this.sprite);
      this.hasSprite = true;
    } else {
      // spritesheet이 없는 경우 기본 사각형 생성
      this.graphics = scene.add.graphics();
      this.graphics.fillStyle(this.config.color || 0xff0000, 1);
      this.graphics.fillRect(-16, -16, 32, 32);
      this.add(this.graphics);
      this.hasSprite = false;
    }

    this.setDepth(DEPTH.ENTITIES);
    
    // 크기 설정
    this.size = config.size || 1.2;  // 기본 크기를 1.2로 키움
    if (this.hasSprite) {
      this.sprite.setScale(this.sprite.scale * this.size);
    } else {
      // graphics 크기 조정 (scale 적용)
      this.graphics.scaleX = this.size;
      this.graphics.scaleY = this.size;
    }
    this.body.setSize(32 * this.size, 32 * this.size);
    
    // 애니메이션 생성
    this.createAnimations();
    
    // 보스 이름 표시
    if (this.isBoss) {
      this.nameText = scene.add.text(0, -50, this.monsterType, {
        font: 'bold 16px Arial',
        fill: '#FFD700',
        stroke: '#000000',
        strokeThickness: 3
      });
      this.nameText.setOrigin(0.5);
      this.add(this.nameText);
    }
  }

  /**
   * 피해 입음 (공격자를 타겟으로 설정)
   */
  takeDamage(damage, attacker = null) {
    console.log(`[Monster] ${this.monsterType} takeDamage, attacker:`, attacker ? attacker.constructor.name : 'null');
    // 공격자를 타겟으로 설정
    if (attacker && attacker.constructor.name === 'Player') {
      this.target = attacker;
      console.log(`[Monster] Target set to player`);
    }
    
    // 부모 클래스 takeDamage 호출
    return super.takeDamage(damage, attacker);
  }

  /**
   * 매 프레임 업데이트
   */
  update(time, delta) {
    if (this.isDead) return;

    // 상태 이상 업데이트 (Entity 메서드 호출)
    this.updateEntity(time, delta);

    this.updateAI(delta);
    this.updateHealthBar();
    
    // 상태에 따른 애니메이션 강제 설정
    this.updateAnimation();
  }

  /**
   * AI 업데이트
   */
  updateAI(delta) {
    // 보스 페이즈 체크
    if (this.isBoss) {
      this.checkPhaseTransition();
    }
    
    // 플레이어 찾기
    if (!this.target || this.target.isDead) {
      this.findTarget();
    }

    if (!this.target) {
      this.idle();
      return;
    }

    const distanceToTarget = Phaser.Math.Distance.Between(
      this.x, this.y,
      this.target.x, this.target.y
    );

    const distanceToSpawn = Phaser.Math.Distance.Between(
      this.x, this.y,
      this.spawnX, this.spawnY
    );

    // 보스는 복귀하지 않음
    if (!this.isBoss && distanceToSpawn > this.returnRange) {
      this.returnToSpawn();
      return;
    }

    // AI 타입별 행동
    switch (this.aiType) {
      case 'aggressive':
        this.aggressiveBehavior(distanceToTarget);
        break;
      case 'ranged':
        this.rangedBehavior(distanceToTarget);
        break;
      case 'tank':
        this.tankBehavior(distanceToTarget);
        break;
      case 'boss':
        this.bossBehavior(distanceToTarget);
        break;
      default:
        this.normalBehavior(distanceToTarget);
        break;
    }
  }
  
  /**
   * 일반 AI 행동
   */
  normalBehavior(distanceToTarget) {
    // 행동 불가 상태 체크
    if (!this.canAct()) {
      this.body.setVelocity(0);
      return;
    }
    
    if (distanceToTarget <= this.attackRange) {
      this.attackTarget();
    } else if (distanceToTarget <= this.aggroRange) {
      this.chaseTarget();
    } else {
      this.idle();
    }
  }
  
  /**
   * 공격적 AI (즉시 돌진)
   */
  aggressiveBehavior(distanceToTarget) {
    if (distanceToTarget <= this.attackRange) {
      this.attackTarget();
    } else {
      this.chaseTarget();
    }
  }
  
  /**
   * 원거리 AI (거리 유지)
   */
  rangedBehavior(distanceToTarget) {
    const optimalRange = this.attackRange * 0.8;
    
    if (distanceToTarget < optimalRange * 0.5) {
      // 너무 가까우면 후퇴
      this.retreatFromTarget();
    } else if (distanceToTarget <= this.attackRange) {
      this.attackTarget();
    } else if (distanceToTarget <= this.aggroRange) {
      this.chaseTarget();
    } else {
      this.idle();
    }
  }
  
  /**
   * 탱커 AI (느리지만 강력)
   */
  tankBehavior(distanceToTarget) {
    if (distanceToTarget <= this.attackRange) {
      this.attackTarget();
    } else if (distanceToTarget <= this.aggroRange) {
      this.chaseTarget();
    } else {
      this.idle();
    }
  }
  
  /**
   * 보스 AI (공격적 + 특수 패턴)
   */
  bossBehavior(distanceToTarget) {
    if (distanceToTarget <= this.attackRange) {
      this.attackTarget();
    } else {
      this.chaseTarget();
    }
  }
  
  /**
   * 상태에 따른 애니메이션 업데이트
   */
  updateAnimation() {
    // spritesheet이 없는 경우 애니메이션 처리하지 않음
    if (!this.hasSprite) return;
    
    const spriteKey = this.extractMonsterId();
    let animationKey = '';
    
    // 상태에 따라 애니메이션 결정
    switch (this.state) {
      case 'chase':
        if (this.monsterType === '슬라임') {
          animationKey = `${spriteKey}_walk_${this.lastMoveDirection}`;
        } else {
          animationKey = `${spriteKey}_walk`;
        }
        break;
      case 'attack':
        animationKey = `${spriteKey}_attack`;
        break;
      case 'idle':
      default:
        if (this.monsterType === '슬라임') {
          animationKey = `${spriteKey}_idle_${this.lastMoveDirection}`;
        } else {
          animationKey = `${spriteKey}_idle`;
        }
        break;
    }
    
    // 현재 재생 중인 애니메이션과 다르면 전환
    if (this.sprite.anims.currentAnim && this.sprite.anims.currentAnim.key !== animationKey) {
      console.log(`[Monster] ${this.monsterType} switching to animation: ${animationKey}`);
      this.sprite.play(animationKey);
    }
  }
  
  /**
   * 대상에서 후퇴
   */
  retreatFromTarget() {
    this.state = 'retreat';
    
    if (!this.target) return;
    
    const angle = Phaser.Math.Angle.Between(
      this.target.x, this.target.y,
      this.x, this.y
    );
    
    this.body.setVelocity(
      Math.cos(angle) * this.stats.speed,
      Math.sin(angle) * this.stats.speed
    );
  }
  
  /**
   * 보스 페이즈 전환 체크
   */
  checkPhaseTransition() {
    if (!this.phases || this.phases.length === 0) return;
    
    const hpPercent = (this.stats.hp / this.stats.maxHp) * 100;
    
    for (let i = this.phases.length - 1; i > this.currentPhase; i--) {
      const phase = this.phases[i];
      if (hpPercent <= phase.hpPercent) {
        this.enterPhase(i);
        break;
      }
    }
  }
  
  /**
   * 페이즈 진입
   */
  enterPhase(phaseIndex) {
    this.currentPhase = phaseIndex;
    const phase = this.phases[phaseIndex];
    
    // 스탯 조정
    this.stats.speed = this.baseSpeed * (phase.speedMultiplier || 1.0);
    this.stats.attack = this.baseAttack * (phase.attackMultiplier || 1.0);
    
    console.log(`[Boss] ${this.monsterType} 페이즈 ${phaseIndex + 1} 진입!`);
    
    // 페이즈 전환 이펙트
    this.showPhaseTransitionEffect();
  }
  
  /**
   * 페이즈 전환 이펙트
   */
  showPhaseTransitionEffect() {
    // 화면 쉐이크
    this.scene.cameras.main.shake(300, 0.01);
    
    // 폭발 이펙트
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const circle = this.scene.add.circle(
        this.x + Math.cos(angle) * 40,
        this.y + Math.sin(angle) * 40,
        10,
        0xFFD700,
        0.8
      );
      circle.setDepth(DEPTH.EFFECTS);
      
      this.scene.tweens.add({
        targets: circle,
        x: circle.x + Math.cos(angle) * 100,
        y: circle.y + Math.sin(angle) * 100,
        scale: 2,
        alpha: 0,
        duration: 500,
        onComplete: () => circle.destroy()
      });
    }
    
    // 텍스트 표시
    const phaseText = this.scene.add.text(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY - 50,
      `페이즈 ${this.currentPhase + 1}!`,
      {
        font: 'bold 32px Arial',
        fill: '#FFD700',
        stroke: '#FF0000',
        strokeThickness: 4
      }
    );
    phaseText.setOrigin(0.5);
    phaseText.setScrollFactor(0);
    phaseText.setDepth(DEPTH.UI + 100);
    
    this.scene.tweens.add({
      targets: phaseText,
      scale: 1.5,
      alpha: 0,
      y: phaseText.y - 50,
      duration: 2000,
      onComplete: () => phaseText.destroy()
    });
  }

  /**
   * 대상 찾기
   */
  findTarget() {
    const player = this.scene.player;
    if (!player || player.isDead) {
      this.target = null;
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      this.x, this.y,
      player.x, player.y
    );

    if (distance <= this.aggroRange) {
      this.target = player;
      this.state = 'chase';
    }
  }

  /**
   * 대기 상태
   */
  idle() {
    this.state = 'idle';
    this.body.setVelocity(0);
    
    // 애니메이션은 updateAnimation()에서 처리
    
    // 스폰 위치 근처에서 배회 (간단히)
    const distanceToSpawn = Phaser.Math.Distance.Between(
      this.x, this.y,
      this.spawnX, this.spawnY
    );
    
    if (distanceToSpawn > 50) {
      this.moveTowards(this.spawnX, this.spawnY);
    }
  }

  /**
   * 대상 추적
   */
  chaseTarget() {
    this.state = 'chase';
    
    // 애니메이션은 updateAnimation()에서 처리
    
    if (!this.target || !this.canAct()) {
      this.body.setVelocity(0);
      return;
    }
    
    this.moveTowards(this.target.x, this.target.y);
  }

  /**
   * 대상 공격
   */
  attackTarget() {
    this.state = 'attack';
    this.body.setVelocity(0);
    
    // 애니메이션은 updateAnimation()에서 처리
    
    if (!this.canAttack || !this.target || !this.canAct()) return;
    
    this.canAttack = false;
    
    // 공격 실행
    const damage = this.stats.attack;
    const result = this.target.takeDamage(damage, this);
    
    // 대미지 텍스트 표시
    this.scene.showDamageText(this.target.x, this.target.y - 30, result.damage, result.isCrit, result.isEvaded);
    
    // 공격 이펙트 (간단히)
    this.showAttackEffect();
    
    // 쿨다운
    this.scene.time.delayedCall(this.attackCooldown, () => {
      this.canAttack = true;
    });
  }

  /**
   * 공격 이펙트
   */
  showAttackEffect() {
    const flash = this.scene.add.circle(this.x, this.y, 20, 0xFF0000, 0.6);
    flash.setDepth(DEPTH.EFFECTS);
    
    this.scene.tweens.add({
      targets: flash,
      scale: 2,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy()
    });
  }

  /**
   * 특정 위치로 이동
   */
  moveTowards(targetX, targetY) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    const speed = this.getCurrentSpeed();
    
    this.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    
    // 방향 업데이트
    this.lastMoveDirection = this.getDirectionFromAngle(angle);
  }

  /**
   * 스폰 위치로 복귀
   */
  returnToSpawn() {
    this.state = 'return';
    this.target = null;
    
    this.moveTowards(this.spawnX, this.spawnY);
    
    // 스폰 위치 도달 시 체력 회복
    const distance = Phaser.Math.Distance.Between(
      this.x, this.y,
      this.spawnX, this.spawnY
    );
    
    if (distance < 10) {
      this.stats.hp = this.stats.maxHp;
      this.updateHealthBar();
    }
  }

  /**
   * 사망 시 처리 (경험치, 골드, 드롭 아이템)
   */
  onDeath() {
    console.log(`[Monster] onDeath called for ${this.monsterType}`);

    // 씬에서 플레이어 찾기
    const player = this.scene.player;
    if (player && player.constructor.name === 'Player') {
      console.log(`[Monster] Player found, processing rewards`);

      // 퀘스트 진행도 업데이트
      if (player.questManager) {
        // 몬스터 타입에서 ID 추출 (예: "슬라임 Lv.1" -> "slime")
        const monsterId = this.extractMonsterId();
        player.questManager.updateProgress('kill', monsterId, 1);
      }

      // 경험치 지급
      player.gainExp(this.expReward);
      console.log(`[Monster] ${this.monsterType} 처치! 경험치 +${this.expReward}`);

      // 골드 지급
      const goldAmount = Phaser.Math.Between(this.goldReward[0], this.goldReward[1]);
      player.gold += goldAmount;
      player.scene.events.emit('player:gold_changed', player.gold);
      console.log(`[Monster] 골드 +${goldAmount}`);

      // 드롭 아이템
      this.dropItems(player);
    } else {
      console.log(`[Monster] No player found for ${this.monsterType}`);
    }

    // 부모 클래스 onDeath 호출 (마지막에 호출)
    super.onDeath();
  }

  /**
   * 보상 드롭
   */
  dropRewards() {
    const player = this.scene.player;
    if (!player) return;
    
    console.log(`[Monster] ${this.monsterType} 사망, 보상 드롭 시작`);
    console.log(`[Monster] 드롭 목록:`, this.drops);
    
    // 경험치
    player.gainExp(this.expReward);
    
    // 골드
    const gold = Phaser.Math.Between(this.goldReward[0], this.goldReward[1]);
    player.gainGold(gold);
    
    // 아이템 드롭
    this.dropItems();
    
    // 드롭 텍스트 표시
    this.showDropText(`+${this.expReward} EXP, +${gold} 골드`);
  }

  /**
   * 아이템 드롭
   */
  dropItems() {
    if (!this.drops || this.drops.length === 0) {
      console.log('[Monster] 드롭 아이템 없음');
      return;
    }
    
    console.log(`[Monster] 드롭 확률 체크 중... (${this.drops.length}개 아이템)`);
    
    this.drops.forEach(dropData => {
      const roll = Math.random();
      console.log(`[Monster] ${dropData.itemId}: ${(roll * 100).toFixed(1)}% vs ${(dropData.chance * 100)}%`);
      
      // 확률 체크
      if (roll > dropData.chance) return;
      
      // 수량 결정
      let quantity = 1;
      if (Array.isArray(dropData.quantity)) {
        quantity = Phaser.Math.Between(dropData.quantity[0], dropData.quantity[1]);
      } else {
        quantity = dropData.quantity;
      }
      
      console.log(`[Monster] 아이템 드롭 확정: ${dropData.itemId} x${quantity}`);
      
      // 아이템 생성 요청
      this.scene.events.emit('item:drop', {
        itemId: dropData.itemId,
        x: this.x,
        y: this.y,
        quantity: quantity
      });
    });
  }

  /**
   * 드롭 텍스트 표시
   */
  showDropText(text) {
    const dropText = this.scene.add.text(this.x, this.y, text, {
      font: '14px Arial',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2
    });
    dropText.setOrigin(0.5);
    dropText.setDepth(DEPTH.UI);

    this.scene.tweens.add({
      targets: dropText,
      y: dropText.y - 40,
      alpha: 0,
      duration: 1500,
      onComplete: () => dropText.destroy()
    });
  }

  /**
   * 몬스터 ID 추출 (퀘스트용)
   */
  extractMonsterId() {
    // 몬스터 타입에서 ID 생성
    const typeMap = {
      '슬라임': 'slime',
      '숲늑대': 'wolf',
      '늑대': 'wolf',
      '고블린': 'goblin',
      '고블린 전사': 'goblin_warrior',
      '하피': 'harpy',
      '오거': 'ogre',
      '황금 그리폰': 'golden_griffon'
    };
    
    return typeMap[this.monsterType] || this.monsterType.toLowerCase();
  }

  /**
   * 몬스터 애니메이션 생성
   */
  createAnimations() {
    // spritesheet이 없는 경우 애니메이션 생성하지 않음
    if (!this.hasSprite) return;
    
    const spriteKey = this.extractMonsterId();
    
    // spritesheet이 로드되었는지 확인
    if (this.scene.textures.exists(spriteKey)) {
      // 몬스터 타입별 애니메이션 설정 (프레임 수와 사이즈가 다름)
      
      if (this.monsterType === '슬라임') {
        // 슬라임: 방향별 애니메이션 (각 방향당 4프레임)
        const directions = ['down', 'left', 'right', 'up'];
        directions.forEach((dir, index) => {
          const startFrame = index * 4;
          
          // idle 애니메이션
          if (!this.scene.anims.exists(`${spriteKey}_idle_${dir}`)) {
            this.scene.anims.create({
              key: `${spriteKey}_idle_${dir}`,
              frames: this.scene.anims.generateFrameNumbers(spriteKey, { start: startFrame, end: startFrame + 3 }),
              frameRate: 4,
              repeat: -1
            });
          }
          
          // walk 애니메이션
          if (!this.scene.anims.exists(`${spriteKey}_walk_${dir}`)) {
            this.scene.anims.create({
              key: `${spriteKey}_walk_${dir}`,
              frames: this.scene.anims.generateFrameNumbers(spriteKey, { start: startFrame + 16, end: startFrame + 19 }),
              frameRate: 6,
              repeat: -1
            });
          }
        });
      } else {
        // 늑대 등 다른 몬스터들: 단일 방향 애니메이션
        if (!this.scene.anims.exists(`${spriteKey}_idle`)) {
          this.scene.anims.create({
            key: `${spriteKey}_idle`,
            frames: this.scene.anims.generateFrameNumbers(spriteKey, { start: 0, end: 0 }),
            frameRate: 6,
            repeat: -1
          });
        }
        
        if (!this.scene.anims.exists(`${spriteKey}_walk`)) {
          this.scene.anims.create({
            key: `${spriteKey}_walk`,
            frames: this.scene.anims.generateFrameNumbers(spriteKey, { start: 0, end: 5 }),
            frameRate: 6,
            repeat: -1
          });
        }
      }
      
      // attack 애니메이션 [6-8] (나중에 사용 가능)
      if (!this.scene.anims.exists(`${spriteKey}_attack`)) {
        this.scene.anims.create({
          key: `${spriteKey}_attack`,
          frames: this.scene.anims.generateFrameNumbers(spriteKey, { start: 6, end: 8 }),
          frameRate: 8,
          repeat: 0  // 공격은 한 번만
        });
      }
      
      // damaged 애니메이션 [9-11] (나중에 사용 가능)
      if (!this.scene.anims.exists(`${spriteKey}_damaged`)) {
        this.scene.anims.create({
          key: `${spriteKey}_damaged`,
          frames: this.scene.anims.generateFrameNumbers(spriteKey, { start: 9, end: 11 }),
          frameRate: 10,
          repeat: 0
        });
      }
      
      // death 애니메이션 [12] (나중에 사용 가능)
      if (!this.scene.anims.exists(`${spriteKey}_death`)) {
        this.scene.anims.create({
          key: `${spriteKey}_death`,
          frames: this.scene.anims.generateFrameNumbers(spriteKey, { start: 12, end: 12 }),
          frameRate: 4,
          repeat: 0
        });
      }
      
      // 초기 애니메이션 재생 (기본 방향)
      this.sprite.play(`${spriteKey}_idle_down`);
    } else {
      // 단일 이미지인 경우 tint 적용 (spritesheet이 없는 경우)
      // config.color가 있으면 적용
      if (this.config && this.config.color) {
        this.sprite.setTint(this.config.color);
      }
    }
  }

  /**
   * 각도로부터 방향 결정
   */
  getDirectionFromAngle(angle) {
    const degrees = Phaser.Math.RadToDeg(angle);
    if (degrees >= -45 && degrees < 45) return 'right';
    if (degrees >= 45 && degrees < 135) return 'down';
    if (degrees >= 135 || degrees < -135) return 'left';
    return 'up';
  }
}

/**
 * Slime - 슬라임 몬스터
 */
export class Slime extends Monster {
  constructor(scene, x, y, level = 1) {
    const size = Math.max(1.0, Math.min(2.5, level * 0.1 + 1.0)); // 레벨에 따른 크기 (1.0 ~ 2.5) - 더 키움
    
    super(scene, x, y, {
      type: '슬라임',
      level: level,
      maxHp: Math.floor(30 + level * 10),
      speed: 60 + level * 5,
      attack: Math.floor(5 + level * 2),
      defense: Math.floor(1 + level * 0.5),
      expReward: Math.floor(8 + level * 2),
      goldReward: [Math.floor(level * 0.5), Math.floor(level * 2)],
      color: 0x00FF00,
      ai: 'normal',
      aggroRange: 250,
      attackRange: 40,
      attackCooldown: 1200,
      size: size,
      drops: [
        { itemId: 'slime_jelly', chance: 0.8, quantity: 1 },
        { itemId: 'potion_hp_small', chance: 0.1, quantity: 1 }
      ]
    });

    // 슬라임 특성
    this.body.setCircle(16 * this.size); // 충돌 범위 조정
  }
}

/**
 * Wolf - 늑대 몬스터
 */
export class Wolf extends Monster {
  constructor(scene, x, y, level = 5) {
    super(scene, x, y, {
      type: '숲늑대',
      level: level,
      maxHp: 100,
      speed: 120,
      attack: 12,
      defense: 5,
      expReward: 35,
      goldReward: [5, 10],
      color: 0x8B4513,
      ai: 'normal',
      aggroRange: 400,
      attackRange: 60,
      attackCooldown: 1000,
      size: 1.5,
      drops: [
        { itemId: 'wolf_fang', chance: 0.6, quantity: 1 },
        { itemId: 'wolf_leather', chance: 0.4, quantity: [1, 2] },
        { itemId: 'potion_hp_small', chance: 0.15, quantity: 1 }
      ]
    });
  }
}

/**
 * Goblin - 고블린 몬스터
 */
export class Goblin extends Monster {
  constructor(scene, x, y, level = 8) {
    super(scene, x, y, {
      type: '고블린',
      level: level,
      maxHp: 150,
      speed: 100,
      attack: 18,
      defense: 8,
      expReward: 50,
      goldReward: [8, 15],
      color: 0x228B22,
      ai: 'aggressive',
      aggroRange: 450,
      attackRange: 80,
      attackCooldown: 1200,
      drops: [
        { itemId: 'wolf_leather', chance: 0.3, quantity: 1 },
        { itemId: 'potion_hp_small', chance: 0.25, quantity: [1, 2] },
        { itemId: 'sword_iron', chance: 0.05, quantity: 1 }
      ]
    });
  }
}

/**
 * GoblinWarrior - 고블린 전사
 */
export class GoblinWarrior extends Monster {
  constructor(scene, x, y, level = 10) {
    super(scene, x, y, {
      type: '고블린 전사',
      level: level,
      maxHp: 250,
      speed: 110,
      attack: 25,
      defense: 12,
      expReward: 80,
      goldReward: [15, 25],
      color: 0x006400,
      ai: 'aggressive',
      aggroRange: 500,
      attackRange: 90,
      attackCooldown: 1100,
      drops: [
        { itemId: 'helmet_leather', chance: 0.15, quantity: 1 },
        { itemId: 'sword_steel', chance: 0.08, quantity: 1 },
        { itemId: 'potion_hp_small', chance: 0.3, quantity: [2, 3] }
      ]
    });
  }
}

/**
 * Harpy - 하피 몬스터 (원거리)
 */
export class Harpy extends Monster {
  constructor(scene, x, y, level = 13) {
    super(scene, x, y, {
      type: '하피',
      level: level,
      maxHp: 180,
      speed: 150,
      attack: 22,
      defense: 6,
      expReward: 90,
      goldReward: [18, 30],
      color: 0xFF69B4,
      ai: 'ranged',
      aggroRange: 600,
      attackRange: 200,
      attackCooldown: 900,
      drops: [
        { itemId: 'wolf_fang', chance: 0.4, quantity: [2, 3] },
        { itemId: 'bow_hunting', chance: 0.1, quantity: 1 },
        { itemId: 'potion_hp_small', chance: 0.2, quantity: [1, 2] }
      ]
    });
  }
}

/**
 * Ogre - 오거 몬스터 (탱커)
 */
export class Ogre extends Monster {
  constructor(scene, x, y, level = 17) {
    super(scene, x, y, {
      type: '오거',
      level: level,
      maxHp: 500,
      speed: 80,
      attack: 40,
      defense: 20,
      expReward: 150,
      goldReward: [30, 50],
      color: 0x8B0000,
      ai: 'tank',
      aggroRange: 400,
      attackRange: 100,
      attackCooldown: 1800,
      drops: [
        { itemId: 'armor_leather', chance: 0.2, quantity: 1 },
        { itemId: 'helmet_iron', chance: 0.15, quantity: 1 },
        { itemId: 'potion_hp_small', chance: 0.4, quantity: [3, 5] },
        { itemId: 'sword_steel', chance: 0.12, quantity: 1 }
      ]
    });
  }

  /**
   * 드롭 아이템 처리
   */
  dropItems(player) {
    this.drops.forEach(drop => {
      const roll = Math.random();
      if (roll < drop.chance) {
        const quantity = Array.isArray(drop.quantity) 
          ? Phaser.Math.Between(drop.quantity[0], drop.quantity[1])
          : drop.quantity;

        // GameScene에 아이템 드롭 이벤트 발생
        player.scene.events.emit('item:drop', {
          itemId: drop.itemId,
          x: this.x,
          y: this.y,
          quantity: quantity
        });
      }
    });
  }
}

/**
 * GoldenGryphon - 황금 그리폰 (필드 보스)
 */
export class GoldenGryphon extends Monster {
  constructor(scene, x, y, level = 20) {
    super(scene, x, y, {
      type: '황금 그리폰',
      level: level,
      maxHp: 1200,
      speed: 200,
      attack: 60,
      defense: 30,
      expReward: 500,
      goldReward: [100, 200],
      color: 0xFFD700,
      ai: 'boss',
      isBoss: true,
      aggroRange: 800,
      attackRange: 150,
      attackCooldown: 800,
      phases: [
        { hpPercent: 100, speedMultiplier: 1.0, attackMultiplier: 1.0 },
        { hpPercent: 60, speedMultiplier: 1.3, attackMultiplier: 1.2 },
        { hpPercent: 30, speedMultiplier: 1.5, attackMultiplier: 1.5 }
      ],
      drops: [
        { itemId: 'sword_mithril', chance: 0.3, quantity: 1 },
        { itemId: 'armor_plate', chance: 0.25, quantity: 1 },
        { itemId: 'necklace_ruby', chance: 0.4, quantity: 1 },
        { itemId: 'potion_hp_small', chance: 1.0, quantity: [5, 10] }
      ]
    });
  }
}
