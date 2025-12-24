import Phaser from 'phaser';
import { EquipmentSlot } from '../entities/Equipment.js';

/**
 * EquipmentUI - 장비 창 UI
 * 플레이어의 장비 슬롯을 표시하고 관리
 */
export class EquipmentUI {
  constructor(scene, player, x, y) {
    this.scene = scene;
    this.player = player;
    
    // 화면 사이즈에 맞춰 동적 설정
    const screenWidth = scene.cameras.main.width;
    const screenHeight = scene.cameras.main.height;
    
    this.x = x || screenWidth * 0.1;
    this.y = y || screenHeight * 0.1;
    
    // 화면 크기의 25~30% 범위로 동적 조정 (최소 280, 최대 350)
    this.width = Math.max(280, Math.min(350, screenWidth * 0.27));
    this.height = Math.max(400, Math.min(500, screenHeight * 0.65));
    
    // UI 컨테이너
    this.container = scene.add.container(this.x, this.y);
    this.container.setDepth(1000);
    this.container.setVisible(false);
    
    // 슬롯 정보 (위치 및 라벨) - 동적 계산
    const centerX = this.width / 2;
    const slotYStart = this.height * 0.08 + 50;
    const slotYSpacing = this.height * 0.08 + 30;
    const sidePadding = this.width * 0.15;
    
    this.slotPositions = {
      [EquipmentSlot.WEAPON]: { x: centerX, y: slotYStart, label: '무기' },
      [EquipmentSlot.HELMET]: { x: centerX, y: slotYStart + slotYSpacing, label: '투구' },
      [EquipmentSlot.ARMOR]: { x: centerX, y: slotYStart + slotYSpacing * 2, label: '갑옷' },
      [EquipmentSlot.GLOVES]: { x: sidePadding, y: slotYStart + slotYSpacing * 2, label: '장갑' },
      [EquipmentSlot.BOOTS]: { x: this.width - sidePadding, y: slotYStart + slotYSpacing * 2, label: '신발' },
      [EquipmentSlot.NECKLACE]: { x: centerX, y: slotYStart + slotYSpacing * 3, label: '목걸이' },
      [EquipmentSlot.RING_1]: { x: sidePadding, y: slotYStart + slotYSpacing * 4, label: '반지1' },
      [EquipmentSlot.RING_2]: { x: this.width - sidePadding, y: slotYStart + slotYSpacing * 4, label: '반지2' },
      [EquipmentSlot.BELT]: { x: centerX, y: slotYStart + slotYSpacing * 5, label: '벨트' }
    };
    
    this.slotGraphics = {};
    this.slotTexts = {};
    this.slotIcons = {};
    
    this.createUI();
    this.setupEvents();
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
    
    // 제목 - 폰트 크기 동적 조정
    const fontSize = Math.max(16, Math.min(22, this.width / 15));
    const title = this.scene.add.text(this.width / 2, 15, '⚔️ 장비', {
      font: `bold ${fontSize}px Arial`,
      fill: '#FFD700'
    });
    title.setOrigin(0.5, 0);
    this.container.add(title);
    
    // 캐릭터 실루엣 (중앙) - 동적 위치
    const silhouette = this.scene.add.rectangle(this.width / 2, this.height * 0.35, 40, 60, 0x555555, 0.3);
    this.container.add(silhouette);
    
    // 장비 슬롯 생성
    Object.entries(this.slotPositions).forEach(([slotKey, pos]) => {
      this.createSlot(slotKey, pos);
    });
    
    // 닫기 버튼
    const closeBtn = this.scene.add.text(this.width - 30, 20, '✕', {
      font: 'bold 24px Arial',
      fill: '#FFFFFF'
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hide());
    closeBtn.on('pointerover', () => closeBtn.setColor('#FF0000'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#FFFFFF'));
    this.container.add(closeBtn);
    
    // 총 스탯 표시 영역 (하단)
    // const statsText = this.scene.add.text(10, this.height - 80, '', {
    //   font: '12px Arial',
    //   fill: '#FFFFFF'
    // });
    // this.container.add(statsText);
    // this.totalStatsText = statsText;
    // this.updateTotalStats();
  }
  
  /**
   * 슬롯 생성
   */
  createSlot(slotKey, pos) {
    // 슬롯 배경
    const slot = this.scene.add.rectangle(pos.x, pos.y, 50, 50, 0x333333);
    slot.setStrokeStyle(2, 0x666666);
    slot.setInteractive({ useHandCursor: true });
    this.container.add(slot);
    
    // 슬롯 라벨
    const label = this.scene.add.text(pos.x, pos.y + 35, pos.label, {
      font: '10px Arial',
      fill: '#999999'
    });
    label.setOrigin(0.5);
    this.container.add(label);
    
    // 장비 아이콘 텍스트 (임시)
    const iconText = this.scene.add.text(pos.x, pos.y, '', {
      font: 'bold 12px Arial',
      fill: '#FFD700'
    });
    iconText.setOrigin(0.5);
    this.container.add(iconText);
    
    this.slotGraphics[slotKey] = slot;
    this.slotTexts[slotKey] = iconText;
    
    // 클릭 이벤트
    slot.on('pointerdown', () => this.onSlotClick(slotKey));
    slot.on('pointerover', () => {
      slot.setStrokeStyle(2, 0xFFD700);
      this.showTooltip(slotKey);
    });
    slot.on('pointerout', () => {
      slot.setStrokeStyle(2, 0x666666);
      this.hideTooltip();
    });
  }
  
  /**
   * 슬롯 클릭 처리
   */
  onSlotClick(slotKey) {
    const equipment = this.player.equipment.getEquipment(slotKey);
    
    if (equipment) {
      // Shift 클릭 시 강화 UI로 전송
      if (this.scene.input.keyboard.checkDown(this.scene.input.keyboard.addKey('SHIFT'), 0)) {
        if (this.scene.enhancementUI) {
          this.scene.enhancementUI.setSelectedEquipment(equipment);
          this.scene.enhancementUI.open();
          console.log('[EquipmentUI] 강화 UI로 장비 전송:', equipment.name);
          return;
        }
      }
      
      // 일반 클릭 시 장비 해제
      const unequipped = this.player.equipment.unequip(slotKey);
      if (unequipped) {
        this.player.inventory.addItem(unequipped);
        
        // 인벤토리 UI 수동 업데이트 (이벤트가 작동하지 않을 경우를 대비)
        if (this.scene.inventoryUI && this.scene.inventoryUI.isOpen) {
          this.scene.inventoryUI.slotButtons.forEach(slotData => {
            this.scene.inventoryUI.updateSlot(slotData);
          });
        }
        
        this.scene.events.emit('log', `${unequipped.name}을(를) 해제했습니다.`);
      }
    }
    
    this.updateSlots();
  }
  
  /**
   * 슬롯 업데이트
   */
  updateSlots() {
    Object.keys(this.slotPositions).forEach(slotKey => {
      const equipment = this.player.equipment.getEquipment(slotKey);
      const text = this.slotTexts[slotKey];
      const icon = this.slotIcons[slotKey];
      
      if (equipment) {
        // 기존 아이콘 제거
        if (icon) {
          icon.destroy();
          this.slotIcons[slotKey] = null;
        }
        
        // 장비 아이콘 표시
        const pos = this.slotPositions[slotKey];
        if (equipment.icon && this.scene.textures.exists(equipment.icon)) {
          // 실제 아이콘 이미지 사용
          const newIcon = this.scene.add.image(pos.x, pos.y, equipment.icon);
          newIcon.setDisplaySize(32, 32);
          this.container.add(newIcon);
          this.slotIcons[slotKey] = newIcon;
        }
        
        // 장비 이름 표시 제거 (아이콘이 없을 경우)
        text.setText('');
        text.setColor(equipment.getRarityColor());
      } else {
        // 장비가 없을 때 아이콘 제거
        if (icon) {
          icon.destroy();
          this.slotIcons[slotKey] = null;
        }
        text.setText('');
      }
    });
    
    // this.updateTotalStats();
  }
  
  /**
   * 드롭 처리
   */
  handleDrop(draggedItem, slotKey) {
    console.log(`[EquipmentUI] handleDrop 호출: slotKey=${slotKey}, item=`, draggedItem);
    if (!draggedItem || !draggedItem.item) return;
    
    const item = draggedItem.item;
    const sourceSlotIndex = draggedItem.slotIndex;
    
    // 장비 아이템인지 확인
    if (item.type !== 'weapon' && item.type !== 'helmet' && item.type !== 'armor' && 
        item.type !== 'gloves' && item.type !== 'boots' && item.type !== 'necklace' && 
        item.type !== 'ring' && item.type !== 'belt') {
      console.log('[EquipmentUI] 장비 아이템만 착용할 수 있습니다.');
      return;
    }
    
    // 슬롯 타입 확인
    const slotTypeMap = {
      weapon: 'weapon',
      helmet: 'helmet',
      armor: 'armor',
      gloves: 'gloves',
      boots: 'boots',
      necklace: 'necklace',
      ring1: 'ring',
      ring2: 'ring',
      belt: 'belt'
    };
    
    const requiredType = slotTypeMap[slotKey];
    if (item.type !== requiredType) {
      console.log(`[EquipmentUI] ${item.name}은(는) ${slotKey} 슬롯에 착용할 수 없습니다.`);
      return;
    }
    
    // 인벤토리에서 아이템 제거
    const removed = this.player.inventory.removeItem(sourceSlotIndex, 1);
    console.log(`[EquipmentUI] removeItem 호출: slotIndex=${sourceSlotIndex}, removed=${removed}`);
    if (!removed) {
      console.log('[EquipmentUI] 인벤토리에서 아이템 제거 실패');
      return;
    }
    
    // 기존 장비 해제 (있을 경우)
    const oldEquipment = this.player.equipment.unequip(slotKey);
    if (oldEquipment) {
      // 기존 장비를 인벤토리에 추가
      this.player.inventory.addItem(oldEquipment);
      console.log(`[EquipmentUI] ${oldEquipment.name}을(를) 해제하고 인벤토리에 추가`);
    }
    
    // 새 장비 착용
    const success = this.player.equipment.equipToSlot(slotKey, item);
    if (success) {
      console.log(`[EquipmentUI] ${item.name}을(를) ${slotKey} 슬롯에 착용`);
    } else {
      // 착용 실패 시 인벤토리에 다시 추가
      this.player.inventory.addItem(item);
      console.log(`[EquipmentUI] ${item.name} 착용 실패, 인벤토리로 복귀`);
    }
    
    // UI 업데이트
    this.updateSlots();
    
    // 인벤토리 UI 업데이트
    if (this.scene.inventoryUI && this.scene.inventoryUI.isOpen) {
      this.scene.inventoryUI.slotButtons.forEach(slotData => {
        this.scene.inventoryUI.updateSlot(slotData);
      });
    }
  }
  
  /**
   * 툴팁 표시
   */
  showTooltip(slotKey) {
    const equipment = this.player.equipment.getEquipment(slotKey);
    if (!equipment) return;
    
    if (this.tooltip) {
      this.tooltip.destroy();
    }
    
    const tooltipText = equipment.getTooltipText();
    const lines = tooltipText.split('\n');
    const maxWidth = 250;
    
    const tooltip = this.scene.add.container(this.x + this.width + 10, this.y);
    
    // 배경
    const bg = this.scene.add.rectangle(0, 0, maxWidth, lines.length * 18 + 20, 0x1a1a2e, 0.95);
    bg.setOrigin(0);
    bg.setStrokeStyle(2, equipment.getRarityColor());
    tooltip.add(bg);
    
    // 텍스트
    const text = this.scene.add.text(10, 10, tooltipText, {
      font: '12px Arial',
      fill: '#FFFFFF',
      wordWrap: { width: maxWidth - 20 }
    });
    tooltip.add(text);
    
    tooltip.setDepth(2000);
    this.tooltip = tooltip;
  }
  
  /**
   * 툴팁 숨김
   */
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }
  }
  
  /**
   * 이벤트 설정
   */
  setupEvents() {
    // 장비 변경 이벤트 (GameScene에서 발생하므로 player.scene 사용)
    this.player.scene.events.on('equipment:changed', () => {
      this.updateSlots();
    });
  }
  
  /**
   * 표시
   */
  show() {
    this.container.setVisible(true);
    this.setupEvents();
    this.updateSlots();
  }
  
  /**
   * 숨김
   */
  hide() {
    this.container.setVisible(false);
    this.hideTooltip();
    
    // 이벤트 리스너 제거
    this.player.scene.events.off('equipment:changed');
  }
  
  /**
   * 파괴
   */
  destroy() {
    // 이벤트 리스너 정리
    this.player.scene.events.off('equipment:changed');
    
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
    
    this.hideTooltip();
  }
  
  /**
   * 토글
   */
  toggle() {
    if (this.container.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  /**
   * 표시 여부
   */
  isVisible() {
    return this.container.visible;
  }
  
  /**
   * 정리
   */
  destroy() {
    this.hideTooltip();
    this.container.destroy();
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
        const minX = -this.width * 0.8; // 왼쪽으로 80%까지 허용
        const maxX = this.scene.cameras.main.width - this.width * 0.2; // 오른쪽으로 20% 보이도록
        const minY = -this.height * 0.8; // 위쪽으로 80%까지 허용
        const maxY = this.scene.cameras.main.height - this.height * 0.2; // 아래쪽으로 20% 보이도록

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
        menuBg.setFillStyle(0x1a1a2e);
      }
    };

    // 드래그 시작
    menuBg.on('pointerdown', (pointer) => {
      isDragging = true;
      // 이벤트 전파 막기
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
