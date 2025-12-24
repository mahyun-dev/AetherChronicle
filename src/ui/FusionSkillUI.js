import Phaser from 'phaser';

/**
 * FusionSkillUI - 융합술사 전용 스킬 관리 UI (K키)
 */
export class FusionSkillUI {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.isOpen = false;
    this.skillSelectorElements = []; // 스킬 선택기 요소들 저장

    // 선택된 스킬 슬롯 (1, 2, 3)
    this.selectedSlots = {
      '1': null,
      '2': null,
      '3': null
    };

    this.createUI();
    this.setupEvents();
  }

  /**
   * UI 생성
   */
  createUI() {
    // 화면 크기
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // 메인 컨테이너
    this.container = this.scene.add.container(width / 2, height / 2);
    this.container.setDepth(1000);
    this.container.setScrollFactor(1); // 카메라를 따라 움직이도록 설정
    this.container.setVisible(false);

    // 배경
    const bg = this.scene.add.rectangle(0, 0, 600, 400, 0x1a1a2e, 0.95);
    bg.setStrokeStyle(3, 0xFFD700);
    this.container.add(bg);

    // 제목
    const title = this.scene.add.text(0, -170, '⚔️ 스킬 관리', {
      font: 'bold 24px Arial',
      fill: '#FFD700'
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // 닫기 버튼
    const closeBtn = this.scene.add.text(280, -180, '✕', {
      font: 'bold 20px Arial',
      fill: '#FFFFFF'
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hide());
    closeBtn.on('pointerover', () => closeBtn.setColor('#FF0000'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#FFFFFF'));
    this.container.add(closeBtn);

    // 스킬 슬롯 생성
    this.createSkillSlots();
  }

  /**
   * 스킬 슬롯 생성
   */
  createSkillSlots() {
    const slotKeys = ['1', '2', '3'];
    const slotLabels = ['Q', 'W', 'E'];

    slotKeys.forEach((slotKey, index) => {
      const x = -200 + (index * 200);
      const y = -80;

      // 슬롯 배경
      const slotBg = this.scene.add.rectangle(x, y, 150, 120, 0x333333, 0.8);
      slotBg.setStrokeStyle(2, 0x666666);
      slotBg.setInteractive({ useHandCursor: true });
      slotBg.on('pointerdown', () => this.showSkillSelector(slotKey));
      slotBg.on('pointerover', () => slotBg.setFillStyle(0x555555, 0.8));
      slotBg.on('pointerout', () => slotBg.setFillStyle(0x333333, 0.8));
      this.container.add(slotBg);

      // 슬롯 라벨 (Q, W, E)
      const slotLabel = this.scene.add.text(x, y - 45, slotLabels[index], {
        font: 'bold 16px Arial',
        fill: '#FFD700'
      });
      slotLabel.setOrigin(0.5);
      this.container.add(slotLabel);

      // 슬롯 이름 텍스트
      const nameText = this.scene.add.text(x, y + 25, '빈 슬롯', {
        font: '14px Arial',
        fill: '#AAAAAA'
      });
      nameText.setOrigin(0.5);
      this.container.add(nameText);

      // 쿨타임 텍스트 (아이콘 위에 표시)
      const cooldownText = this.scene.add.text(x, y - 10, '', {
        font: 'bold 14px Arial',
        fill: '#FF0000',
        stroke: '#000000',
        strokeThickness: 2
      });
      cooldownText.setOrigin(0.5);
      this.container.add(cooldownText);

      // 슬롯 정보 저장
      this[slotKey + 'Slot'] = {
        bg: slotBg,
        nameText: nameText,
        cooldownText: cooldownText,
        icon: null,
        selectedSkill: null
      };
    });
  }

  /**
   * 이벤트 설정
   */
  setupEvents() {
    // ESC 키로 닫기 (중복 바인딩 방지)
    if (!this.escKeyHandler) {
      this.escKeyHandler = (event) => {
        if (this.isOpen) {
          this.hide();
        }
      };
      this.scene.input.keyboard.on('keydown-ESC', this.escKeyHandler);
    }
  }

  /**
   * UI 표시
   */
  show() {
    if (this.container) {
      this.container.setVisible(true);
      this.isOpen = true;
      console.log('[FusionSkillUI] 스킬 창 열림');
    }
  }

  /**
   * UI 숨기기
   */
  hide() {
    if (this.container) {
      this.container.setVisible(false);
      this.isOpen = false;
      console.log('[FusionSkillUI] 스킬 창 닫힘');
    }
  }

  /**
   * 토글
   */
  toggle() {
    if (this.isOpen) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 스킬 선택기 표시
   */
  showSkillSelector(slotKey) {
    // 현재 플레이어의 스킬 목록 가져오기
    const availableSkills = this.getAvailableSkills();

    if (!availableSkills || !Array.isArray(availableSkills) || availableSkills.length === 0) {
      console.log('[FusionSkillUI] 선택 가능한 스킬이 없습니다.');
      // 간단한 알림 표시
      const notification = this.scene.add.text(this.scene.cameras.main.centerX, this.scene.cameras.main.centerY, '사용 가능한 스킬이 없습니다', {
        font: '16px Arial',
        fill: '#FF0000'
      });
      notification.setOrigin(0.5);
      notification.setDepth(1200);
      this.scene.time.delayedCall(2000, () => {
        if (notification && notification.active) {
          notification.destroy();
        }
      });
      return;
    }

    // 스킬 선택 UI 생성 (화면 중앙에 표시)
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;

    const selectorBg = this.scene.add.rectangle(centerX - 5, centerY, 400, 300, 0x000000, 0.9);
    selectorBg.setStrokeStyle(2, 0xFFD700);
    selectorBg.setDepth(1100);
    this.skillSelectorElements.push(selectorBg);

    const selectorTitle = this.scene.add.text(centerX, centerY - 130, '스킬 선택', {
      font: 'bold 20px Arial',
      fill: '#FFD700'
    });
    selectorTitle.setOrigin(0.5);
    selectorTitle.setDepth(1101);
    this.skillSelectorElements.push(selectorTitle);

    // 스킬 버튼들 생성
    if (Array.isArray(availableSkills)) {
      availableSkills.forEach((skill, index) => {
        const btnY = centerY - 80 + (index * 40);
        
        // 스킬 아이콘
        let skillIcon = null;
        if (skill.icon && this.scene.textures.exists(skill.icon)) {
          skillIcon = this.scene.add.image(centerX - 140, btnY, skill.icon);
          skillIcon.setDisplaySize(24, 24);
          skillIcon.setDepth(1102);
          this.skillSelectorElements.push(skillIcon);
        }
        
        const skillBtn = this.scene.add.rectangle(centerX - 5, btnY, 300, 35, 0x333333, 0.8);
        skillBtn.setStrokeStyle(1, 0xFFFFFF);
        skillBtn.setInteractive({ useHandCursor: true });
        skillBtn.setDepth(1101);

        const skillText = this.scene.add.text(centerX + 3, btnY, skill.name, {
          font: '14px Arial',
          fill: '#FFFFFF'
        });
        skillText.setOrigin(0.5);
        skillText.setDepth(1102);

        skillBtn.on('pointerdown', () => {
          this.selectSkill(slotKey, skill);
          this.closeSkillSelector();
        });

        skillBtn.on('pointerover', () => skillBtn.setFillStyle(0x555555, 0.9));
        skillBtn.on('pointerout', () => skillBtn.setFillStyle(0x333333, 0.8));

        this.skillSelectorElements.push(skillBtn);
        this.skillSelectorElements.push(skillText);
      });
    } else {
      console.warn('[FusionSkillUI] availableSkills가 배열이 아닙니다:', availableSkills);
    }

    // 닫기 버튼
    const closeSelectorBtn = this.scene.add.text(centerX + 180, centerY - 130, '✕', {
      font: 'bold 20px Arial',
      fill: '#FFFFFF'
    });
    closeSelectorBtn.setOrigin(0.5);
    closeSelectorBtn.setInteractive({ useHandCursor: true });
    closeSelectorBtn.setDepth(1101);
    closeSelectorBtn.on('pointerdown', () => {
      this.closeSkillSelector();
    });
    this.skillSelectorElements.push(closeSelectorBtn);

    // 모든 요소가 이미 씬에 추가됨
    
    // 스킬 선택기 요소들을 카메라를 따라 움직이도록 설정
    this.skillSelectorElements.forEach(element => {
      if (element && typeof element.setScrollFactor === 'function') {
        element.setScrollFactor(1);
      }
    });
  }

  /**
   * 사용 가능한 스킬 목록 가져오기
   */
  getAvailableSkills() {
    // Player의 안전한 메서드 사용
    if (this.player && typeof this.player.getAvailableSkillsForFusion === 'function') {
      return this.player.getAvailableSkillsForFusion();
    }
    // 폴백: 직접 접근 (안전하게)
    const skills = [];
    if (this.player && this.player.skills && typeof this.player.skills === 'object') {
      try {
        Object.keys(this.player.skills).forEach(key => {
          const skill = this.player.skills[key];
          if (skill && typeof skill === 'object' && skill.name && skill.id) {
            skills.push({
              id: skill.id,
              name: skill.name,
              description: skill.description || '',
              type: skill.type || 'melee' // 기본 타입 설정
            });
          }
        });
      } catch (error) {
        console.warn('[FusionSkillUI] 스킬 로드 중 오류:', error);
      }
    }
    return skills;
  }

  /**
   * 스킬 선택
   */
  selectSkill(slotKey, skill) {
    const slot = this[slotKey + 'Slot'];
    slot.selectedSkill = skill;
    slot.nameText.setText(skill.name);
    slot.nameText.setColor('#FFFFFF');

    // 아이콘 표시
    if (slot.icon) {
      slot.icon.destroy();
      slot.icon = null;
    }
    if (skill.icon && this.scene.textures.exists(skill.icon)) {
      slot.icon = this.scene.add.image(slot.bg.x, slot.bg.y, skill.icon);
      slot.icon.setDisplaySize(48, 48);
      slot.icon.setDepth(1001);
      this.container.add(slot.icon);
    }

    // 선택된 스킬 저장
    this.selectedSlots[slotKey] = skill;

    // Player의 실제 스킬 슬롯 변경
    if (this.player && typeof this.player.changeSkillSlot === 'function') {
      this.player.changeSkillSlot(slotKey, skill);
    }

    console.log(`[FusionSkillUI] 슬롯 ${slotKey}에 스킬 ${skill.name} 선택됨`);
  }

  /**
   * 선택된 스킬 사용
   */
  useSkill(slotKey) {
    const skill = this.selectedSlots[slotKey];
    if (skill && this.player) {
      // 플레이어의 executeSkillById 메서드 호출
      if (typeof this.player.executeSkillById === 'function') {
        const result = this.player.executeSkillById(skill.id);
        if (!result) {
          // 스킬 사용 실패 시 알림
          this.scene.showNotification('스킬을 사용할 수 없습니다 (쿨타임 또는 MP 부족)', 0xFF0000);
        }
      } else {
        console.log(`[FusionSkillUI] 스킬 ${skill.name} 사용 시도`);
      }
    }
  }

  /**
   * 선택된 스킬 가져오기
   */
  getSelectedSkill(slotKey) {
    return this.selectedSlots[slotKey];
  }

  /**
   * 사용 가능한 스킬 목록 가져오기
   */
  getAvailableSkills() {
    const skills = [];

    try {
      // 1. 기존 보유 스킬 (retainedSkills - 마법사 스킬)
      if (this.player && this.player.retainedSkills && Array.isArray(this.player.retainedSkills)) {
        this.player.retainedSkills.forEach(skill => {
          if (skill && typeof skill === 'object' && skill.name && skill.id) {
            skills.push({
              id: skill.id,
              name: skill.name,
              description: skill.description || '',
              type: skill.type || 'melee',
              cooldown: skill.cooldown || 1000,
              mpCost: skill.mpCost || 0,
              damageMultiplier: skill.damageMultiplier || 1.0,
              range: skill.range || 100,
              radius: skill.radius || 0
            });
          }
        });
      }

      // 2. 현재 융합술사 스킬 (기본 스킬들 강제 포함)
      if (this.player && this.player.characterClass === 'fusionist') {
        const fusionistSkills = [
          { id: 'fusionist_base_1', name: '속성 탄환', description: '선택한 기본 속성(화염, 냉기, 전격) 탄환 발사, 110% 피해', type: 'projectile', cooldown: 2000, mpCost: 25, damageMultiplier: 1.1, range: 500 },
          { id: 'fusionist_barrier', name: '마력 장벽', description: '2초간 전방의 투사체를 막고 100% 피해 흡수', type: 'barrier', cooldown: 8000, mpCost: 40, duration: 2000 },
          { id: 'fusionist_wave', name: '불안정한 파동', description: '주변 적을 밀쳐내며 130% 피해, 융합 재료로 사용 시 효율 증가', type: 'aoe', cooldown: 6000, mpCost: 35, damageMultiplier: 1.3, radius: 120 },
          { id: 'fusionist_ultimate', name: '원소 융합', description: '[전용 UI 오픈] 슬롯에 장착된 스킬 2개를 조합하여 새로운 스킬 생성', type: 'system', cooldown: 1000, mpCost: 0 }
        ];

        fusionistSkills.forEach(skill => {
          const isDuplicate = skills.some(existingSkill => existingSkill.id === skill.id);
          if (!isDuplicate) {
            skills.push(skill);
          }
        });
      }

      // 3. 현재 플레이어의 실제 스킬 (중복 방지)
      if (this.player && this.player.skills && typeof this.player.skills === 'object') {
        Object.keys(this.player.skills).forEach(key => {
          const skill = this.player.skills[key];
          if (skill && typeof skill === 'object' && skill.name && skill.id) {
            // 중복 방지 (이미 추가된 스킬은 제외)
            const isDuplicate = skills.some(existingSkill => existingSkill.id === skill.id);
            if (!isDuplicate) {
              skills.push({
                id: skill.id,
                name: skill.name,
                description: skill.description || '',
                type: skill.type || 'melee'
              });
            }
          }
        });
      }

      // 4. 융합으로 생성된 스킬
      if (this.player && this.player.fusionSkills && Array.isArray(this.player.fusionSkills)) {
        this.player.fusionSkills.forEach(skill => {
          if (skill && typeof skill === 'object' && skill.name && skill.id) {
            skills.push({
              id: skill.id,
              name: skill.name,
              description: skill.description || '',
              type: skill.type || 'fusion',
              icon: 'fusionist_ultimate.png'  // 융합 스킬 아이콘
            });
          }
        });
      }
    } catch (error) {
      console.warn('[FusionSkillUI] 스킬 로드 중 오류:', error);
    }

    return skills;
  }

  /**
   * 스킬 선택기 닫기
   */
  closeSkillSelector() {
    this.skillSelectorElements.forEach(element => {
      if (element && element.active) {
        element.destroy();
      }
    });
    this.skillSelectorElements = [];
  }

  /**
   * 스킬 선택기가 열려있는지 확인
   */
  hasSkillSelectorOpen() {
    return this.skillSelectorElements && this.skillSelectorElements.length > 0;
  }

  /**
   * 업데이트 (쿨타임 표시 등)
   */
  update() {
    if (!this.isOpen) return;

    const slotKeys = ['1', '2', '3'];
    slotKeys.forEach(slotKey => {
      const slot = this[slotKey + 'Slot'];
      const selectedSkill = this.selectedSlots[slotKey];

      if (selectedSkill && slot && slot.cooldownText) {
        // 융합 스킬 쿨타임 체크
        const currentTime = Date.now();
        const lastUsed = this.player.fusionSkillCooldowns.get(selectedSkill.id) || 0;
        const cooldown = selectedSkill.cooldown || 3000; // 기본 3초
        const remaining = cooldown - (currentTime - lastUsed);

        if (remaining > 0) {
          const remainingSec = (remaining / 1000).toFixed(1);
          slot.cooldownText.setText(`${remainingSec}s`);
          slot.cooldownText.setVisible(true);
        } else {
          slot.cooldownText.setVisible(false);
        }
      } else if (slot && slot.cooldownText) {
        slot.cooldownText.setVisible(false);
      }
    });
  }
}