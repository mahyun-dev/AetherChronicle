import Phaser from 'phaser';

/**
 * EnhancementUI - 장비 강화 UI
 * 장비와 강화석을 선택하여 강화 시도
 */
export class EnhancementUI {
  constructor(scene, player, x = 100, y = 100) {
    this.scene = scene;
    this.player = player;

    // 화면 사이즈에 맞춰 동적 설정
    const screenWidth = scene.cameras.main.width;
    const screenHeight = scene.cameras.main.height;

    this.x = x || screenWidth * 0.5;
    this.y = y || screenHeight * 0.5;
    this.isOpen = false;

    // 선택된 아이템들
    this.selectedEquipment = null;
    this.selectedEnhancementStone = null;

    // UI 요소들
    this.container = null;
    this.equipmentSlot = null;
    this.stoneSlot = null;
    this.infoText = null;
    this.enhanceButton = null;
    this.tooltip = null;

    // 아이템 선택 창
    this.itemSelector = null;

    // 화면 크기의 40~45% 범위로 동적 조정 (최소 450, 최대 600)
    this.uiWidth = Math.max(450, Math.min(600, screenWidth * 0.42));
    this.uiHeight = Math.max(550, Math.min(700, screenHeight * 0.85));

    this.createUI();
  }

  createUI() {
    const width = this.uiWidth;
    const height = this.uiHeight;

    // 컨테이너
    this.container = this.scene.add.container(this.x, this.y);
    this.container.setVisible(false);
    this.container.setDepth(100);

    // 메인 배경
    const bg = this.scene.add.rectangle(0, 0, width, height, 0x1a1a2e, 0.95);
    bg.setStrokeStyle(4, 0xFFD700);
    bg.setInteractive({ useHandCursor: true });
    this.container.add(bg);

    // 드래그 기능 추가
    this.setupMenuDrag(bg);

    // 제목
    const title = this.scene.add.text(0, -height / 2 + 30, '⚡ 장비 강화 ⚡', {
      font: 'bold 24px Arial',
      fill: '#FFD700'
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // 닫기 버튼
    const closeBtn = this.createButton(width / 2 - 25, -height / 2 + 25, '✕', () => {
      this.close();
    }, 30, 30);
    this.container.add(closeBtn);

    // 장비 슬롯 생성
    this.createEquipmentSlot(-width / 4, -height / 2 + 120);

    // 강화석 슬롯 생성
    this.createStoneSlot(width / 4, -height / 2 + 120);

    // 강화 정보 영역
    this.createInfoPanel(0, height);

    // 강화 버튼
    this.enhanceButton = this.createButton(0, height / 2 - 40, '🔨 강화 시도', () => {
      this.attemptEnhance();
    }, 200, 50);
    this.enhanceButton.setAlpha(0.5);
    this.container.add(this.enhanceButton);

    // 드래그 앤 드랍 이벤트 설정
    this.setupDragAndDrop();
  }

  createEquipmentSlot(x, y) {
    const slotSize = 80;

    // 슬롯 배경
    const slotBg = this.scene.add.rectangle(x, y, slotSize, slotSize, 0x2a2a3e, 0.8);
    slotBg.setStrokeStyle(3, 0xFFD700);
    slotBg.setInteractive({ useHandCursor: true });
    slotBg.setDepth(120); // 더 높은 깊이로 설정
    this.container.add(slotBg);

    // 드래그 앤 드랍을 위한 투명한 드롭존
    const dropZone = this.scene.add.zone(x, y, slotSize, slotSize);
    dropZone.setDepth(130); // 슬롯 배경보다 높음
    this.container.add(dropZone);

    // 슬롯 라벨
    const label = this.scene.add.text(x, y - slotSize/2 - 20, '장비', {
      font: 'bold 14px Arial',
      fill: '#FFD700'
    });
    label.setOrigin(0.5);
    this.container.add(label);

    // 이벤트 전파 방지
    slotBg.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation();
      console.log('[EnhancementUI] 장비 슬롯 클릭됨');
      this.showItemSelector('equipment');
    });

    // 안내 텍스트
    const guideText = this.scene.add.text(x, y, '클릭하여\n장비 선택', {
      font: '12px Arial',
      fill: '#888888',
      align: 'center'
    });
    guideText.setOrigin(0.5);
    this.container.add(guideText);

    this.equipmentSlot = {
      x: x,
      y: y,
      bg: slotBg,
      dropZone: dropZone,
      label: label,
      equipment: null,
      sprite: null,
      nameText: null,
      levelText: null,
      guide: guideText
    };
  }

  createStoneSlot(x, y) {
    const slotSize = 80;

    // 슬롯 배경
    const slotBg = this.scene.add.rectangle(x, y, slotSize, slotSize, 0x2a2a3e, 0.8);
    slotBg.setStrokeStyle(3, 0x00FF00);
    slotBg.setInteractive({ useHandCursor: true });
    slotBg.setDepth(120); // 더 높은 깊이로 설정
    this.container.add(slotBg);

    // 드래그 앤 드랍을 위한 투명한 드롭존
    const dropZone = this.scene.add.zone(x, y, slotSize, slotSize);
    dropZone.setDepth(130); // 슬롯 배경보다 높음
    this.container.add(dropZone);

    // 슬롯 라벨
    const label = this.scene.add.text(x, y - slotSize/2 - 20, '강화석', {
      font: 'bold 14px Arial',
      fill: '#00FF00'
    });
    label.setOrigin(0.5);
    this.container.add(label);

    // 안내 텍스트
    const guideText = this.scene.add.text(x, y, '클릭하여\n강화석 선택', {
      font: '12px Arial',
      fill: '#888888',
      align: 'center'
    });
    guideText.setOrigin(0.5);
    this.container.add(guideText);

    this.stoneSlot = {
      x: x,
      y: y,
      bg: slotBg,
      dropZone: dropZone,
      label: label,
      guide: guideText,
      stone: null,
      sprite: null,
      nameText: null,
      countText: null
    };

    // 클릭 이벤트
    slotBg.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation();
      console.log('[EnhancementUI] 강화석 슬롯 클릭됨');
      this.showItemSelector('stone');
    });
  }

  createInfoPanel(x, uiHeight) {
    const panelWidth = this.uiWidth - 60;
    const panelHeight = 160;

    // 정보 패널 배경
    const infoBg = this.scene.add.rectangle(0, -uiHeight / 2 + 320, panelWidth, panelHeight, 0x111111, 0.9);
    infoBg.setStrokeStyle(2, 0x444444);
    this.container.add(infoBg);

    // 정보 텍스트
    this.infoText = this.scene.add.text(0, -uiHeight / 2 + 260, '', {
      font: '14px Arial',
      fill: '#FFFFFF',
      align: 'center',
      wordWrap: { width: panelWidth - 40 }
    });
    this.infoText.setOrigin(0.5, 0);
    this.container.add(this.infoText);

    this.updateInfoPanel();
  }

  createButton(x, y, text, callback, width = 100, height = 40) {
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.rectangle(0, 0, width, height, 0x444444, 0.9);
    bg.setStrokeStyle(2, 0xFFD700);
    bg.setInteractive({ useHandCursor: true });

    const label = this.scene.add.text(0, 0, text, {
      font: 'bold 16px Arial',
      fill: '#FFFFFF'
    });
    label.setOrigin(0.5);

    container.add([bg, label]);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x666666, 0.9);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x444444, 0.9);
    });

    bg.on('pointerdown', callback);

    container.bg = bg;
    container.label = label;

    return container;
  }

  showItemSelector(type) {
    console.log(`[EnhancementUI] showItemSelector 호출됨, type: ${type}`);
    if (this.itemSelector) {
      this.itemSelector.destroy();
    }

    const selectorWidth = 400;
    const selectorHeight = 300;
    // 화면 가운데에 위치하도록 수정
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;
    const selectorX = screenWidth / 2;
    const selectorY = screenHeight / 2;

    // 선택 창 컨테이너
    this.itemSelector = this.scene.add.container(selectorX, selectorY);
    this.itemSelector.setDepth(150);

    // 배경
    const bg = this.scene.add.rectangle(0, 0, selectorWidth, selectorHeight, 0x000000, 0.95);
    bg.setStrokeStyle(3, 0xFFD700);
    bg.setInteractive();
    this.itemSelector.add(bg);

    // 제목
    const titleText = type === 'equipment' ? '장비 선택' : '강화석 선택';
    const title = this.scene.add.text(0, -selectorHeight/2 + 30, titleText, {
      font: 'bold 20px Arial',
      fill: '#FFD700'
    });
    title.setOrigin(0.5);
    this.itemSelector.add(title);

    // 닫기 버튼
    const closeBtn = this.scene.add.text(selectorWidth/2 - 20, -selectorHeight/2 + 20, '✕', {
      font: 'bold 16px Arial',
      fill: '#FF0000'
    });
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      this.itemSelector.destroy();
      this.itemSelector = null;
    });
    this.itemSelector.add(closeBtn);

    // 아이템 목록 표시
    this.displayItemList(type, selectorWidth, selectorHeight);

    // 배경 클릭으로 닫기
    bg.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation();
    });

    // 외부 클릭으로 닫기
    const closeOnOutside = (pointer) => {
      if (this.itemSelector && !this.itemSelector.getBounds().contains(pointer.x, pointer.y)) {
        this.itemSelector.destroy();
        this.itemSelector = null;
        this.scene.input.off('pointerdown', closeOnOutside);
      }
    };
    this.scene.input.on('pointerdown', closeOnOutside);
  }

  displayItemList(type, selectorWidth, selectorHeight) {
    const items = this.getAvailableItems(type);
    const itemHeight = 50;
    const startY = -selectorHeight/2 + 80;

    items.forEach((item, index) => {
      const y = startY + index * itemHeight;

      // 아이템 배경
      const itemBg = this.scene.add.rectangle(0, y, selectorWidth - 40, itemHeight - 5, 0x333333, 0.8);
      itemBg.setStrokeStyle(1, 0x666666);
      itemBg.setInteractive({ useHandCursor: true });
      this.itemSelector.add(itemBg);

      // 아이템 이름
      const nameText = this.scene.add.text(-selectorWidth/2 + 60, y, item.name, {
        font: '14px Arial',
        fill: type === 'equipment' ? item.getRarityColor() : '#FFFFFF'
      });
      nameText.setOrigin(0, 0.5);
      this.itemSelector.add(nameText);

      // 강화 레벨 (장비만)
      if (type === 'equipment') {
        const levelText = this.scene.add.text(selectorWidth/2 - 80, y, `+${item.enhanceLevel}`, {
          font: 'bold 14px Arial',
          fill: '#FFD700'
        });
        levelText.setOrigin(1, 0.5);
        this.itemSelector.add(levelText);
      }

      // 수량 (강화석만)
      if (type === 'stone') {
        const count = this.player.inventory.getItemCount(item.id);
        const countText = this.scene.add.text(selectorWidth/2 - 40, y, `x${count}`, {
          font: '14px Arial',
          fill: '#00FF00'
        });
        countText.setOrigin(1, 0.5);
        this.itemSelector.add(countText);
      }

      // 클릭 이벤트
      itemBg.on('pointerdown', () => {
        if (type === 'equipment') {
          this.setSelectedEquipment(item);
        } else {
          this.setSelectedStone(item);
        }
        this.itemSelector.destroy();
        this.itemSelector = null;
      });

      // 호버 효과
      itemBg.on('pointerover', () => {
        itemBg.setFillStyle(0x555555, 0.8);
      });

      itemBg.on('pointerout', () => {
        itemBg.setFillStyle(0x333333, 0.8);
      });
    });
  }

  getAvailableItems(type) {
    if (type === 'equipment') {
      // 인벤토리의 모든 장비들 반환 (Equipment 클래스의 인스턴스)
      const equipment = [];
      this.player.inventory.slots.forEach(slot => {
        if (slot && slot.constructor && slot.constructor.name === 'Equipment') {
          equipment.push(slot);
        }
      });
      return equipment;
    } else {
      // 인벤토리의 강화석들 반환
      const stones = [];
      this.player.inventory.slots.forEach(slot => {
        if (slot && slot.id.startsWith('enhancement_stone')) {
          stones.push(slot);
        }
      });
      return stones;
    }
  }

  setSelectedEquipment(equipment) {
    if (!this.equipmentSlot) return;

    this.clearEquipmentSlot();

    if (!equipment) return;

    this.selectedEquipment = equipment;
    this.equipmentSlot.equipment = equipment;
    this.equipmentSlot.guide.setVisible(false);

    // 장비 이미지 표시
    if (equipment.icon && this.scene.textures.exists(equipment.icon) && this.scene.textures.get(equipment.icon).getSourceImage()) {
      // 실제 아이콘 이미지 사용
      const sprite = this.scene.add.image(this.equipmentSlot.x, this.equipmentSlot.y, equipment.icon);
      sprite.setDisplaySize(50, 50);
      sprite.setOrigin(0.5);
      this.container.add(sprite);
      this.equipmentSlot.sprite = sprite;
    } else {
      // 아이콘이 없으면 색상 원으로 표시
      const color = this.getRarityColor(equipment.rarity);
      const sprite = this.scene.add.circle(this.equipmentSlot.x, this.equipmentSlot.y, 25, color);
      this.container.add(sprite);
      this.equipmentSlot.sprite = sprite;
    }

    // 장비 이름
    const nameText = this.scene.add.text(
      this.equipmentSlot.x,
      this.equipmentSlot.y + 55,
      `${equipment.name}`,
      {
        font: 'bold 12px Arial',
        fill: equipment.getRarityColor()
      }
    );
    nameText.setOrigin(0.5);
    this.container.add(nameText);
    this.equipmentSlot.nameText = nameText;

    // 강화 레벨
    const levelText = this.scene.add.text(
      this.equipmentSlot.x,
      this.equipmentSlot.y + 70,
      `+${equipment.enhanceLevel}`,
      {
        font: 'bold 14px Arial',
        fill: '#FFD700'
      }
    );
    levelText.setOrigin(0.5);
    this.container.add(levelText);
    this.equipmentSlot.levelText = levelText;

    this.updateInfoPanel();
    this.updateEnhanceButton();
  }

  setSelectedStone(stone) {
    if (!this.stoneSlot) return;

    this.clearStoneSlot();

    if (!stone) return;

    this.selectedEnhancementStone = stone;
    this.stoneSlot.stone = stone;
    this.stoneSlot.guide.setVisible(false);

    // 강화석 이미지 표시
    if (stone.icon && this.scene.textures.exists(stone.icon) && this.scene.textures.get(stone.icon).getSourceImage()) {
      // 실제 아이콘 이미지 사용
      const sprite = this.scene.add.image(this.stoneSlot.x, this.stoneSlot.y, stone.icon);
      sprite.setDisplaySize(50, 50);
      sprite.setOrigin(0.5);
      this.container.add(sprite);
      this.stoneSlot.sprite = sprite;
    } else {
      // 아이콘이 없으면 색상 원으로 표시
      const sprite = this.scene.add.circle(this.stoneSlot.x, this.stoneSlot.y, 25, 0x00FF00);
      this.container.add(sprite);
      this.stoneSlot.sprite = sprite;
    }

    // 강화석 이름
    const nameText = this.scene.add.text(
      this.stoneSlot.x,
      this.stoneSlot.y + 55,
      stone.name,
      {
        font: 'bold 12px Arial',
        fill: '#00FF00'
      }
    );
    nameText.setOrigin(0.5);
    this.container.add(nameText);
    this.stoneSlot.nameText = nameText;

    // 수량
    const count = this.player.inventory.getItemCount(stone.id);
    const countText = this.scene.add.text(
      this.stoneSlot.x,
      this.stoneSlot.y + 70,
      `x${count}`,
      {
        font: 'bold 14px Arial',
        fill: '#FFFFFF'
      }
    );
    countText.setOrigin(0.5);
    this.container.add(countText);
    this.stoneSlot.countText = countText;

    this.updateInfoPanel();
    this.updateEnhanceButton();
  }

  clearEquipmentSlot() {
    if (!this.equipmentSlot) return;

    this.selectedEquipment = null;
    this.equipmentSlot.equipment = null;
    this.equipmentSlot.guide.setVisible(true);

    if (this.equipmentSlot.sprite) {
      this.equipmentSlot.sprite.destroy();
      this.equipmentSlot.sprite = null;
    }

    if (this.equipmentSlot.nameText) {
      this.equipmentSlot.nameText.destroy();
      this.equipmentSlot.nameText = null;
    }

    if (this.equipmentSlot.levelText) {
      this.equipmentSlot.levelText.destroy();
      this.equipmentSlot.levelText = null;
    }

    this.updateInfoPanel();
    this.updateEnhanceButton();
  }

  clearStoneSlot() {
    if (!this.stoneSlot) return;

    this.selectedEnhancementStone = null;
    this.stoneSlot.stone = null;
    this.stoneSlot.guide.setVisible(true);

    if (this.stoneSlot.sprite) {
      this.stoneSlot.sprite.destroy();
      this.stoneSlot.sprite = null;
    }

    if (this.stoneSlot.nameText) {
      this.stoneSlot.nameText.destroy();
      this.stoneSlot.nameText = null;
    }

    if (this.stoneSlot.countText) {
      this.stoneSlot.countText.destroy();
      this.stoneSlot.countText = null;
    }

    this.updateInfoPanel();
    this.updateEnhanceButton();
  }

  getRarityColor(rarity) {
    const colors = {
      common: 0x808080,
      uncommon: 0x4CAF50,
      rare: 0x2196F3,
      epic: 0x9C27B0,
      legendary: 0xFF9800
    };
    return colors[rarity] || colors.common;
  }

  updateInfoPanel() {
    if (!this.selectedEquipment) {
      this.infoText.setText('장비와 강화석을 선택해주세요.');
      return;
    }

    const equipment = this.selectedEquipment;
    const cost = equipment.getEnhanceCost();
    const successRate = equipment.getEnhanceSuccessRate();

    let text = `🔧 ${equipment.name} +${equipment.enhanceLevel}\n\n`;

    text += `💰 비용: ${cost} 골드\n`;

    if (this.selectedEnhancementStone) {
      const stone = this.selectedEnhancementStone;
      const stoneCount = this.player.inventory.getItemCount(stone.id);
      text += `💎 ${stone.name}: 1개 (보유: ${stoneCount})\n\n`;
    } else {
      text += `💎 강화석: 선택 필요\n\n`;
    }

    text += `✅ 성공 확률: ${successRate}%\n`;

    if (equipment.enhanceLevel >= 3) {
      text += `❌ 실패 시: 강화 레벨 -1\n`;
    }

    if (equipment.enhanceLevel >= 5) {
      const destroyRate = Math.max(5, 30 - successRate);
      text += `💥 파괴 확률: ${destroyRate}%`;
    }

    this.infoText.setText(text);
  }

  updateEnhanceButton() {
    if (this.selectedEquipment && this.selectedEnhancementStone) {
      const equipment = this.selectedEquipment;
      const stone = this.selectedEnhancementStone;

      // 강화 가능 여부 확인
      const canEnhance = equipment.enhanceLevel < equipment.getMaxEnhanceLevel() &&
                        this.player.gold >= equipment.getEnhanceCost() &&
                        this.player.inventory.getItemCount(stone.id) >= 1;

      this.enhanceButton.setAlpha(canEnhance ? 1 : 0.5);
    } else {
      this.enhanceButton.setAlpha(0.5);
    }
  }

  attemptEnhance() {
    if (!this.selectedEquipment || !this.selectedEnhancementStone) {
      this.showMessage('장비와 강화석을 모두 선택해주세요.');
      return;
    }

    const equipment = this.selectedEquipment;
    const stone = this.selectedEnhancementStone;

    if (equipment.enhanceLevel >= equipment.getMaxEnhanceLevel()) {
      this.showMessage('이미 최대 강화 레벨입니다.');
      return;
    }

    const cost = equipment.getEnhanceCost();

    // 비용 확인
    if (this.player.gold < cost) {
      this.showMessage('골드가 부족합니다.');
      return;
    }

    if (this.player.inventory.getItemCount(stone.id) < 1) {
      this.showMessage(`${stone.name}이(가) 부족합니다.`);
      return;
    }

    // 비용 차감
    this.player.gold -= cost;
    this.player.inventory.removeItem(stone.id, 1);

    // 강화 시도
    const result = equipment.attemptEnhance();

    // 결과 표시
    this.showEnhanceResult(result);

    // UI 업데이트
    if (result.destroyed) {
      // 장비 파괴됨
      this.clearEquipmentSlot();
    } else {
      this.setSelectedEquipment(equipment);
    }

    // 강화석 수량 업데이트
    if (this.selectedEnhancementStone) {
      this.setSelectedStone(this.selectedEnhancementStone);
    }

    // 플레이어 스탯 재계산
    if (this.player.equipment) {
      this.player.equipment.updateAllStats();
    }

    // 이벤트 발생
    this.scene.events.emit('player:gold_changed', this.player.gold);
  }

  setupDragAndDrop() {
    // 드래그 앤 드랍 이벤트 리스너 (외부에서 호출용)
  }

  handleDragDrop(item, pointer) {
    console.log(`[EnhancementUI] handleDragDrop 호출됨, item: ${item ? item.name : 'null'}, type: ${item ? item.type : 'null'}`);
    if (!this.isOpen || !this.container) {
      console.log('[EnhancementUI] 강화창이 닫혀있거나 컨테이너가 없음');
      return false;
    }

    if (!item || !pointer) {
      console.log('[EnhancementUI] 아이템이나 포인터가 null임');
      return false;
    }

    // 장비 슬롯 영역 체크
    if (this.equipmentSlot && this.isPointerInSlot(pointer, this.equipmentSlot) && !item.id.startsWith('enhancement_stone')) {
      console.log('[EnhancementUI] 장비 슬롯에 드랍됨');
      this.setSelectedEquipment(item);
      return true;
    }

    // 강화석 슬롯 영역 체크
    if (this.stoneSlot && this.isPointerInSlot(pointer, this.stoneSlot) && item.id.startsWith('enhancement_stone')) {
      console.log('[EnhancementUI] 강화석 슬롯에 드랍됨');
      this.setSelectedStone(item);
      return true;
    }

    console.log('[EnhancementUI] 슬롯 영역 밖에 드랍됨');
    return false;
  }

  isPointerInSlot(pointer, slot) {
    if (!slot || !slot.dropZone || !this.container) {
      console.log('[EnhancementUI] 슬롯이나 컨테이너가 null임');
      return false;
    }

    // 슬롯 드롭존의 바운드를 사용하여 영역 체크
    const bounds = slot.dropZone.getBounds();
    const inBounds = bounds.contains(pointer.worldX, pointer.worldY);

    console.log(`[EnhancementUI] 슬롯 체크 - 포인터: (${pointer.worldX}, ${pointer.worldY}), 바운드: (${bounds.left}, ${bounds.top}, ${bounds.right}, ${bounds.bottom}), 결과: ${inBounds}`);

    return inBounds;
  }

  showEnhanceResult(result) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    let message = result.message;
    let color = '#FFFFFF';
    let scale = 1.5;

    if (result.success) {
      color = '#FFD700';
      scale = 2.0;
      message = `✨ ${message} ✨\n+${result.newLevel}`;
    } else if (result.destroyed) {
      color = '#FF0000';
      scale = 2.0;
      message = `💥 ${message} 💥`;
    } else {
      color = '#FF6B6B';
      scale = 1.5;
    }

    const resultText = this.scene.add.text(width / 2, height / 2, message, {
      font: `bold ${32 * scale / 1.5}px Arial`,
      fill: color,
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center'
    });
    resultText.setOrigin(0.5);
    resultText.setDepth(200);

    // 애니메이션
    this.scene.tweens.add({
      targets: resultText,
      scale: { from: 0.5, to: scale },
      alpha: { from: 1, to: 0 },
      y: resultText.y - 100,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        resultText.destroy();
      }
    });

    // 성공 시 추가 효과
    if (result.success) {
      this.playSuccessEffect();
    } else if (result.destroyed) {
      this.playDestroyEffect();
    }
  }

  playSuccessEffect() {
    const x = this.equipmentSlot.x + this.container.x;
    const y = this.equipmentSlot.y + this.container.y;

    // 파티클 효과
    for (let i = 0; i < 20; i++) {
      const particle = this.scene.add.circle(x, y, 5, 0xFFD700);
      particle.setDepth(150);

      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 100;

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  playDestroyEffect() {
    const x = this.equipmentSlot.x + this.container.x;
    const y = this.equipmentSlot.y + this.container.y;

    // 폭발 효과
    for (let i = 0; i < 30; i++) {
      const particle = this.scene.add.circle(x, y, 8, 0xFF0000);
      particle.setDepth(150);

      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 150;

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }

    // 화면 흔들림
    this.scene.cameras.main.shake(500, 0.01);
  }

  showMessage(message) {
    const width = this.scene.cameras.main.width;

    const messageText = this.scene.add.text(width / 2, 100, message, {
      font: 'bold 20px Arial',
      fill: '#FF6B6B',
      stroke: '#000000',
      strokeThickness: 4
    });
    messageText.setOrigin(0.5);
    messageText.setDepth(200);

    this.scene.tweens.add({
      targets: messageText,
      alpha: 0,
      y: messageText.y - 50,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        messageText.destroy();
      }
    });
  }

  open() {
    this.isOpen = true;
    this.container.setVisible(true);

    // ESC 키로 닫기
    if (!this.escKey) {
      this.escKey = this.scene.input.keyboard.addKey('ESC');
      this.escKey.on('down', () => {
        if (this.isOpen) {
          this.close();
        }
      });
    }
  }

  close() {
    this.isOpen = false;
    this.container.setVisible(false);
    this.clearEquipmentSlot();
    this.clearStoneSlot();

    if (this.itemSelector) {
      this.itemSelector.destroy();
      this.itemSelector = null;
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * 메뉴 드래그 기능 설정
   */
  setupMenuDrag(menuBg) {
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    // 드래그 이벤트 핸들러 저장
    this.dragPointerMoveHandler = (pointer) => {
      if (isDragging) {
        const minX = -this.uiWidth * 0.8;
        const maxX = this.scene.cameras.main.width - this.uiWidth * 0.2;
        const minY = -this.uiHeight * 0.8;
        const maxY = this.scene.cameras.main.height - this.uiHeight * 0.2;

        const newX = Math.max(minX, Math.min(maxX, pointer.x - dragOffset.x));
        const newY = Math.max(minY, Math.min(maxY, pointer.y - dragOffset.y));

        this.container.x = newX;
        this.container.y = newY;
      }
    };

    this.dragPointerUpHandler = () => {
      if (isDragging) {
        isDragging = false;
        menuBg.setFillStyle(0x1a1a2e);
      }
    };

    // 드래그 시작
    menuBg.on('pointerdown', (pointer) => {
      isDragging = true;
      pointer.event.stopPropagation();

      dragOffset.x = pointer.x - this.container.x;
      dragOffset.y = pointer.y - this.container.y;

      menuBg.setFillStyle(0x333333);
    });

    // 드래그 중
    this.scene.input.on('pointermove', this.dragPointerMoveHandler);

    // 드래그 끝
    this.scene.input.on('pointerup', this.dragPointerUpHandler);

    // 메뉴가 파괴될 때 이벤트 리스너 정리
    this.container.on('destroy', () => {
      this.scene.input.off('pointermove', this.dragPointerMoveHandler);
      this.scene.input.off('pointerup', this.dragPointerUpHandler);
    });
  }
}
