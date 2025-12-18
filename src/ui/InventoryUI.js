import Phaser from 'phaser';

/**
 * InventoryUI - 인벤토리 UI 창
 */
export class InventoryUI {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.inventory = player.inventory;
    
    this.isOpen = false;
    this.container = null;
    this.slotButtons = [];
    
    // 드래그 관련 변수
    this.draggedItem = null;
    this.dragIcon = null;
    
    // 슬롯 설정
    this.slotSize = 50;
    this.slotPadding = 5;
    this.columns = 8;
    this.rows = 6;
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
    console.log('[InventoryUI] open() 호출, isOpen:', this.isOpen);
    if (this.isOpen) return;
    
    this.isOpen = true;
    console.log('[InventoryUI] 인벤토리 창 생성 시작');
    this.create();
    console.log('[InventoryUI] 인벤토리 창 생성 완료');
    
    // 장비 변경 이벤트 리스너 등록
    this.scene.events.on('equipment:changed', this.onEquipmentChanged, this);
  }

  /**
   * UI 닫기
   */
  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    
    if (this.container) {
      this.container.destroy();
      this.container = null;
      this.slotButtons = [];
    }
    
    // 이벤트 리스너 제거
    this.scene.events.off('equipment:changed', this.onEquipmentChanged, this);
  }

  /**
   * 장비 변경 이벤트 핸들러
   */
  onEquipmentChanged(slotKey, equipment) {
    if (!this.isOpen || !this.container) return;
    
    // 인벤토리 슬롯들 업데이트
    this.slotButtons.forEach(slotData => {
      this.updateSlot(slotData);
    });
  }

  /**
   * UI 생성
   */
  create() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // 컨테이너 생성
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(1000);
    this.container.setScrollFactor(0);

    // 인벤토리 창 배경 - 화면 크기의 80% 사용 (최대 1000px)
    const maxPanelWidth = Math.min(width * 0.8, 1000);
    const maxPanelHeight = Math.min(height * 0.85, 900);
    
    // 슬롯 크기 동적 조정
    const availableWidth = maxPanelWidth - 40;
    const dynamicSlotSize = Math.min(50, Math.floor(availableWidth / (this.columns + 1)));
    
    const panelWidth = (dynamicSlotSize + this.slotPadding) * this.columns + 40;
    const panelHeight = Math.min((dynamicSlotSize + this.slotPadding) * this.rows + 140, maxPanelHeight);
    const panelX = width / 2;
    const panelY = height / 2;
    
    // 패널 크기 저장 (드래그 제한 계산용)
    this.panelWidth = panelWidth;
    this.panelHeight = panelHeight;
    
    // 슬롯 사이즈 임시 저장
    const displaySlotSize = dynamicSlotSize;

    const panel = this.scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x2a2a3e, 0.95);
    panel.setStrokeStyle(4, 0xFFD700);
    panel.setInteractive({ useHandCursor: true });
    this.container.add(panel);

    // 드래그 기능 추가
    this.setupMenuDrag(panel);

    // 제목
    const title = this.scene.add.text(panelX, panelY - panelHeight / 2 + 30, '📦 인벤토리', {
      font: 'bold 24px Arial',
      fill: '#FFD700'
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // 닫기 버튼
    const closeBtn = this.scene.add.text(panelX + panelWidth / 2 - 30, panelY - panelHeight / 2 + 30, '✕', {
      font: 'bold 24px Arial',
      fill: '#FFFFFF'
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor('#FF4444'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#FFFFFF'));
    closeBtn.on('pointerdown', () => this.close());
    this.container.add(closeBtn);

    // 인벤토리 슬롯 생성
    const startX = panelX - (this.columns * (displaySlotSize + this.slotPadding)) / 2 + displaySlotSize / 2;
    const startY = panelY - panelHeight / 2 + 80;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        const slotIndex = row * this.columns + col;
        const x = startX + col * (displaySlotSize + this.slotPadding);
        const y = startY + row * (displaySlotSize + this.slotPadding);

        this.createSlot(x, y, slotIndex, displaySlotSize);
      }
    }

    // 퀵슬롯 UI 추가
    this.createQuickSlots(panelX, panelY + panelHeight / 2 - 45);

    // 정보 텍스트
    const infoText = this.scene.add.text(panelX, panelY + panelHeight / 2 - 15, '우클릭: 사용 | Shift+클릭: 강화 | 드래그: 퀵슬롯 설정', {
      font: '12px Arial',
      fill: '#CCCCCC'
    });
    infoText.setOrigin(0.5);
    this.container.add(infoText);
  }

  /**
   * 슬롯 생성
   */
  createSlot(x, y, slotIndex, displaySlotSize = this.slotSize) {
    // 슬롯 배경
    const slotBg = this.scene.add.rectangle(x, y, displaySlotSize, displaySlotSize, 0x1a1a2e);
    slotBg.setStrokeStyle(2, 0x4a4a5e);
    slotBg.setInteractive({ 
      useHandCursor: true,
      draggable: true 
    });
    this.container.add(slotBg);

    // 슬롯 데이터 저장
    const slotData = {
      bg: slotBg,
      index: slotIndex,
      icon: null,
      text: null
    };

    // 아이템 표시
    this.updateSlot(slotData);

    // 이벤트
    slotBg.on('pointerover', () => {
      slotBg.setStrokeStyle(2, 0xFFD700);
      this.showTooltip(slotIndex, x, y);
    });

    slotBg.on('pointerout', () => {
      slotBg.setStrokeStyle(2, 0x4a4a5e);
      this.hideTooltip();
    });

    slotBg.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) {
        // 우클릭 - 아이템 사용
        this.useItem(slotIndex);
      } else if (pointer.leftButtonDown()) {
        const item = this.inventory.slots[slotIndex];
        if (item) {
          // Shift+클릭 - 장비를 강화 UI로 전송
          if (this.scene.input.keyboard.checkDown(this.scene.input.keyboard.addKey('SHIFT'), 0)) {
            if (item.constructor.name === 'Equipment') {
              if (this.scene.enhancementUI) {
                this.scene.enhancementUI.setSelectedEquipment(item);
                this.scene.enhancementUI.open();
                console.log('[InventoryUI] 강화 UI로 장비 전송:', item.name);
              }
            } else {
              console.log('[InventoryUI] 장비 아이템만 강화할 수 있습니다.');
            }
          } else {
            console.log(`슬롯 ${slotIndex} 클릭 - ${item.name}`);
          }
        }
      }
    });

    // 드래그 앤 드롭 이벤트
    slotBg.on('dragstart', (pointer) => {
      const item = this.inventory.slots[slotIndex];
      if (item) {
        this.draggedItem = { item, slotIndex };
        console.log(`[InventoryUI] 드래그 시작: slotIndex=${slotIndex}, item=${item.name}`);
        // 드래그 중인 아이템 표시
        slotBg.setStrokeStyle(2, 0x00FF00);
        
        // 드래그 아이콘 생성
        const iconSize = 20;
        if (item.icon && this.scene.textures.exists(item.icon) && this.scene.textures.get(item.icon).getSourceImage()) {
          // 실제 아이콘 이미지 사용 (소스 이미지가 존재하는지 확인)
          this.dragIcon = this.scene.add.image(pointer.worldX, pointer.worldY, item.icon);
          this.dragIcon.setDisplaySize(iconSize * 2, iconSize * 2);
        } else {
          // 기본 색상 원 (아이콘이 없을 경우)
          const color = this.getTierColor(item.tier);
          this.dragIcon = this.scene.add.circle(pointer.worldX, pointer.worldY, iconSize, color, 0.8);
          this.dragIcon.setStrokeStyle(2, 0xFFFFFF, 0.5);
        }
        this.dragIcon.setOrigin(0.5);
        this.dragIcon.setDepth(1000); // 최상위에 표시
        
        console.log(`[InventoryUI] ${item.name} 드래그 시작`);
      }
    });

    slotBg.on('drag', (pointer, dragX, dragY) => {
      if (this.dragIcon) {
        // 드래그 아이콘을 마우스 위치로 이동
        this.dragIcon.setPosition(pointer.worldX, pointer.worldY);
      }
    });

    slotBg.on('dragend', (pointer) => {
      slotBg.setStrokeStyle(2, 0x4a4a5e);
      
      // 드래그 아이콘 제거
      if (this.dragIcon) {
        this.dragIcon.destroy();
        this.dragIcon = null;
      }
      
      // 드래그가 끝난 위치에서 다른 UI 확인
      if (this.draggedItem && this.draggedItem.item) {
        // EnhancementUI가 열려있는지 확인하고 드랍 처리
        const uiScene = this.scene.scene.get('UIScene');
        if (uiScene && uiScene.enhancementUI && uiScene.enhancementUI.isOpen) {
          uiScene.enhancementUI.handleDragDrop(this.draggedItem.item, pointer);
        } else if (uiScene && uiScene.equipmentUI && uiScene.equipmentUI.isVisible()) {
          // EquipmentUI가 열려있는지 확인하고 드랍 처리
          const equipmentUI = uiScene.equipmentUI;
          
          // 슬롯들과 충돌 확인 (월드 좌표로 변환)
          let dropped = false;
          Object.entries(equipmentUI.slotGraphics).forEach(([slotKey, slotGraphic]) => {
            const worldX = slotGraphic.x + equipmentUI.x;
            const worldY = slotGraphic.y + equipmentUI.y;
            const bounds = slotGraphic.getBounds();
            
            // 화면 좌표로 바운드 생성
            const screenBounds = new Phaser.Geom.Rectangle(
              worldX - bounds.width / 2,
              worldY - bounds.height / 2,
              bounds.width,
              bounds.height
            );
            
            console.log(`[InventoryUI] 드롭 체크: pointer(${pointer.x}, ${pointer.y}), slot ${slotKey} bounds:`, screenBounds);
            
            if (screenBounds.contains(pointer.x, pointer.y)) {
              console.log(`[InventoryUI] 슬롯 ${slotKey}에 드롭 감지!`);
              // 슬롯에 드롭
              equipmentUI.handleDrop(this.draggedItem, slotKey);
              dropped = true;
            }
          });
          
          if (!dropped) {
            // 퀵슬롯 확인
            this.checkQuickSlotDrop(pointer);
          }
        } else {
          // 퀵슬롯 확인
          this.checkQuickSlotDrop(pointer);
        }
      }
      
      this.draggedItem = null;
      console.log('[InventoryUI] 드래그 종료');
    });

    this.slotButtons.push(slotData);
  }

  /**
   * 슬롯 업데이트
   */
  updateSlot(slotData) {
    const item = this.inventory.slots[slotData.index];

    // 기존 아이콘/텍스트 제거
    if (slotData.icon) {
      slotData.icon.destroy();
      slotData.icon = null;
    }
    if (slotData.text) {
      slotData.text.destroy();
      slotData.text = null;
    }

    if (!item) return;

    // 아이템 아이콘
    const iconSize = 20;
    // 아이콘이 실제로 로드되어 있고 소스 이미지가 존재하는지 확인
    if (item.icon && this.scene.textures.exists(item.icon) && this.scene.textures.get(item.icon).getSourceImage()) {
      slotData.icon = this.scene.add.image(slotData.bg.x, slotData.bg.y, item.icon);
      slotData.icon.setDisplaySize(32, 32);
      slotData.icon.setOrigin(0.5, 0.5);
      console.log(`[InventoryUI] 아이콘 이미지 성공: ${item.icon}`);
    } else {
      console.log(`[InventoryUI] 아이콘 이미지 없음 또는 로드되지 않음, 기본 원형 사용: ${item.icon}`);
      const color = this.getTierColor(item.tier);
      slotData.icon = this.scene.add.circle(slotData.bg.x, slotData.bg.y, iconSize, color, 0.8);
      slotData.icon.setStrokeStyle(2, 0xFFFFFF, 0.5);
    }
    this.container.add(slotData.icon);

    // 수량 표시
    if (item.quantity > 1) {
      slotData.text = this.scene.add.text(
        slotData.bg.x + 25,
        slotData.bg.y - 10,
        item.quantity.toString(),
        {
          font: 'bold 10px Arial',
          fill: '#FFFFFF',
          stroke: '#000000',
          strokeThickness: 2
        }
      );
      slotData.text.setOrigin(1, 1);
      this.container.add(slotData.text);
    }
  }

  /**
   * 모든 슬롯 업데이트
   */
  updateAllSlots() {
    if (!this.isOpen) return;

    this.slotButtons.forEach(slotData => {
      this.updateSlot(slotData);
    });

    // 퀵슬롯도 업데이트
    this.updateAllQuickSlots();
  }

  /**
   * 등급별 색상
   */
  getTierColor(tier) {
    const colors = {
      common: 0x808080,
      advanced: 0x00FF00,
      rare: 0x0080FF,
      heroic: 0x8000FF,
      legendary: 0xFF8000
    };
    return colors[tier] || colors.common;
  }

  /**
   * 툴팁 표시
   */
  showTooltip(slotIndex, x, y) {
    const item = this.inventory.slots[slotIndex];
    if (!item) return;

    // 기존 툴팁 제거
    this.hideTooltip();

    // 툴팁 배경
    const tooltipWidth = 200;
    const tooltipHeight = 80;
    this.tooltip = this.scene.add.container(x + this.slotSize / 2 + 10, y + 65);
    this.tooltip.setDepth(1001);

    const bg = this.scene.add.rectangle(0, 0, tooltipWidth, tooltipHeight, 0x1a1a2e, 0.95);
    bg.setStrokeStyle(2, 0xFFD700);
    this.tooltip.add(bg);

    // 아이템 이름
    const nameColor = this.getTierColorHex(item.tier);
    const name = this.scene.add.text(-tooltipWidth / 2 + 10, -tooltipHeight / 2 + 10, item.name, {
      font: 'bold 14px Arial',
      fill: nameColor
    });
    this.tooltip.add(name);

    // 아이템 설명
    const desc = this.scene.add.text(-tooltipWidth / 2 + 10, -tooltipHeight / 2 + 30, item.description, {
      font: '11px Arial',
      fill: '#CCCCCC',
      wordWrap: { width: tooltipWidth - 20 }
    });
    this.tooltip.add(desc);

    this.container.add(this.tooltip);
  }

  /**
   * 툴팁 숨기기
   */
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }
  }

  /**
   * 등급별 색상 (HEX)
   */
  getTierColorHex(tier) {
    const colors = {
      common: '#808080',
      advanced: '#00FF00',
      rare: '#0080FF',
      heroic: '#8000FF',
      legendary: '#FF8000'
    };
    return colors[tier] || colors.common;
  }

  /**
   * 아이템 사용
   */
  useItem(slotIndex) {
    const success = this.inventory.useItem(slotIndex);
    
    if (success) {
      // 슬롯 업데이트
      this.updateAllSlots();
    }
  }

  /**
   * 파괴
   */
  destroy() {
    this.close();
  }

  /**
   * 퀵슬롯 UI 생성
   */
  createQuickSlots(centerX, y) {
    const quickSlotSize = 40;
    const quickSlotPadding = 10;
    const startX = centerX - (3 * (quickSlotSize + quickSlotPadding)) / 2 + quickSlotSize / 2;

    // 퀵슬롯 3개 생성
    for (let i = 0; i < 3; i++) {
      const x = startX + i * (quickSlotSize + quickSlotPadding);
      this.createQuickSlot(x, y, i);
    }
  }

  /**
   * 개별 퀵슬롯 생성
   */
  createQuickSlot(x, y, quickSlotIndex) {
    // 퀵슬롯 배경
    const slotBg = this.scene.add.rectangle(x, y, 40, 40, 0x1a1a2e);
    slotBg.setStrokeStyle(2, 0xFFD700);
    this.container.add(slotBg);

    // 퀵슬롯 번호 표시
    const keyLabels = ['Z', 'X', 'C'];
    const label = this.scene.add.text(x, y - 30, keyLabels[quickSlotIndex], {
      font: 'bold 12px Arial',
      fill: '#FFFFFF'
    });
    label.setOrigin(0.5);
    this.container.add(label);

    // 퀵슬롯 데이터 저장
    const quickSlotData = {
      bg: slotBg,
      label: label,
      index: quickSlotIndex,
      icon: null,
      text: null
    };

    // 퀵슬롯을 드래그 앤 드롭 대상으로 설정
    slotBg.setInteractive({ 
      useHandCursor: true
    });

    slotBg.on('pointerdown', () => {
      // 퀵슬롯 클릭으로 해제
      this.clearQuickSlot(quickSlotIndex);
    });

    // 퀵슬롯 데이터 저장
    if (!this.quickSlotButtons) this.quickSlotButtons = [];
    this.quickSlotButtons[quickSlotIndex] = quickSlotData;

    // 초기 업데이트
    this.updateQuickSlot(quickSlotIndex);
  }

  /**
   * 드래그 앤 드롭으로 퀵슬롯 설정 확인
   */
  checkQuickSlotDrop(pointer) {
    if (!this.quickSlotButtons || !this.draggedItem) return;

    // 각 퀵슬롯 영역 확인
    for (let i = 0; i < this.quickSlotButtons.length; i++) {
      const quickSlotData = this.quickSlotButtons[i];
      if (quickSlotData && quickSlotData.bg) {
        const bounds = quickSlotData.bg.getBounds();
        
        // 드롭 위치가 퀵슬롯 영역 내에 있는지 확인
        if (pointer.worldX >= bounds.left && pointer.worldX <= bounds.right &&
            pointer.worldY >= bounds.top && pointer.worldY <= bounds.bottom) {
          
          // 퀵슬롯에 아이템 설정
          this.setQuickSlot(i, this.draggedItem.slotIndex);
          console.log(`[InventoryUI] 퀵슬롯 ${i + 1}에 아이템 드롭: ${this.draggedItem.item.name}`);
          return;
        }
      }
    }
  }

  /**
   * 퀵슬롯 설정
   */
  setQuickSlot(quickSlotIndex, inventorySlotIndex) {
    const success = this.inventory.setQuickSlot(inventorySlotIndex, quickSlotIndex);
    if (success) {
      this.updateQuickSlot(quickSlotIndex);
      console.log(`[InventoryUI] 퀵슬롯 ${quickSlotIndex + 1}에 아이템 설정`);
    }
  }

  /**
   * 퀵슬롯 해제
   */
  clearQuickSlot(quickSlotIndex) {
    this.inventory.clearQuickSlot(quickSlotIndex);
    this.updateQuickSlot(quickSlotIndex);
    console.log(`[InventoryUI] 퀵슬롯 ${quickSlotIndex + 1} 해제`);
  }

  /**
   * 퀵슬롯 UI 업데이트
   */
  updateQuickSlot(quickSlotIndex) {
    if (!this.quickSlotButtons || !this.quickSlotButtons[quickSlotIndex]) return;

    const quickSlotData = this.quickSlotButtons[quickSlotIndex];
    const slotIndex = this.inventory.quickSlots[quickSlotIndex];

    // 기존 아이콘 제거
    if (quickSlotData.icon) {
      quickSlotData.icon.destroy();
      quickSlotData.icon = null;
    }
    if (quickSlotData.text) {
      quickSlotData.text.destroy();
      quickSlotData.text = null;
    }

    if (slotIndex !== null) {
      const item = this.inventory.slots[slotIndex];
      if (item) {
        // 아이콘 추가
        const iconSize = 15;
        if (item.icon && this.scene.textures.exists(item.icon) && this.scene.textures.get(item.icon).getSourceImage()) {
          // 실제 아이콘 이미지 사용 (소스 이미지 존재 확인)
          const icon = this.scene.add.image(quickSlotData.bg.x, quickSlotData.bg.y, item.icon);
          icon.setDisplaySize(iconSize * 2, iconSize * 2);
          this.container.add(icon);
          quickSlotData.icon = icon;
        } else {
          // 기본 색상 원 (아이콘이 없을 경우)
          const color = this.getTierColor(item.tier);
          const icon = this.scene.add.circle(quickSlotData.bg.x, quickSlotData.bg.y, iconSize, color, 0.8);
          icon.setStrokeStyle(2, 0xFFFFFF, 0.5);
          this.container.add(icon);
          quickSlotData.icon = icon;
        }

        // 수량 표시 (소모품인 경우)
        if (item.quantity > 1) {
          const text = this.scene.add.text(quickSlotData.bg.x + 12, quickSlotData.bg.y + 12, item.quantity.toString(), {
            font: 'bold 10px Arial',
            fill: '#FFFFFF',
            backgroundColor: '#000000',
            padding: { x: 2, y: 1 }
          });
          text.setOrigin(0.5);
          this.container.add(text);
          quickSlotData.text = text;
        }
      }
    }
  }

  /**
   * 모든 퀵슬롯 업데이트
   */
  updateAllQuickSlots() {
    for (let i = 0; i < 3; i++) {
      this.updateQuickSlot(i);
    }
  }

  /**
   * 메뉴 드래그 기능 설정
   */
  setupMenuDrag(menuBg) {
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    // 드래그 이벤트 핸들러 저장 (고유한 이벤트 리스너 관리를 위해)
    this.dragPointerMoveHandler = (pointer) => {
      if (isDragging) {
        // 메뉴 위치 업데이트 (화면 경계 제한 - 창이 완전히 사라지지 않도록)
        const minX = -this.panelWidth * 0.8; // 왼쪽으로 80%까지 허용
        const maxX = this.scene.cameras.main.width - this.panelWidth * 0.2; // 오른쪽으로 20% 보이도록
        const minY = -this.panelHeight * 0.8; // 위쪽으로 80%까지 허용
        const maxY = this.scene.cameras.main.height - this.panelHeight * 0.2; // 아래쪽으로 20% 보이도록

        const newX = Math.max(minX, Math.min(maxX, pointer.x - dragOffset.x));
        const newY = Math.max(minY, Math.min(maxY, pointer.y - dragOffset.y));

        this.container.x = newX;
        this.container.y = newY;
      }
    };

    this.dragPointerUpHandler = () => {
      if (isDragging) {
        isDragging = false;
        // 일반 커서로 복원
        menuBg.setFillStyle(0x2a2a3e);
      }
    };

    // 드래그 시작
    menuBg.on('pointerdown', (pointer) => {
      isDragging = true;
      // 이벤트 전파 막기 (오버레이 클릭 방지)
      pointer.event.stopPropagation();

      // 드래그 시작 시점의 오프셋 계산
      dragOffset.x = pointer.x - this.container.x;
      dragOffset.y = pointer.y - this.container.y;

      // 드래그 커서로 변경
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
