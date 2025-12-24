import Phaser from 'phaser';
import { InventoryUI } from '../ui/InventoryUI.js';
import { EquipmentUI } from '../ui/EquipmentUI.js';
import { EnhancementUI } from '../ui/EnhancementUI.js';
import { QuestUI } from '../ui/QuestUI.js';
import { StatsUI } from '../ui/StatsUI.js';
import { FusionSkillUI } from '../ui/FusionSkillUI.js';
import { FusionUI } from '../ui/FusionUI.js';
import { DataManager } from '../managers/DataManager.js';

/**
 * UIScene - UI 오버레이 씬
 * HUD, 인벤토리, 스킬창 등 모든 UI 관리
 */
export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
    this.inventoryUI = null;
    this.equipmentUI = null;
    this.enhancementUI = null;
    this.questUI = null;
    this.statsUI = null;
    this.fusionSkillUI = null;
    this.fusionUI = null;
  }

  create() {
    console.log('[UIScene] UI 초기화');

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // HUD 생성
    this.createHUD();

    // 키 입력 설정
    this.setupInput();

    // GameScene 이벤트 리스너
    const gameScene = this.scene.get('GameScene');
    
    // GameScene의 플레이어가 이미 생성되었다면 즉시 설정
    if (gameScene && gameScene.player) {
      this.setPlayer(gameScene.player);
    }
    
    gameScene.events.on('player:hp_changed', (hp, maxHp) => {
      this.updateHP(hp, maxHp);
    });

    gameScene.events.on('player:mp_changed', (mp, maxMp) => {
      this.updateMP(mp, maxMp);
    });

    gameScene.events.on('player:exp_changed', (exp, requiredExp) => {
      this.updateEXP(exp, requiredExp);
    });

    gameScene.events.on('player:level_up', (level) => {
      this.playerNameText.setText(`[Lv ${level}] ${this.player.getClassName()}`);
    });

    gameScene.events.on('player:gold_changed', (gold) => {
      this.goldText.setText(`💰 골드: ${gold}`);
    });
    
    gameScene.events.on('player:combo_changed', (combo) => {
      this.updateCombo(combo);
    });
    
    // 융합술사 전직 이벤트 리스너
    gameScene.events.on('player:fusionist_class_change_available', () => {
      this.showFusionistClassChangeDialog();
    });
    
    // 퀘스트 이벤트 리스너
    gameScene.events.on('quest:accepted', (quest) => {
      this.updateQuestTracker();
    });
    
    gameScene.events.on('quest:progress', (quest, objective) => {
      this.updateQuestTracker();
    });
    
    gameScene.events.on('quest:completed', (quest) => {
      this.updateQuestTracker();
    });
    
    // 플레이어 설정 이벤트 (GameScene에서 발생)
    gameScene.events.on('player:ready', (player) => {
      this.setPlayer(player);
    });
  }

  /**
   * 플레이어 설정 (인벤토리 UI 생성)
   */
  setPlayer(player) {
    console.log('[UIScene] setPlayer 호출됨, player:', player);
    this.player = player;
    
    // 플레이어 레벨과 스탯 초기화 (UI가 생성된 경우에만)
    if (this.playerNameText) {
      this.playerNameText.setText(`[Lv ${player.level}] ${player.getClassName()}`);
    }
    if (this.updateHP) {
      this.updateHP(player.stats.hp, player.stats.maxHp);
    }
    if (this.updateMP) {
      this.updateMP(player.stats.mp, player.stats.maxMp);
    }
    if (this.updateEXP) {
      const requiredExp = player.getRequiredExp();
      this.updateEXP(player.exp, requiredExp);
    }
    if (this.goldText) {
      this.goldText.setText(`💰 골드: ${player.gold}`);
    }
    
    // 인벤토리 UI 생성
    this.inventoryUI = new InventoryUI(this, player);
    console.log('[UIScene] inventoryUI 생성 완료:', this.inventoryUI);
    
    // 장비 UI 생성
    this.equipmentUI = new EquipmentUI(this, player, 50, 100);
    console.log('[UIScene] equipmentUI 생성 완료:', this.equipmentUI);
    
    // 강화 UI 생성
    this.enhancementUI = new EnhancementUI(this, player, this.cameras.main.width / 2, this.cameras.main.height / 2);
    console.log('[UIScene] enhancementUI 생성 완료:', this.enhancementUI);
    
    // 퀘스트 UI 생성
    this.questUI = new QuestUI(this);
    console.log('[UIScene] questUI 생성 완료:', this.questUI);
    
    // 스탯 UI 생성
    this.statsUI = new StatsUI(this, player, this.cameras.main.width * 0.7, this.cameras.main.height * 0.1);
    console.log('[UIScene] statsUI 생성 완료:', this.statsUI);
    
    // 융합 스킬 UI 생성 (융합술사 전용)
    this.fusionSkillUI = new FusionSkillUI(this, player);
    console.log('[UIScene] fusionSkillUI 생성 완료:', this.fusionSkillUI);
    
    // 융합 UI 생성 (융합술사 전용)
    if (player.characterClass === 'fusionist') {
      this.fusionUI = new FusionUI(this.scene.get('GameScene'), player);
      console.log('[UIScene] fusionUI 생성 완료:', this.fusionUI);
    }
    
    // 스킬 변경 이벤트 리스너
    player.scene.events.on('player:skill_changed', (slotKey, skill) => {
      this.updateSkillSlot(slotKey, skill);
    });
    
    // 초기 스킬 슬롯 업데이트
    this.updateAllSkillSlots();
    
    console.log('[UIScene] 플레이어 설정 완료 - 인벤토리 UI 준비됨');
  }
  
  update() {
    // 스킬 쿨다운 업데이트
    const delta = this.game.loop.delta;
    
    // 스킬 쿨다운 UI 업데이트
    if (this.player && this.player.skills && this.skillSlots) {
      this.skillSlots.forEach(slotUI => {
        const skill = this.player.skills[slotUI.key];
        
        if (skill) {
          // 스킬 쿨다운 업데이트
          skill.update(delta);
          // 스킬이 있는 경우 아이콘 표시
          const iconKey = skill.id;
          if (this.textures.exists(iconKey)) {
            // 기존 아이콘이 있으면 제거
            if (slotUI.icon && typeof slotUI.icon.destroy === 'function') {
              slotUI.icon.destroy();
            }
            // 새 아이콘 생성
            slotUI.icon = this.add.image(slotUI.x, slotUI.y, iconKey);
            slotUI.icon.setDisplaySize(45, 45);
            slotUI.icon.setVisible(true);
            
            // 쿨타임 텍스트를 아이콘 위로 가져옴
            slotUI.cooldownText.setDepth(10);
          } else {
            // 아이콘이 없으면 기본 사각형 표시
            if (slotUI.icon && typeof slotUI.icon.destroy === 'function') {
              slotUI.icon.destroy();
              slotUI.icon = this.add.rectangle(slotUI.x, slotUI.y, 45, 45, 0x666666, 0.5);
            }
            slotUI.icon.setVisible(true);
            
            // 쿨타임 텍스트를 아이콘 위로 가져옴
            slotUI.cooldownText.setDepth(10);
          }
          
          if (skill.currentCooldown > 0) {
            // 쿨다운 중
            slotUI.cooldownOverlay.setVisible(true);
            slotUI.cooldownOverlay.setDepth(5); // 아이콘 위
            slotUI.cooldownText.setText(Math.ceil(skill.currentCooldown / 1000).toString());
            slotUI.cooldownText.setDepth(10); // 가장 위
            
            // 쿨다운 진행도
            const ratio = skill.getCooldownRatio();
            slotUI.cooldownOverlay.setScale(1, ratio);
          } else {
            // 쿨다운 끝
            slotUI.cooldownOverlay.setVisible(false);
            slotUI.cooldownText.setText('');
          }
        } else {
          // 스킬이 없는 경우 아이콘 숨김
          slotUI.icon.setVisible(false);
          slotUI.cooldownOverlay.setVisible(false);
          slotUI.cooldownText.setText('');
        }
      });
    }
    
    // 미니맵 업데이트
    this.updateMinimap();
    
    // 퀘스트 트래커 업데이트
    this.updateQuestTracker();
  }

  createHUD() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 좌측 상단 - 플레이어 정보
    const playerInfoBg = this.add.rectangle(150, 40, 280, 120, 0x000000, 0.6);
    playerInfoBg.setOrigin(0.5);

    this.playerNameText = this.add.text(20, 15, '[Lv 1] 플레이어', {
      font: 'bold 16px Arial',
      fill: '#FFD700'
    });

    // HP 바
    this.createBar(20, 40, 250, 12, 0xFF0000, 'HP');
    
    // MP 바
    this.createBar(20, 58, 250, 12, 0x0080FF, 'MP');

    // EXP 바
    this.createBar(20, 76, 250, 12, 0x00FF00, 'EXP');

    // 우측 상단 - 원형 미니맵
    this.createMinimap(width - 100, 100);
    
    // 미니맵 아래 - 퀘스트 트래커
    this.createQuestTracker(width - 60, 260);

    // 하단 중앙 - 스킬바
    const skillBarY = height - 60;
    this.skillSlots = [];
    
    for (let i = 0; i < 4; i++) {
      const x = width / 2 - 100 + (i * 60);
      const skillKey = ['1', '2', '3', 'R'][i];
      
      const skillSlot = this.add.rectangle(x, skillBarY, 50, 50, 0x333333, 0.8);
      skillSlot.setStrokeStyle(2, 0xFFD700);
      
      const keyText = this.add.text(x, skillBarY, skillKey, {
        font: 'bold 16px Arial',
        fill: '#FFFFFF'
      }).setOrigin(0.5);
      
      // 쿨다운 오버레이
      const cooldownOverlay = this.add.rectangle(x, skillBarY, 50, 50, 0x000000, 0.7);
      cooldownOverlay.setVisible(false);
      
      const cooldownText = this.add.text(x, skillBarY, '', {
        font: 'bold 14px Arial',
        fill: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      // 스킬 아이콘 (초기에는 빈 사각형)
      const skillIcon = this.add.rectangle(x, skillBarY, 45, 45, 0x666666, 0.5);
      skillIcon.setVisible(false);
      
      this.skillSlots.push({
        key: skillKey,
        slot: skillSlot,
        keyText: keyText,
        cooldownOverlay: cooldownOverlay,
        cooldownText: cooldownText,
        icon: skillIcon,
        x: x,
        y: skillBarY
      });
    }

    // 좌측 하단 - 골드
    this.goldText = this.add.text(20, height - 30, '💰 골드: 0', {
      font: '16px Arial',
      fill: '#FFD700',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });

    // 중앙 상단 - 콤보 UI
    this.createComboUI();

    // 우측 하단 - 메뉴 아이콘
    const menuIcons = ['I', 'E', 'K', 'L', 'N', 'H'];
    const iconLabels = ['인벤토리', '장비', '스킬', '퀘스트', '스탯', '강화'];
    
    for (let i = 0; i < menuIcons.length; i++) {
      const x = width - 300 + (i * 50);
      const y = height - 40;
      
      const icon = this.add.rectangle(x, y, 40, 40, 0x333333, 0.8);
      icon.setStrokeStyle(2, 0xFFD700);
      icon.setInteractive({ useHandCursor: true });
      
      const iconText = this.add.text(x, y, menuIcons[i], {
        font: 'bold 16px Arial',
        fill: '#FFFFFF'
      }).setOrigin(0.5);
      
      // 호버 효과
      icon.on('pointerover', () => {
        icon.setFillStyle(0x444444, 0.9);
        // 툴팁 표시 (간단히)
        const tooltip = this.add.text(x, y - 50, iconLabels[i], {
          font: '14px Arial',
          fill: '#FFFFFF',
          backgroundColor: '#000000',
          padding: { x: 6, y: 3 }
        }).setOrigin(0.5);
        
        icon.tooltip = tooltip;
      });
      
      icon.on('pointerout', () => {
        icon.setFillStyle(0x333333, 0.8);
        if (icon.tooltip) {
          icon.tooltip.destroy();
          icon.tooltip = null;
        }
      });
      
      icon.on('pointerdown', () => {
        if (menuIcons[i] === 'I' && this.inventoryUI) {
          this.inventoryUI.toggle();
        }else if (menuIcons[i] === 'E' && this.equipmentUI) {
          this.equipmentUI.toggle();
        }else if (menuIcons[i] === 'K') {
          console.log('스킬창 열기 (구현 예정)');
        }else if (menuIcons[i] === 'H' && this.enhancementUI) { 
          this.enhancementUI.toggle();
        }else if (menuIcons[i] === 'L' && this.questUI) {
          this.questUI.toggle();
        }else if (menuIcons[i] === 'N' && this.statsUI) {
          this.statsUI.toggle();
        }else if (menuIcons[i] === 'R') {
          if (this.player && this.player.characterClass === 'fusionist' && this.fusionUI) {
            this.fusionUI.toggle();
          }
          // 융합술사가 아니면 아무 동작 없음
        }
      });
    }
  }

  createBar(x, y, width, height, color, label) {
    // 바 배경
    const barBg = this.add.rectangle(x, y, width, height, 0x333333);
    barBg.setOrigin(0);

    // 바 게이지
    const bar = this.add.rectangle(x, y, width, height, color);
    bar.setOrigin(0);

    // 텍스트
    const text = this.add.text(x + 5, y - 1, `${label}: 100/100`, {
      font: '11px Arial',
      fill: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2
    });

    // 나중에 업데이트할 수 있도록 저장
    if (label === 'HP') {
      this.hpBar = bar;
      this.hpText = text;
    } else if (label === 'MP') {
      this.mpBar = bar;
      this.mpText = text;
    } else if (label === 'EXP') {
      this.expBar = bar;
      this.expText = text;
    }
  }

  /**
   * 원형 미니맵 생성
   */
  createMinimap(x, y) {
    const radius = 80;
    
    // 원형 마스크 생성
    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillCircle(x, y, radius);
    
    const mask = maskShape.createGeometryMask();
    
    // 미니맵 배경 (반투명)
    this.minimapBg = this.add.circle(x, y, radius, 0x1a1a1a, 0.7);
    this.minimapBg.setStrokeStyle(3, 0xFFD700);
    
    // 미니맵 컨테이너
    this.minimapContainer = this.add.container(x, y);
    this.minimapContainer.setMask(mask);
    
    // 맵 그래픽 (실제 맵을 축소하여 표시)
    this.minimapMapGraphics = this.add.graphics();
    this.minimapContainer.add(this.minimapMapGraphics);
    
    // 플레이어 위치 표시 (빨간 점) - 크기 키워서 가시성 향상
    this.minimapPlayer = this.add.circle(0, 0, 6, 0xFF0000, 0.9);
    this.minimapPlayer.setStrokeStyle(1, 0xFFFFFF);
    this.minimapContainer.add(this.minimapPlayer);
    
    // 포탈 표시를 위한 컨테이너
    this.minimapPortals = [];
    
    // 미니맵 텍스트 (현재 맵 이름 표시)
    this.minimapText = this.add.text(x, y + radius + 15, '마을', {
      font: 'bold 12px Arial',
      fill: '#FFD700'
    }).setOrigin(0.5);
    
    console.log('[UIScene] 원형 미니맵 생성 완료');
  }

  /**
   * 퀘스트 트래커 생성
   */
  createQuestTracker(x, y) {
    // 퀘스트 항목들 (최대 3개) - 제목 텍스트 제거
    this.questTrackerItems = [];
    
    for (let i = 0; i < 3; i++) {
      const itemY = y - 30 + (i * 45);
      
      // 퀘스트 이름
      const nameText = this.add.text(x - 90, itemY, '', {
        font: 'bold 12px Arial',
        fill: '#FFFFFF',
        wordWrap: { width: 180 }
      });
      
      // 목표 1
      const objective1Text = this.add.text(x - 90, itemY + 15, '', {
        font: '10px Arial',
        fill: '#AAAAAA'
      });
      
      // 목표 2
      const objective2Text = this.add.text(x - 90, itemY + 28, '', {
        font: '10px Arial',
        fill: '#AAAAAA'
      });
      
      this.questTrackerItems.push({
        nameText,
        objective1Text,
        objective2Text,
        quest: null
      });
      
      nameText.setVisible(false);
      objective1Text.setVisible(false);
      objective2Text.setVisible(false);
    }
    
    console.log('[UIScene] 퀘스트 트래커 생성 완료');
  }

  setupInput() {
    // I 키 - 인벤토리
    this.input.keyboard.on('keydown-I', () => {
      console.log('[UIScene] I키 입력 감지, inventoryUI:', this.inventoryUI);
      if (this.inventoryUI) {
        this.inventoryUI.toggle();
      } else {
        console.warn('[UIScene] inventoryUI가 아직 초기화되지 않았습니다!');
      }
    });

    // E 키 - 장비창
    this.input.keyboard.on('keydown-E', () => {
      console.log('[UIScene] E키 입력 감지, equipmentUI:', this.equipmentUI);
      if (this.equipmentUI) {
        this.equipmentUI.toggle();
      } else {
        console.warn('[UIScene] equipmentUI가 아직 초기화되지 않았습니다!');
      }
    });

    // K 키 - 스킬창 (GameScene에서 처리)
    this.input.keyboard.on('keydown-K', () => {
      // GameScene의 fusionUI가 열려있으면 GameScene에서 처리하도록 하고 여기서는 아무것도 하지 않음
      const gameScene = this.scene.get('GameScene');
      if (gameScene && gameScene.fusionUI && gameScene.fusionUI.isOpen) {
        console.log('[UIScene] K키 - FusionUI가 열려있어 GameScene에서 처리');
        return;
      }

      // FusionSkillUI의 스킬 선택기가 열려있으면 스킬 선택기만 닫기
      if (this.fusionSkillUI && this.fusionSkillUI.hasSkillSelectorOpen()) {
        this.fusionSkillUI.closeSkillSelector();
        console.log('[UIScene] K키 - FusionSkillUI 스킬 선택기 닫기');
        return;
      }

      console.log('[UIScene] K키 입력 감지, fusionSkillUI:', this.fusionSkillUI);
      if (this.fusionSkillUI && this.player && this.player.characterClass === 'fusionist') {
        this.fusionSkillUI.toggle();
      } else if (this.player && this.player.characterClass !== 'fusionist') {
        console.log('[UIScene] 융합술사만 스킬 관리가 가능합니다.');
      } else {
        console.warn('[UIScene] fusionSkillUI가 아직 초기화되지 않았습니다!');
      }
    });

    // H 키 - 강화창
    this.input.keyboard.on('keydown-H', () => {
      console.log('[UIScene] H키 입력 감지, enhancementUI:', this.enhancementUI);
      if (this.enhancementUI) {
        this.enhancementUI.toggle();
      } else {
        console.warn('[UIScene] enhancementUI가 아직 초기화되지 않았습니다!');
      }
    });

    // L 키 - 퀘스트 로그
    this.input.keyboard.on('keydown-L', () => {
      console.log('[UIScene] L키 입력 감지, questUI:', this.questUI);
      if (this.questUI) {
        this.questUI.toggle();
      } else {
        console.warn('[UIScene] questUI가 아직 초기화되지 않았습니다!');
      }
    });

    // M 키 - 월드맵
    this.input.keyboard.on('keydown-M', () => {
      console.log('월드맵 열기 (구현 예정)');
    });

    // N 키 - 스탯창
    this.input.keyboard.on('keydown-N', () => {
      console.log('[UIScene] N키 입력 감지, statsUI:', this.statsUI);
      if (this.statsUI) {
        this.statsUI.toggle();
      } else {
        console.warn('[UIScene] statsUI가 아직 초기화되지 않았습니다!');
      }
    });

    // R 키 - 융합창 (융합술사 전용)
    this.input.keyboard.on('keydown-R', () => {
      if (this.player && this.player.characterClass === 'fusionist' && this.fusionUI) {
        this.fusionUI.toggle();
      }
      // 융합술사가 아니면 아무 동작 없음
    });
  }

  // HP/MP 업데이트 메서드
  updateHP(current, max) {
    if (this.hpBar && this.hpText) {
      const percent = current / max;
      this.hpBar.scaleX = percent;
      this.hpText.setText(`HP: ${current}/${max}`);
    }
  }

  updateMP(current, max) {
    if (this.mpBar && this.mpText) {
      const percent = current / max;
      this.mpBar.scaleX = percent;
      this.mpText.setText(`MP: ${current}/${max}`);
    }
  }

  updateEXP(current, max) {
    if (this.expBar && this.expText) {
      const percent = current / max;
      this.expBar.scaleX = percent;
      this.expText.setText(`EXP: ${current}/${max}`);
    }
  }

  createComboUI() {
    const width = this.cameras.main.width;
    
    // 콤보 컨테이너 (중앙 상단)
    this.comboContainer = this.add.container(width / 2, 100);
    this.comboContainer.setAlpha(0); // 초기에는 숨김
    
    // 배경
    const comboBg = this.add.rectangle(0, 0, 200, 80, 0x000000, 0.7);
    comboBg.setStrokeStyle(3, 0xFF6B00);
    
    // 콤보 카운트 텍스트
    this.comboCountText = this.add.text(0, -15, '0 HIT', {
      font: 'bold 36px Arial',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // 콤보 배율 텍스트
    this.comboMultiplierText = this.add.text(0, 20, 'x1.0', {
      font: 'bold 20px Arial',
      fill: '#FF6B00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    this.comboContainer.add([comboBg, this.comboCountText, this.comboMultiplierText]);
  }

  updateCombo(combo) {
    if (!this.comboContainer) return;
    
    if (combo.count > 0) {
      // 콤보 활성화
      this.comboCountText.setText(`${combo.count} HIT`);
      
      const multiplier = this.getMultiplierForCombo(combo.count);
      this.comboMultiplierText.setText(`x${multiplier.toFixed(2)}`);
      
      // 페이드 인
      if (this.comboContainer.alpha === 0) {
        this.tweens.add({
          targets: this.comboContainer,
          alpha: 1,
          duration: 200,
          ease: 'Power2'
        });
      }
      
      // 펄스 효과
      this.tweens.add({
        targets: this.comboCountText,
        scale: { from: 1.2, to: 1.0 },
        duration: 150,
        ease: 'Back.out'
      });
      
      // 마일스톤 효과
      if (combo.count === 3 || combo.count === 5 || combo.count === 10) {
        this.showComboMilestone(combo.count, multiplier);
      }
    } else {
      // 콤보 리셋 - 페이드 아웃
      this.tweens.add({
        targets: this.comboContainer,
        alpha: 0,
        duration: 300,
        ease: 'Power2'
      });
    }
  }

  showComboMilestone(count, multiplier) {
    const width = this.cameras.main.width;
    
    // 화면 중앙에 큰 텍스트
    const milestoneText = this.add.text(width / 2, 250, `${count} HIT COMBO!`, {
      font: 'bold 48px Arial',
      fill: '#FFD700',
      stroke: '#FF6B00',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    const multiplierText = this.add.text(width / 2, 310, `DAMAGE x${multiplier.toFixed(2)}`, {
      font: 'bold 32px Arial',
      fill: '#FF6B00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // 애니메이션
    this.tweens.add({
      targets: [milestoneText, multiplierText],
      scale: { from: 0.5, to: 1.5 },
      alpha: { from: 1, to: 0 },
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        milestoneText.destroy();
        multiplierText.destroy();
      }
    });
    
    // 배경 플래시
    const flash = this.add.rectangle(width / 2, 280, width, 200, 0xFF6B00, 0.3);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => flash.destroy()
    });
  }

  getMultiplierForCombo(count) {
    // Player.js의 damageMultipliers 로직과 동일
    const multipliers = {
      1: 1.0,
      2: 1.05,
      3: 1.10,
      5: 1.20,
      7: 1.30,
      10: 1.50
    };
    
    let currentMultiplier = 1.0;
    for (const [threshold, multiplier] of Object.entries(multipliers)) {
      if (count >= parseInt(threshold)) {
        currentMultiplier = multiplier;
      }
    }
    
    return currentMultiplier;
  }

  /**
   * 미니맵 업데이트
   */
  updateMinimap() {
    if (!this.player || !this.minimapMapGraphics || !this.minimapPlayer) {
      console.warn('[Minimap] Required objects not found');
      return;
    }

    const gameScene = this.scene.get('GameScene');
    if (!gameScene || !gameScene.currentMap) {
      console.warn('[Minimap] GameScene or currentMap not found');
      return;
    }

    // 맵 크기 (스케일링 적용된 실제 크기 사용)
    const mapWidth = gameScene.actualMapWidth || gameScene.currentMap.widthInPixels * 2;
    const mapHeight = gameScene.actualMapHeight || gameScene.currentMap.heightInPixels * 2;

    // 미니맵 스케일 (맵을 미니맵 크기에 맞춤)
    const minimapRadius = 80;
    const scale = (minimapRadius * 2) / Math.max(mapWidth, mapHeight);

    // 플레이어 위치를 미니맵 좌표로 변환
    // 맵의 중심을 기준으로 상대 위치 계산
    const playerMapX = (this.player.x - mapWidth / 2) * scale;
    const playerMapY = (this.player.y - mapHeight / 2) * scale;

    // 미니맵 반지름 내로 제한
    const distance = Math.sqrt(playerMapX * playerMapX + playerMapY * playerMapY);
    const maxRadius = minimapRadius - 10; // 여유 공간 더 확보

    let finalX = playerMapX;
    let finalY = playerMapY;

    if (distance > maxRadius) {
      const ratio = maxRadius / distance;
      finalX *= ratio;
      finalY *= ratio;
    }

    this.minimapPlayer.setPosition(finalX, finalY);
    
    // 포탈 표시 업데이트
    this.updateMinimapPortals(gameScene, scale, minimapRadius);
    
    // 미니맵 텍스트 업데이트 (현재 맵 이름)
    if (this.minimapText) {
      let mapName = gameScene.currentMapName;
      if (mapName === 'town') mapName = '마을';
      else if (mapName === 'field') mapName = '필드';
      this.minimapText.setText(mapName);
    }
  }

  /**
   * 미니맵 포탈 표시 업데이트
   */
  updateMinimapPortals(gameScene, scale, minimapRadius) {
    // 기존 포탈 표시 제거
    this.minimapPortals.forEach(portal => portal.destroy());
    this.minimapPortals = [];

    // GameScene에서 포탈 찾기
    const portals = gameScene.children.list.filter(child => child.portalData);
    
    portals.forEach(portal => {
      // 포탈 위치를 미니맵 좌표로 변환
      const portalMapX = (portal.x - gameScene.actualMapWidth / 2) * scale;
      const portalMapY = (portal.y - gameScene.actualMapHeight / 2) * scale;
      
      // 미니맵 반지름 내로 제한
      const distance = Math.sqrt(portalMapX * portalMapX + portalMapY * portalMapY);
      const maxRadius = minimapRadius - 5;
      
      let finalX = portalMapX;
      let finalY = portalMapY;
      
      if (distance > maxRadius) {
        const ratio = maxRadius / distance;
        finalX *= ratio;
        finalY *= ratio;
      }
      
      // 포탈 표시 (파란색 작은 원)
      const portalDot = this.add.circle(finalX, finalY, 3, 0x00FFFF, 0.8);
      portalDot.setStrokeStyle(1, 0xFFFFFF);
      this.minimapContainer.add(portalDot);
      this.minimapPortals.push(portalDot);
    });
  }

  /**
   * 융합술사 전직 수락/거절 창 표시
   */
  showFusionistClassChangeDialog() {
    console.log('[UIScene] 융합술사 전직 창 표시');
    
    // 게임 일시 정지
    this.scene.pause('GameScene');
    
    // 배경 오버레이
    const overlay = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.7
    );
    overlay.setDepth(900);
    
    // 메인 창
    const dialogWidth = 600;
    const dialogHeight = 500;
    const dialogX = this.cameras.main.width / 2;
    const dialogY = this.cameras.main.height / 2;
    
    const dialogBg = this.add.rectangle(dialogX, dialogY, dialogWidth, dialogHeight, 0x1a1a2e, 0.95);
    dialogBg.setStrokeStyle(3, 0xFFD700);
    dialogBg.setDepth(1000);
    
    // 제목
    const title = this.add.text(dialogX, dialogY - 220, '🔮 히든 직업 전직', {
      font: 'bold 28px Arial',
      fill: '#FFD700'
    });
    title.setOrigin(0.5);
    title.setDepth(1001);
    
    // 융합술사 설명
    const fusionistDesc = this.add.text(dialogX, dialogY - 150, 
      '마법사의 지능이 100에 도달하여 히든 직업 "융합술사"로 전직할 수 있습니다!\n\n' +
      '융합술사는 마법의 근본 원리를 이해하고, 서로 다른 속성을 융합하여\n' +
      '강력한 새로운 마법을 창조하는 존재입니다.',
      {
        font: '16px Arial',
        fill: '#FFFFFF',
        align: 'center',
        wordWrap: { width: dialogWidth - 40 }
      }
    );
    fusionistDesc.setOrigin(0.5);
    fusionistDesc.setDepth(1001);
    
    // 스킬 설명 제목
    const skillsTitle = this.add.text(dialogX, dialogY - 85, '습득 가능한 스킬:', {
      font: 'bold 18px Arial',
      fill: '#FFD700'
    });
    skillsTitle.setOrigin(0.5);
    skillsTitle.setDepth(1001);
    
    // 스킬 목록
    const skillsText = this.add.text(dialogX, dialogY - 20,
      '• 마력 공명(패시브): 스킬 위력 증가 및 마나 회수\n' +
      '• 속성 탄환: 선택한 속성 탄환 발사 (110% 피해)\n' +
      '• 마력 장벽: 전방 투사체 방어 및 피해 흡수\n' +
      '• 불안정한 파동: 주변 적 밀쳐내기 (130% 피해)\n' +
      '• 원소 융합: 두 스킬을 융합하여 새로운 스킬 생성',
      {
        font: '14px Arial',
        fill: '#AAAAAA',
        align: 'left',
        wordWrap: { width: dialogWidth - 40 }
      }
    );
    skillsText.setOrigin(0.5);
    skillsText.setDepth(1001);
    
    // 질문
    const question = this.add.text(dialogX, dialogY + 60, '융합술사로 전직하시겠습니까?', {
      font: 'bold 20px Arial',
      fill: '#FFFFFF'
    });
    question.setOrigin(0.5);
    question.setDepth(1001);
    
    // 수락 버튼
    const acceptBtn = this.add.rectangle(dialogX - 100, dialogY + 120, 120, 40, 0x4CAF50, 0.8);
    acceptBtn.setStrokeStyle(2, 0xFFFFFF);
    acceptBtn.setInteractive({ useHandCursor: true });
    acceptBtn.setDepth(1001);
    
    const acceptText = this.add.text(dialogX - 100, dialogY + 120, '수락', {
      font: 'bold 16px Arial',
      fill: '#FFFFFF'
    });
    acceptText.setOrigin(0.5);
    acceptText.setDepth(1002);
    
    // 거절 버튼
    const rejectBtn = this.add.rectangle(dialogX + 100, dialogY + 120, 120, 40, 0xF44336, 0.8);
    rejectBtn.setStrokeStyle(2, 0xFFFFFF);
    rejectBtn.setInteractive({ useHandCursor: true });
    rejectBtn.setDepth(1001);
    
    const rejectText = this.add.text(dialogX + 100, dialogY + 120, '거절', {
      font: 'bold 16px Arial',
      fill: '#FFFFFF'
    });
    rejectText.setOrigin(0.5);
    rejectText.setDepth(1002);
    
    // 버튼 이벤트
    acceptBtn.on('pointerdown', () => {
      this.acceptFusionistClassChange();
      this.closeFusionistDialog(overlay, dialogBg, title, fusionistDesc, skillsTitle, skillsText, question, acceptBtn, acceptText, rejectBtn, rejectText);
    });
    
    rejectBtn.on('pointerdown', () => {
      this.rejectFusionistClassChange();
      this.closeFusionistDialog(overlay, dialogBg, title, fusionistDesc, skillsTitle, skillsText, question, acceptBtn, acceptText, rejectBtn, rejectText);
    });
    
    // 버튼 호버 효과
    acceptBtn.on('pointerover', () => acceptBtn.setFillStyle(0x66BB6A, 0.9));
    acceptBtn.on('pointerout', () => acceptBtn.setFillStyle(0x4CAF50, 0.8));
    rejectBtn.on('pointerover', () => rejectBtn.setFillStyle(0xEF5350, 0.9));
    rejectBtn.on('pointerout', () => rejectBtn.setFillStyle(0xF44336, 0.8));
  }
  
  /**
   * 융합술사 전직 수락
   */
  acceptFusionistClassChange() {
    console.log('[UIScene] 융합술사 전직 수락');
    
    if (this.player) {
      // 기존 스킬 보존 (전직 전 스킬들)
      const currentSkills = Object.values(this.player.skills).filter(skill => skill);
      this.player.retainedSkills = [...currentSkills];
      console.log('[UIScene] 기존 스킬 보존:', this.player.retainedSkills);
      
      // 직업 변경
      this.player.characterClass = 'fusionist';
      
      // 기존 스킬 슬롯 초기화
      this.player.skills = {};
      
      // 융합술사 스킬 직접 할당
      const { createSkill } = require('../entities/Skill.js');
      const dataManager = DataManager.getInstance();
      
      try {
        this.player.skills['1'] = createSkill(dataManager.getSkill('fusionist_base_1'), 'fusionist');
        this.player.skills['2'] = createSkill(dataManager.getSkill('fusionist_barrier'), 'fusionist');
        this.player.skills['3'] = createSkill(dataManager.getSkill('fusionist_wave'), 'fusionist');
        this.player.skills['R'] = createSkill(dataManager.getSkill('fusionist_ultimate'), 'fusionist');
        console.log('[UIScene] 융합술사 스킬 직접 할당 완료');
      } catch (error) {
        console.error('[UIScene] 융합술사 스킬 할당 중 오류:', error);
      }
      
      // 전직 후 바로 모든 융합술사 스킬 사용 가능하도록 강제 설정
      this.player.updateAvailableSkills();
      
      // 스킬슬롯을 융합술사 기본 스킬로 설정
      if (this.fusionSkillUI) {
        this.fusionSkillUI.selectedSlots = {
          '1': { id: 'fusionist_base_1', name: '속성 탄환', description: '선택한 기본 속성(화염, 냉기, 전격) 탄환 발사, 110% 피해', type: 'projectile' },
          '2': { id: 'fusionist_barrier', name: '마력 장벽', description: '2초간 전방의 투사체를 막고 100% 피해 흡수', type: 'barrier' },
          '3': { id: 'fusionist_wave', name: '불안정한 파동', description: '주변 적을 밀쳐내며 130% 피해, 융합 재료로 사용 시 효율 증가', type: 'aoe' }
        };
        console.log('[UIScene] 스킬슬롯을 융합술사 기본 스킬로 설정');
      }
      
      // UI 업데이트
      this.playerNameText.setText(`[Lv ${this.player.level}] ${this.player.getClassName()}`);
      
      console.log('[UIScene] 융합술사로 전직 완료');
    }
  }
  
  /**
   * 융합술사 전직 거절
   */
  rejectFusionistClassChange() {
    console.log('[UIScene] 융합술사 전직 거절');
    // 다음 레벨업 시 다시 제안 (현재는 단순히 거절만 처리)
  }
  
  /**
   * 융합술사 전직 창 닫기
   */
  closeFusionistDialog(...elements) {
    elements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    
    // 게임 재개
    this.scene.resume('GameScene');
  }

  /**
   * 퀘스트 트래커 업데이트
   */
  updateQuestTracker() {
    if (!this.player || !this.player.questManager || !this.questTrackerItems) return;
    
    // 진행 중인 퀘스트 가져오기 (최대 3개)
    const activeQuests = this.player.questManager.getActiveQuests().slice(0, 3);
    
    // 각 트래커 항목 업데이트
    this.questTrackerItems.forEach((item, index) => {
      if (index < activeQuests.length) {
        const quest = activeQuests[index];
        item.quest = quest;
        
        // 퀘스트 이름 표시
        item.nameText.setText(quest.name);
        item.nameText.setVisible(true);
        
        // 완료 가능 시 금색 표시
        if (quest.isAllObjectivesComplete()) {
          item.nameText.setColor('#FFD700');
        } else {
          item.nameText.setColor('#FFFFFF');
        }
        
        // 목표 표시 (최대 2개)
        const objectives = quest.objectives.slice(0, 2);
        
        if (objectives[0]) {
          const obj = objectives[0];
          const isDone = obj.current >= obj.required;
          const icon = isDone ? '✓' : '○';
          const color = isDone ? '#4CAF50' : '#AAAAAA';
          
          item.objective1Text.setText(`${icon} ${obj.description.substring(0, 20)} (${obj.current}/${obj.required})`);
          item.objective1Text.setColor(color);
          item.objective1Text.setVisible(true);
        } else {
          item.objective1Text.setVisible(false);
        }
        
        if (objectives[1]) {
          const obj = objectives[1];
          const isDone = obj.current >= obj.required;
          const icon = isDone ? '✓' : '○';
          const color = isDone ? '#4CAF50' : '#AAAAAA';
          
          item.objective2Text.setText(`${icon} ${obj.description.substring(0, 20)} (${obj.current}/${obj.required})`);
          item.objective2Text.setColor(color);
          item.objective2Text.setVisible(true);
        } else {
          item.objective2Text.setVisible(false);
        }
      } else {
        // 빈 슬롯
        item.quest = null;
        item.nameText.setVisible(false);
        item.objective1Text.setVisible(false);
        item.objective2Text.setVisible(false);
      }
    });
  }

  /**
   * 모든 스킬 슬롯 업데이트
   */
  updateAllSkillSlots() {
    if (!this.player) return;
    
    ['1', '2', '3', 'R'].forEach((slotKey, index) => {
      const skill = this.player.skills[slotKey];
      // 기존 update() 메서드에서 처리하므로 여기서는 별도 처리 불필요
    });
  }

  /**
   * 특정 스킬 슬롯 업데이트
   * @param {string} slotKey - 슬롯 키 ('1', '2', '3', 'R')
   * @param {Object} skill - 스킬 인스턴스
   */
  updateSkillSlot(slotKey, skill) {
    if (!this.skillSlots) return;
    
    const slotIndex = ['1', '2', '3', 'R'].indexOf(slotKey);
    if (slotIndex === -1) return;
    
    const slotUI = this.skillSlots[slotIndex];
    if (!slotUI) return;
    
    if (skill) {
      // 스킬이 있는 경우 아이콘 표시
      const iconKey = skill.id;
      if (this.textures.exists(iconKey)) {
        // 기존 아이콘이 있으면 제거
        if (slotUI.icon && typeof slotUI.icon.destroy === 'function') {
          slotUI.icon.destroy();
        }
        // 새 아이콘 생성
        slotUI.icon = this.add.image(slotUI.x, slotUI.y, iconKey);
        slotUI.icon.setDisplaySize(45, 45);
        slotUI.icon.setVisible(true);
        
        // 쿨타임 텍스트를 아이콘 위로 가져옴
        slotUI.cooldownText.setDepth(10);
      } else {
        // 아이콘이 없으면 기본 사각형 표시
        if (slotUI.icon && typeof slotUI.icon.destroy === 'function') {
          slotUI.icon.destroy();
          slotUI.icon = this.add.rectangle(slotUI.x, slotUI.y, 45, 45, 0x666666, 0.5);
        }
        slotUI.icon.setVisible(true);
        
        // 쿨타임 텍스트를 아이콘 위로 가져옴
        slotUI.cooldownText.setDepth(10);
      }
      
      // Skill 인스턴스인 경우에만 쿨타임 표시 (융합 스킬은 쿨타임 없음)
      if (skill.currentCooldown !== undefined && skill.currentCooldown > 0) {
        // 쿨다운 중
        slotUI.cooldownOverlay.setVisible(true);
        slotUI.cooldownOverlay.setDepth(5); // 아이콘 위
        slotUI.cooldownText.setText(Math.ceil(skill.currentCooldown / 1000).toString());
        slotUI.cooldownText.setDepth(10); // 가장 위
        
        // 쿨다운 진행도
        const ratio = skill.getCooldownRatio ? skill.getCooldownRatio() : 0;
        slotUI.cooldownOverlay.setScale(1, ratio);
      } else {
        // 쿨다운 끝 또는 쿨타임 없는 스킬
        slotUI.cooldownOverlay.setVisible(false);
        slotUI.cooldownText.setText('');
      }
    } else {
      // 스킬이 없는 경우 아이콘 숨김
      slotUI.icon.setVisible(false);
      slotUI.cooldownOverlay.setVisible(false);
      slotUI.cooldownText.setText('');
    }
  }

}


