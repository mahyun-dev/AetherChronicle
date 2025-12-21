import Phaser from 'phaser';
import { Entity } from './Entity.js';
import { DEPTH } from '../config/Constants.js';
import { InventoryManager } from '../managers/InventoryManager.js';
import { QuestManager } from '../managers/QuestManager.js';
import { createSkill } from './Skill.js';
import { DataManager } from '../managers/DataManager.js';
import { EquipmentManager } from './Equipment.js';

/**
 * Player - 플레이어 캐릭터 클래스
 */
export class Player extends Entity {
  constructor(scene, x, y, characterClass = 'warrior') {
    super(scene, x, y, {
      maxHp: 100,
      maxMp: 1000, // 테스트용으로 높게 설정
      speed: 200,
      attack: 15,
      defense: 5,
      showHealthBar: false // 플레이어는 HUD에 표시
    });

    this.characterClass = characterClass;
    this.hasFusionistClassChange = false; // 퓨전리스트 전직 확인 플래그
    this.level = 30; 
    this.stats.level = this.level; // stats.level도 동기화
    this.exp = 0;
    this.gold = 0;
    this.statPoints = 1000; // 레벨업 시 얻는 스탯 포인트

    // 플레이어 스프라이트 생성 (임시로 사각형)
    this.sprite = scene.add.rectangle(0, 0, 32, 32, 0xFFD700);
    this.add(this.sprite);

    // 깊이 설정
    this.setDepth(DEPTH.ENTITIES);

    // 물리 바디 설정
    this.body.setSize(32, 32);
    this.body.setCollideWorldBounds(true);

    // 입력 설정
    this.setupInput();

    // 공격 관련
    this.canAttack = true;
    this.attackCooldown = this.characterClass === 'warrior' ? 1200 : 500; // 전사: 1.2초, 다른 직업: 0.5초

    // 콤보 시스템
    this.combo = {
      count: 0,
      maxCount: 10,
      timer: 0,
      timeout: 2000, // 2초 동안 공격 안하면 콤보 초기화
      damageMultipliers: {
        1: 1.0,   // 1타
        2: 1.05,  // 2타 (5% 증가)
        3: 1.10,  // 3타 (10% 증가)
        5: 1.20,  // 5타 (20% 증가)
        7: 1.30,  // 7타 (30% 증가)
        10: 1.50  // 10타 (50% 증가)
      }
    };

    // 스킬 쿨다운 저장
    this.skillCooldowns = new Map();
    
    // 인벤토리 초기화
    this.inventory = new InventoryManager(this);
    
    // 장비 시스템 초기화
    this.equipment = new EquipmentManager(this);
    
    // 퀘스트 시스템 초기화
    this.questManager = new QuestManager(this);
    
    // 스킬 초기화
    this.skills = {};
    this.loadSkills();
    
    // HP 변경 콜백 설정
    this.onHpChanged = () => {
      this.scene.events.emit('player:hp_changed', this.stats.hp, this.stats.maxHp);
    };
    
    // MP 변경 콜백 설정
    this.onMpChanged = () => {
      this.scene.events.emit('player:mp_changed', this.stats.mp, this.stats.maxMp);
    };
    
    // 초기 장비 지급 (테스트용)
    this.giveStarterEquipment();
    
    // 퀘스트 로드
    this.questManager.loadQuests();
  }
  
  /**
   * 초기 장비 지급
   */
  giveStarterEquipment() {
    const dataManager = DataManager.getInstance();
    const { Equipment } = require('./Equipment.js');
    const { Item } = require('./Item.js');

    // 클래스별 시작 장비
    switch (this.characterClass) {
      case 'warrior':
        // 무쇠 검 지급
        const swordData = dataManager.getEquipment('sword_iron');
        if (swordData) {
          const sword = new Equipment(swordData);
          this.inventory.addItem(sword);
        }

        // 가죽 갑옷 지급
        const armorData = dataManager.getEquipment('armor_leather');
        if (armorData) {
          const armor = new Equipment(armorData);
          this.inventory.addItem(armor);
        }
        break;

      case 'mage':
        // 견습생의 지팡이 지급
        const mageStaffData = dataManager.getEquipment('staff_apprentice');
        if (mageStaffData) {
          const mageStaff = new Equipment(mageStaffData);
          this.inventory.addItem(mageStaff);
        }

        // 천 갑옷 지급
        const clothArmorData = dataManager.getEquipment('armor_cloth');
        if (clothArmorData) {
          const clothArmor = new Equipment(clothArmorData);
          this.inventory.addItem(clothArmor);
        }
        break;

      case 'archer':
        // 사냥용 활 지급
        const bowData = dataManager.getEquipment('bow_hunting');
        if (bowData) {
          const bow = new Equipment(bowData);
          this.inventory.addItem(bow);
        }

        // 가죽 갑옷 지급
        const archerArmorData = dataManager.getEquipment('armor_leather');
        if (archerArmorData) {
          const archerArmor = new Equipment(archerArmorData);
          this.inventory.addItem(archerArmor);
        }
        break;

      case 'rogue':
        // 녹슨 단검 지급
        const daggerData = dataManager.getEquipment('dagger_rusty');
        if (daggerData) {
          const dagger = new Equipment(daggerData);
          this.inventory.addItem(dagger);
        }

        // 가죽 갑옷 지급
        const rogueArmorData = dataManager.getEquipment('armor_leather');
        if (rogueArmorData) {
          const rogueArmor = new Equipment(rogueArmorData);
          this.inventory.addItem(rogueArmor);
        }
        break;
    }

    // 공통 아이템 지급 (테스트용)
    const stoneData = dataManager.getItem('enhancement_stone_basic');
    const hpData = dataManager.getItem('potion_hp_small');
    const mpData = dataManager.getItem('potion_mp_small');

    if (stoneData) {
      const stone = new Item(stoneData);
      stone.quantity = 100;
      this.inventory.addItem(stone);
    }

    if (hpData) {
      const potion = new Item(hpData);
      potion.quantity = 100;
      this.inventory.addItem(potion);
    }

    if (mpData) {
      const mp = new Item(mpData);
      mp.quantity = 100;
      this.inventory.addItem(mp);
    }

    // 테스트용 골드 지급
    this.gold = 100000;
  }
  
  /**
   * 클래스 이름을 한국어로 반환
   */
  getClassName() {
    switch (this.characterClass) {
      case 'warrior':
        return '전사';
      case 'mage':
        return '마법사';
      case 'archer':
        return '궁수';
      case 'rogue':
        return '로그';
      case 'fusionist':
        return '퓨전리스트';
      default:
        return '플레이어';
    }
  }
  
  /**
   * 스킬 로드
   */
  loadSkills() {
    const dataManager = DataManager.getInstance();
    
    // 클래스별 스킬 로드
    let skillIds = [];
    switch (this.characterClass) {
      case 'warrior':
        skillIds = ['warrior_skill_1', 'warrior_skill_2', 'warrior_skill_3', 'warrior_skill_ultimate'];
        break;
      case 'mage':
        skillIds = ['mage_skill_1', 'mage_skill_2', 'mage_skill_3', 'mage_skill_ultimate'];
        break;
      case 'archer':
        skillIds = ['archer_skill_1', 'archer_skill_2', 'archer_skill_3', 'archer_skill_ultimate'];
        break;
      case 'rogue':
        skillIds = ['rogue_skill_1', 'rogue_skill_2', 'rogue_skill_3', 'rogue_skill_ultimate'];
        break;
      default:
        skillIds = ['warrior_skill_1', 'warrior_skill_2', 'warrior_skill_3', 'warrior_skill_ultimate'];
        break;
    }
    
    // 스킬 데이터 저장 (잠금 해제 확인용)
    this.skillData = {
      '1': dataManager.getSkill(skillIds[0]),
      '2': dataManager.getSkill(skillIds[1]),
      '3': dataManager.getSkill(skillIds[2]),
      'R': dataManager.getSkill(skillIds[3])
    };
    
    // 현재 레벨로 사용 가능한 스킬만 로드
    this.updateAvailableSkills();
  }
  
  /**
   * 레벨에 따라 사용 가능한 스킬 업데이트
   */
  updateAvailableSkills() {
    // 직업별 스킬 모듈 import
    let skillModule;
    switch (this.characterClass) {
      case 'warrior':
        skillModule = require('./skills/WarriorSkills.js');
        break;
      case 'mage':
        skillModule = require('./skills/MageSkills.js');
        break;
      case 'archer':
        skillModule = require('./skills/ArcherSkills.js');
        break;
      case 'rogue':
        skillModule = require('./skills/RogueSkills.js');
        break;
      default:
        skillModule = require('./skills/WarriorSkills.js');
        break;
    }
  }

  /**
   * 레벨에 따라 사용 가능한 스킬 업데이트
   */
  updateAvailableSkills() {
    // 스킬 1 (Lv 10)
    if (this.stats.level >= 10 && this.skillData['1'] && !this.skills['1']) {
      this.skills['1'] = this.createSkillInstance(this.skillData['1']);
      console.log('✨ 스킬 해금:', this.skillData['1'].name);
    }
    
    // 스킬 2 (Lv 15)
    if (this.stats.level >= 15 && this.skillData['2'] && !this.skills['2']) {
      this.skills['2'] = this.createSkillInstance(this.skillData['2']);
      console.log('✨ 스킬 해금:', this.skillData['2'].name);
    }
    
    // 스킬 3 (Lv 20)
    if (this.stats.level >= 20 && this.skillData['3'] && !this.skills['3']) {
      this.skills['3'] = this.createSkillInstance(this.skillData['3']);
      console.log('✨ 스킬 해금:', this.skillData['3'].name);
    }
    
    // 궁극기 (Lv 30)
    if (this.stats.level >= 30 && this.skillData['R'] && !this.skills['R']) {
      this.skills['R'] = this.createSkillInstance(this.skillData['R']);
      console.log('✨ 스킬 해금:', this.skillData['R'].name);
    }
  }
  
  /**
   * 스킬 타입에 따라 적절한 Skill 인스턴스 생성
   */
  createSkillInstance(skillData) {
    return createSkill(skillData, this.characterClass);
  }

  /**
   * 입력 설정
   */
  setupInput() {
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.wasd = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // 마우스 클릭 - 공격
    this.scene.input.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown()) {
        this.attack(pointer.worldX, pointer.worldY);
      }
    });

    // 스킬 키
    this.scene.input.keyboard.on('keydown-ONE', () => this.useSkill('1'));
    this.scene.input.keyboard.on('keydown-TWO', () => this.useSkill('2'));
    this.scene.input.keyboard.on('keydown-THREE', () => this.useSkill('3'));
    this.scene.input.keyboard.on('keydown-R', () => this.useSkill('R'));

    // 퀵슬롯
    this.scene.input.keyboard.on('keydown-Z', () => this.useQuickSlot(1));
    this.scene.input.keyboard.on('keydown-X', () => this.useQuickSlot(2));
    this.scene.input.keyboard.on('keydown-C', () => this.useQuickSlot(3));

    // 상호작용 키 (F키)
    this.scene.input.keyboard.on('keydown-F', () => this.interact());
  }

  /**
   * 매 프레임 업데이트
   */
  update(time, delta) {
    if (this.isDead) return;

    // 상태 이상 업데이트 (Entity 메서드 호출)
    this.updateEntity(time, delta);

    // 콤보 타이머 업데이트
    this.updateCombo(delta);

    this.handleMovement(delta);    
    // 스킬 쿨다운 업데이트
    Object.values(this.skills).forEach(skill => {
      skill.update(delta);
    });  }

  /**
   * 이동 처리
   */
  handleMovement(delta) {
    // 행동 불가 상태 체크
    if (!this.canAct()) {
      this.body.setVelocity(0);
      return;
    }
    
    const speed = this.getCurrentSpeed();
    this.body.setVelocity(0);

    // 이동 입력
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      this.body.setVelocityX(-speed);
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      this.body.setVelocityX(speed);
    }

    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      this.body.setVelocityY(-speed);
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      this.body.setVelocityY(speed);
    }

    // 대각선 이동 시 속도 정규화
    if (this.body.velocity.x !== 0 && this.body.velocity.y !== 0) {
      this.body.velocity.normalize().scale(speed);
    }
  }

  /**
   * 기본 공격
   */
  attack(targetX, targetY) {
    if (!this.canAttack || this.isDead || !this.canAct()) return;

    this.canAttack = false;

    // 공격 방향 계산
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    
    // 공격 이펙트 (임시 - 투사체)
    this.createProjectile(angle);

    // 쿨다운
    this.scene.time.delayedCall(this.attackCooldown, () => {
      this.canAttack = true;
    });
  }

  /**
   * 투사체 생성
   */
  createProjectile(angle) {
    const speed = 400;
    const range = 300;

    // 전사 근접 공격 처리
    if (this.characterClass === 'warrior') {
      this.performMeleeAttack(angle);
      return null; // 전사는 투사체를 발사하지 않음
    }

    let projectile;
    let projectileScale = 0.7;

    // 직업별 투사체 생성 (화살은 궁수만 사용)
    switch (this.characterClass) {
      case 'archer':
        // 궁수: 화살 이미지 사용
        projectile = this.scene.add.sprite(this.x, this.y, 'arrow');
        projectile.setRotation(angle);
        break;

      case 'mage':
        // 마법사: 마법 구슬 (빨간색, 회전 효과)
        projectile = this.scene.add.circle(this.x, this.y, 10, 0xFF4444);
        projectileScale = 1.0;
        // 마법 구슬은 회전 효과 추가
        this.scene.tweens.add({
          targets: projectile,
          angle: 360,
          duration: 1000,
          repeat: -1
        });
        break;

      case 'rogue':
        // 도적: 표창 (보라색)
        projectile = this.scene.add.circle(this.x, this.y, 6, 0xAA44FF);
        projectileScale = 0.8;
        break;

      default:
        // 기본값: 화살
        projectile = this.scene.add.sprite(this.x, this.y, 'arrow');
        projectile.setRotation(angle);
    }

    projectile.setDepth(DEPTH.PROJECTILES);
    projectile.setScale(projectileScale);

    this.scene.physics.add.existing(projectile);

    // 속도 설정
    projectile.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    // 공격력 저장
    projectile.damage = this.stats.attack;
    projectile.owner = this;

    // 일정 거리 후 제거
    this.scene.time.delayedCall(range / speed * 1000, () => {
      if (projectile && projectile.active) {
        projectile.destroy();
      }
    });

    return projectile;
  }

  /**
   * 전사 근접 공격 수행
   */
  performMeleeAttack(angle) {
    const attackRange = 120; // 사거리 120px
    const attackAngle = Math.PI / 3; // 공격 각도 60도 (좌우 30도씩)

    // 공격 범위 내 몬스터 찾기
    const monsters = this.scene.monsters.getChildren();
    let hitCount = 0;

    monsters.forEach(monster => {
      if (monster.isDead) return;

      const distance = Phaser.Math.Distance.Between(this.x, this.y, monster.x, monster.y);
      if (distance <= attackRange) {
        // 공격 방향과의 각도 차이 계산
        const monsterAngle = Phaser.Math.Angle.Between(this.x, this.y, monster.x, monster.y);
        let angleDiff = Math.abs(monsterAngle - angle);
        angleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff); // 0-π 범위로 정규화

        if (angleDiff <= attackAngle / 2) { // 공격 각도 내에 있으면
          // 피해 적용
          const comboMultiplier = this.getComboMultiplier ? this.getComboMultiplier() : 1.0;
          const finalDamage = Math.floor(this.stats.attack * comboMultiplier);

          const result = monster.takeDamage(finalDamage, this);
          this.scene.showDamageText(monster.x, monster.y - 30, result.damage, result.isCrit, result.isEvaded);

          // 콤보 증가
          if (!result.isEvaded && this.increaseCombo) {
            this.increaseCombo();
          }

          // 넉백 적용
          if (!result.isEvaded) {
            const knockbackSource = { x: this.x, y: this.y };
            monster.applyKnockback(200, 300, knockbackSource); // 약한 넉백
          }

          hitCount++;
        }
      }
    });

    // 공격 시각 효과
    this.createMeleeAttackEffect(angle);

    console.log(`⚔️ 전사 근접 공격: ${hitCount}명의 적 타격`);
  }

  /**
   * 근접 공격 시각 효과 생성
   */
  createMeleeAttackEffect(angle) {
    const centerX = this.x;
    const centerY = this.y;
    const radius = 120;

    // 검 베기 효과 - 더 자연스러운 반원
    const effect = this.scene.add.graphics();
    effect.setDepth(100);

    // 그라데이션 효과를 위한 여러 레이어
    // 외곽선 (밝은 파란색)
    effect.lineStyle(3, 0x88CCFF, 0.8);
    effect.beginPath();
    effect.arc(centerX, centerY, radius, angle - Math.PI/6, angle + Math.PI/6);
    effect.stroke();

    // 내부 채우기 (진한 파란색)
    effect.fillStyle(0x4444FF, 0.3);
    effect.beginPath();
    effect.arc(centerX, centerY, radius - 2, angle - Math.PI/6, angle + Math.PI/6);
    effect.lineTo(centerX, centerY);
    effect.closePath();
    effect.fill();

    // 중심에서 바깥으로 퍼지는 효과
    effect.fillStyle(0x6666FF, 0.2);
    effect.beginPath();
    effect.arc(centerX, centerY, radius * 0.7, angle - Math.PI/8, angle + Math.PI/8);
    effect.lineTo(centerX, centerY);
    effect.closePath();
    effect.fill();

    // 효과 애니메이션 - 더 부드럽게
    this.scene.tweens.add({
      targets: effect,
      scaleX: { from: 0.8, to: 1.3 },
      scaleY: { from: 0.8, to: 1.3 },
      alpha: { from: 1, to: 0 },
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => effect.destroy()
    });

    // 검기 라인 효과 - 더 역동적으로
    const slashLine = this.scene.add.graphics();
    slashLine.setDepth(101);

    // 메인 검기 (흰색)
    slashLine.lineStyle(6, 0xFFFFFF, 0.9);
    slashLine.beginPath();
    slashLine.moveTo(centerX, centerY);
    slashLine.lineTo(
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius
    );
    slashLine.stroke();

    // 검기 주변 빛 효과
    slashLine.lineStyle(2, 0xCCFFFF, 0.6);
    slashLine.beginPath();
    slashLine.moveTo(centerX, centerY);
    slashLine.lineTo(
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius
    );
    slashLine.stroke();

    // 검기 애니메이션
    this.scene.tweens.add({
      targets: slashLine,
      alpha: 0,
      duration: 350,
      ease: 'Quad.easeOut',
      onComplete: () => slashLine.destroy()
    });

    // 파티클 효과 추가
    this.createSlashParticles(angle);

    // 충격파 효과
    const shockwave = this.scene.add.graphics();
    shockwave.setDepth(99);
    shockwave.lineStyle(2, 0xFFFFFF, 0.4);
    shockwave.beginPath();
    shockwave.arc(centerX, centerY, 40, 0, Math.PI * 2);
    shockwave.stroke();

    this.scene.tweens.add({
      targets: shockwave,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 300,
      onComplete: () => shockwave.destroy()
    });
  }

  /**
   * 검 베기 파티클 효과
   */
  createSlashParticles(angle) {
    const particleCount = 8;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = this.scene.add.circle(
        this.x + Math.cos(angle) * (60 + Math.random() * 60),
        this.y + Math.sin(angle) * (60 + Math.random() * 60),
        2 + Math.random() * 3,
        0xFFFFFF
      );
      particle.setDepth(102);

      // 랜덤 방향으로 퍼지게
      const particleAngle = angle + (Math.random() - 0.5) * Math.PI / 2;
      const speed = 50 + Math.random() * 100;

      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(particleAngle) * speed,
        y: particle.y + Math.sin(particleAngle) * speed,
        alpha: 0,
        scale: 0,
        duration: 400 + Math.random() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });

      particles.push(particle);
    }
  }

  /**
   * 스킬 로드
   */
  /**
   * 스킬 사용
   */
  useSkill(skillSlot) {
    const skill = this.skills[skillSlot];
    
    if (!skill) {
      const skillData = this.skillData[skillSlot];
      if (skillData && skillData.unlockLevel) {
        console.log(`❌ 스킬 잠김: Lv ${skillData.unlockLevel}에 해금됩니다.`);
      } else {
        console.log(`스킬 슬롯 ${skillSlot}에 스킬이 없습니다.`);
      }
      return false;
    }
    
    return skill.use(this);
  }

  /**
   * 퀵슬롯 사용
   */
  useQuickSlot(slot) {
    // 인벤토리의 퀵슬롯 사용 (1부터 시작하므로 -1)
    const success = this.inventory.useQuickSlot(slot - 1);
    
    if (!success) {
      console.log(`퀵슬롯 ${slot}이(가) 비어있거나 사용할 수 없습니다.`);
    }
  }

  /**
   * 회복 텍스트 표시
   */
  showHealText(amount) {
    const text = this.scene.add.text(this.x, this.y - 30, `+${amount}`, {
      font: 'bold 20px Arial',
      fill: '#00FF00',
      stroke: '#000000',
      strokeThickness: 3
    });
    text.setOrigin(0.5);
    text.setDepth(DEPTH.UI);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => text.destroy()
    });
  }

  /**
   * 경험치 획득
   */
  gainExp(amount) {
    this.exp += amount;
    
    // 레벨업 체크
    const requiredExp = this.getRequiredExp();
    if (this.exp >= requiredExp) {
      this.levelUp();
    }
    
    // UI 업데이트 이벤트
    this.scene.events.emit('player:exp_changed', this.exp, requiredExp);
  }

  /**
   * 필요 경험치 계산
   */
  getRequiredExp() {
    const L = this.level;
    return 100 + (L * 50) + (L * L * 5);
  }

  /**
   * 레벨업
   */
  levelUp() {
    this.level += 1;
    this.stats.level = this.level;
    this.exp = 0; // 경험치 초기화
    
    // 스탯 포인트 지급 (레벨당 5포인트)
    this.statPoints += 5;
    
    // 기본 스탯 증가
    this.stats.maxHp += 10;
    this.stats.hp = this.stats.maxHp; // HP 회복
    this.stats.maxMp += 5;
    this.stats.mp = this.stats.maxMp; // MP 회복
    this.stats.attack += 2;
    this.stats.defense += 1;
    
    console.log(`[Player] 레벨업! Lv.${this.level}, 스탯 포인트 +5`);
    
    // 스킬 해금 확인
    this.updateAvailableSkills();
    
    // 레벨업 이벤트
    this.scene.events.emit('player:level_up', this.level);
    
    // HP/MP 변경 이벤트
    this.scene.events.emit('player:hp_changed', this.stats.hp, this.stats.maxHp);
    this.scene.events.emit('player:mp_changed', this.stats.mp, this.stats.maxMp);
  }

  /**
   * 레벨업 이펙트
   */
  showLevelUpEffect() {
    // 빛나는 효과
    const circle = this.scene.add.circle(this.x, this.y, 50, 0xFFD700, 0.5);
    circle.setDepth(DEPTH.EFFECTS);
    
    this.scene.tweens.add({
      targets: circle,
      scale: 3,
      alpha: 0,
      duration: 1000,
      onComplete: () => circle.destroy()
    });
  }

  /**
   * 골드 획득
   */
  gainGold(amount) {
    this.gold += amount;
    this.scene.events.emit('player:gold_changed', this.gold);
  }

  /**
   * 사망 시
   */
  onDeath() {
    console.log('플레이어 사망!');
    
    // 사망 애니메이션
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      angle: 90,
      duration: 1000,
      onComplete: () => {
        // 게임 오버 화면 표시 (구현 예정)
        console.log('게임 오버');
      }
    });
  }

  /**
   * 피해 받았을 때
   */
  onDamaged(damage) {
    super.onDamaged(damage);
    
    // HP 변경 이벤트
    this.scene.events.emit('player:hp_changed', this.stats.hp, this.stats.maxHp);
    
    // 피해 숫자 표시
    this.showDamageText(damage);
  }

  /**
   * 피해 숫자 표시
   */
  showDamageText(damage) {
    const text = this.scene.add.text(this.x, this.y - 30, `-${damage}`, {
      font: 'bold 20px Arial',
      fill: '#FF0000',
      stroke: '#000000',
      strokeThickness: 3
    });
    text.setOrigin(0.5);
    text.setDepth(DEPTH.UI);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => text.destroy()
    });
  }

  /**
   * 콤보 업데이트
   */
  updateCombo(delta) {
    if (this.combo.count > 0 && this.combo.timer > 0) {
      this.combo.timer -= delta;
      
      // 타이머 종료 시 콤보 초기화
      if (this.combo.timer <= 0) {
        this.resetCombo();
      }
    }
  }

  /**
   * 콤보 증가
   */
  increaseCombo() {
    this.combo.count = Math.min(this.combo.count + 1, this.combo.maxCount);
    this.combo.timer = this.combo.timeout;
    
    // 콤보 이벤트 발생
    this.scene.events.emit('player:combo_changed', this.combo.count, this.getComboMultiplier());
    
    // 콤보 사운드 효과 (TODO)
    if (this.combo.count >= 5) {
      console.log(`🔥 ${this.combo.count} 콤보! (${Math.floor(this.getComboMultiplier() * 100)}% 대미지)`);
    }
  }

  /**
   * 콤보 초기화
   */
  resetCombo() {
    if (this.combo.count > 0) {
      console.log(`💔 콤보 종료: ${this.combo.count}연타`);
      this.combo.count = 0;
      this.combo.timer = 0;
      this.scene.events.emit('player:combo_changed', 0, 1.0);
    }
  }

  /**
   * 현재 콤보 대미지 배율
   */
  getComboMultiplier() {
    if (this.combo.count === 0) return 1.0;
    
    // 가장 가까운 단계의 배율 찾기
    const multipliers = this.combo.damageMultipliers;
    let currentMultiplier = 1.0;
    
    for (const [threshold, multiplier] of Object.entries(multipliers)) {
      if (this.combo.count >= parseInt(threshold)) {
        currentMultiplier = multiplier;
      }
    }
    
    return currentMultiplier;
  }

  /**
   * 상호작용
   */
  interact() {
    // 가까운 NPC나 오브젝트 찾기
    const interactables = this.scene.children.list.filter(obj => 
      obj.interactable && 
      Phaser.Math.Distance.Between(this.x, this.y, obj.x, obj.y) < 100
    );

    if (interactables.length > 0) {
      // 가장 가까운 오브젝트와 상호작용
      const target = interactables[0];
      if (target.onInteract) {
        target.onInteract(this);
      }
      console.log('[Player] 상호작용:', target.constructor.name);
    } else {
      console.log('[Player] 상호작용할 오브젝트가 없습니다.');
    }
  }

  /**
   * 스탯 포인트 사용 (STR, DEX, INT, VIT)
   */
  spendStatPoint(statType, amount = 1) {
    if (this.statPoints < amount) {
      console.log('[Player] 스탯 포인트가 부족합니다.');
      return false;
    }
    
    if (!['str', 'dex', 'int', 'vit'].includes(statType)) {
      console.log('[Player] 잘못된 스탯 타입입니다.');
      return false;
    }
    
    // 스탯 증가
    this.stats[statType] += amount;
    this.statPoints -= amount;
    
    // 스탯별 추가 효과
    switch (statType) {
      case 'str':
        this.stats.attack += amount; // STR당 공격력 +1
        break;
      case 'vit':
        this.stats.maxHp += amount * 5; // VIT당 HP +5
        this.stats.hp += amount * 5; // 현재 HP도 증가
        break;
      case 'int':
        this.stats.maxMp += amount * 3; // INT당 MP +3
        this.stats.mp += amount * 3; // 현재 MP도 증가
        
        // INT 10 달성 시 메이지 -> 퓨전리스트 전직 확인
        if (this.characterClass === 'mage' && this.stats.int >= 10 && !this.hasFusionistClassChange) {
          this.hasFusionistClassChange = true; // 중복 확인 방지
          this.scene.events.emit('player:fusionist_class_change_available');
        }
        break;
      case 'dex':
        this.stats.critRate += amount * 0.5; // DEX당 치명타 확률 +0.5%
        break;
    }
    
    console.log(`[Player] ${statType.toUpperCase()} +${amount}, 스탯 포인트: ${this.statPoints}`);
    
    // 이벤트 발생
    this.scene.events.emit('player:stats_changed');
    this.scene.events.emit('player:hp_changed', this.stats.hp, this.stats.maxHp);
    this.scene.events.emit('player:mp_changed', this.stats.mp, this.stats.maxMp);
    
    return true;
  }

  /**
   * 퓨전리스트로 클래스 변경
   */
  changeToFusionist() {
    if (this.characterClass !== 'mage') {
      console.log('[Player] 메이지 클래스만 퓨전리스트로 전직할 수 있습니다.');
      return false;
    }

    this.characterClass = 'fusionist';
    
    // 퓨전리스트 스킬 로드
    this.loadSkills();
    
    // 이벤트 발생 (UI 업데이트용)
    this.scene.events.emit('player:class_changed', 'fusionist');
    
    console.log('[Player] 퓨전리스트로 전직했습니다!');
    return true;
  }
}
