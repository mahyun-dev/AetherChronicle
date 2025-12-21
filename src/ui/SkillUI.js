import Phaser from 'phaser';

/**
 * SkillUI - 스킬 창 UI
 * 플레이어의 스킬을 표시하고 관리
 */
export class SkillUI {
  constructor(scene, player, x, y) {
    this.scene = scene;
    this.player = player;

    // 화면 사이즈에 맞춰 동적 설정
    const screenWidth = scene.cameras.main.width;
    const screenHeight = scene.cameras.main.height;

    this.x = x || screenWidth * 0.3;
    this.y = y || screenHeight * 0.2;

    // 화면 크기의 30% 범위로 동적 조정
    this.width = Math.max(400, Math.min(500, screenWidth * 0.35));
    this.height = Math.max(300, Math.min(400, screenHeight * 0.5));

    // UI 컨테이너
    this.container = scene.add.container(this.x, this.y);
    this.container.setDepth(1000);
    this.container.setVisible(false);

    this.skillSlots = [];
    this.selectedSlot = null;

    this.createUI();
  }

  /**
   * UI 생성
   */
  createUI() {
    // 배경
    const bg = this.scene.add.rectangle(0, 0, this.width, this.height, 0x1a1a2e, 0.95);
    bg.setOrigin(0);
    bg.setInteractive({ useHandCursor: true });
    this.container.add(bg);

    // 드래그 기능 추가
    this.setupMenuDrag(bg);

    // 테두리
    const border = this.scene.add.rectangle(0, 0, this.width, this.height, 0xFFD700, 0);
    border.setOrigin(0);
    border.setStrokeStyle(2, 0xFFD700);
    this.container.add(border);

    // 제목
    const title = this.scene.add.text(this.width / 2, 20, '스킬 창', {
      fontSize: '20px',
      color: '#FFD700',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // 닫기 버튼
    const closeBtn = this.scene.add.text(this.width - 20, 20, 'X', {
      fontSize: '18px',
      color: '#ffffff'
    });
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.close());
    this.container.add(closeBtn);

    // 스킬 슬롯 생성
    this.createSkillSlots();

    // 설명 텍스트
    const descText = this.scene.add.text(this.width / 2, this.height - 30,
      '스킬을 클릭하여 선택/변경할 수 있습니다', {
      fontSize: '12px',
      color: '#888888'
    });
    descText.setOrigin(0.5);
    this.container.add(descText);

    // 초기 스킬 표시
    this.updateSkillSlots();
  }

  /**
   * 스킬 슬롯 생성
   */
  createSkillSlots() {
    const slotSize = 60;
    const slotSpacing = 20;
    const startY = 60;
    const slotsPerRow = 2;
    const totalSlots = 4; // 기본 4개 슬롯

    for (let i = 0; i < totalSlots; i++) {
      const row = Math.floor(i / slotsPerRow);
      const col = i % slotsPerRow;

      const x = (this.width - (slotsPerRow * slotSize + (slotsPerRow - 1) * slotSpacing)) / 2 +
                col * (slotSize + slotSpacing) + slotSize / 2;
      const y = startY + row * (slotSize + slotSpacing) + slotSize / 2;

      // 슬롯 배경
      const slotBg = this.scene.add.rectangle(x, y, slotSize, slotSize, 0x333333);
      slotBg.setStrokeStyle(1, 0x666666);
      slotBg.setInteractive({ useHandCursor: true });
      this.container.add(slotBg);

      // 슬롯 번호
      const slotNumber = this.scene.add.text(x - slotSize/2 + 5, y - slotSize/2 + 5,
        `${i + 1}`, {
        fontSize: '12px',
        color: '#ffffff'
      });
      this.container.add(slotNumber);

      // 스킬 이름 텍스트
      const skillName = this.scene.add.text(x, y + slotSize/2 + 10, '', {
        fontSize: '11px',
        color: '#ffffff'
      });
      skillName.setOrigin(0.5);
      this.container.add(skillName);

      // 스킬 쿨다운 텍스트
      const cooldownText = this.scene.add.text(x + slotSize/2 - 5, y - slotSize/2 + 5, '', {
        fontSize: '10px',
        color: '#ff0000'
      });
      cooldownText.setOrigin(1, 0);
      this.container.add(cooldownText);

      // 슬롯 데이터 저장
      const slotData = {
        index: i,
        bg: slotBg,
        nameText: skillName,
        cooldownText: cooldownText,
        skill: null
      };

      this.skillSlots.push(slotData);

      // 클릭 이벤트
      slotBg.on('pointerdown', () => this.onSlotClick(slotData));
    }

    // 초기 스킬 표시 제거 (createUI에서 호출)
  }

  /**
   * 슬롯 클릭 이벤트
   */
  onSlotClick(slotData) {
    // 선택된 슬롯 표시
    this.selectedSlot = slotData.index;

    // 기존 선택 표시 제거
    this.skillSlots.forEach(slot => {
      slot.bg.setStrokeStyle(1, slot === slotData ? 0xFFD700 : 0x666666);
    });

    // 사용 가능한 스킬 목록 표시 (간단한 구현)
    this.showSkillSelection(slotData);
  }

  /**
   * 스킬 선택 UI 표시
   */
  showSkillSelection(slotData) {
    // 기존 선택 UI 제거
    if (this.skillSelectionContainer) {
      this.skillSelectionContainer.destroy();
    }

    const slotKey = (slotData.index + 1).toString(); // 1, 2, 3, 4
    const availableSkills = this.getAvailableSkills();

    if (availableSkills.length === 0) {
      return;
    }

    // 선택 UI 컨테이너
    this.skillSelectionContainer = this.scene.add.container(
      this.container.x + this.width / 2,
      this.container.y + this.height / 2
    );
    this.skillSelectionContainer.setDepth(1100);

    // 배경
    const bg = this.scene.add.rectangle(0, 0, 300, 200, 0x000000, 0.9);
    bg.setStrokeStyle(2, 0xffffff);
    this.skillSelectionContainer.add(bg);

    // 타이틀
    const title = this.scene.add.text(0, -80, `슬롯 ${slotKey} 스킬 선택`, {
      fontSize: '16px',
      color: '#ffffff'
    });
    title.setOrigin(0.5);
    this.skillSelectionContainer.add(title);

    // 스킬 목록
    availableSkills.forEach((skill, index) => {
      const y = -40 + index * 30;
      const skillBtn = this.scene.add.rectangle(-100, y, 200, 25, 0x444444);
      skillBtn.setStrokeStyle(1, 0xffffff);
      skillBtn.setInteractive({ useHandCursor: true });

      const skillText = this.scene.add.text(-90, y, skill.name, {
        fontSize: '14px',
        color: '#ffffff'
      });

      // 클릭 이벤트
      skillBtn.on('pointerdown', () => {
        this.selectSkillForSlot(slotKey, skill);
        this.skillSelectionContainer.destroy();
        this.skillSelectionContainer = null;
      });

      this.skillSelectionContainer.add(skillBtn);
      this.skillSelectionContainer.add(skillText);
    });

    // 취소 버튼
    const cancelBtn = this.scene.add.rectangle(0, 70, 80, 25, 0x666666);
    cancelBtn.setStrokeStyle(1, 0xffffff);
    cancelBtn.setInteractive({ useHandCursor: true });

    const cancelText = this.scene.add.text(0, 70, '취소', {
      fontSize: '14px',
      color: '#ffffff'
    });
    cancelText.setOrigin(0.5);

    cancelBtn.on('pointerdown', () => {
      this.skillSelectionContainer.destroy();
      this.skillSelectionContainer = null;
    });

    this.skillSelectionContainer.add(cancelBtn);
    this.skillSelectionContainer.add(cancelText);
  }

  /**
   * 사용 가능한 스킬 목록 가져오기
   */
  getAvailableSkills() {
    const availableSkills = [];

    // 현재 플레이어의 해금된 스킬들
    Object.values(this.player.skillData).forEach(skillData => {
      if (skillData) {
        // fusionist 스킬은 fusionist만 사용 가능
        if (skillData.id.startsWith('fusionist_') && this.player.characterClass !== 'fusionist') {
          return;
        }
        availableSkills.push(skillData);
      }
    });

    // 보유 스킬들 추가 (전직 시 유지된 스킬들)
    if (this.player.retainedSkills) {
      this.player.retainedSkills.forEach(skillId => {
        const skillData = this.getSkillData(skillId);
        if (skillData && !availableSkills.some(s => s.id === skillData.id)) {
          // fusionist 스킬은 fusionist만 사용 가능
          if (skillData.id.startsWith('fusionist_') && this.player.characterClass !== 'fusionist') {
            return;
          }
          // system 타입 스킬은 fusionist만 사용 가능
          if (skillData.type === 'system' && this.player.characterClass !== 'fusionist') {
            return;
          }
          availableSkills.push(skillData);
        }
      });
    }

    // 현재 장착된 스킬들도 추가 (중복 방지)
    Object.values(this.player.skills).forEach(skill => {
      if (skill && skill.name && !availableSkills.some(s => s.id === skill.id)) {
        availableSkills.push(skill);
      }
    });

    return availableSkills;
  }

  /**
   * 스킬 데이터 가져오기
   */
  getSkillData(skillId) {
    // DataManager에서 스킬 데이터 가져오기
    const dataManager = this.player.scene.registry.get('dataManager');
    if (dataManager) {
      return dataManager.getSkill(skillId);
    }
    return null;
  }

  /**
   * 슬롯에 스킬 선택
   */
  selectSkillForSlot(slotKey, skillData) {
    // 스킬 호환성 체크
    if (skillData.id.startsWith('fusionist_') && this.player.characterClass !== 'fusionist') {
      console.error('이 스킬은 융합술사만 사용할 수 있습니다.');
      return;
    }
    // system 타입 스킬은 fusionist만 사용 가능
    if (skillData.type === 'system' && this.player.characterClass !== 'fusionist') {
      console.error('이 스킬은 융합술사만 사용할 수 있습니다.');
      return;
    }

    if (this.player.changeSkillSlot(slotKey, skillData)) {
      this.updateSkillSlots();
    } else {
      console.error('스킬 변경 실패');
    }
  }

  /**
   * 스킬 슬롯 업데이트
   */
  updateSkillSlots() {
    if (!this.player || !this.player.skills) return;

    // 플레이어의 현재 스킬들을 가져와서 표시
    const skillKeys = Object.keys(this.player.skills);

    this.skillSlots.forEach((slot, index) => {
      if (index < skillKeys.length) {
        const skillKey = skillKeys[index];
        const skill = this.player.skills[skillKey];

        if (skill) {
          slot.skill = skill;
          slot.nameText.setText(skill.name || skillKey);

          // 쿨다운 표시
          const cooldown = this.player.skillCooldowns.get(skillKey);
          if (cooldown && cooldown > 0) {
            slot.cooldownText.setText(Math.ceil(cooldown / 1000) + 's');
            slot.bg.setFillStyle(0x666666); // 쿨다운 중 어둡게
          } else {
            slot.cooldownText.setText('');
            slot.bg.setFillStyle(0x333333); // 정상 상태
          }
        } else {
          slot.skill = null;
          slot.nameText.setText('빈 슬롯');
          slot.cooldownText.setText('');
        }
      } else {
        slot.skill = null;
        if (this.player.characterClass === 'fusionist' || index < 4) {
          slot.nameText.setText('빈 슬롯');
        } else {
          slot.nameText.setText('잠금');
        }
        slot.cooldownText.setText('');
      }
    });
  }

  /**
   * 메뉴 드래그 설정
   */
  setupMenuDrag(bg) {
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    bg.on('pointerdown', (pointer) => {
      isDragging = true;
      dragOffset.x = pointer.x - this.container.x;
      dragOffset.y = pointer.y - this.container.y;
    });

    this.scene.input.on('pointermove', (pointer) => {
      if (isDragging) {
        this.container.x = pointer.x - dragOffset.x;
        this.container.y = pointer.y - dragOffset.y;
      }
    });

    this.scene.input.on('pointerup', () => {
      isDragging = false;
    });
  }

  /**
   * UI 열기/닫기 토글
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * UI 열기
   */
  open() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.container.setVisible(true);
    this.updateSkillSlots();

  }

  /**
   * UI 닫기
   */
  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.container.setVisible(false);

  }
}