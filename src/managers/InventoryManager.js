/**
 * InventoryManager - 플레이어 인벤토리 관리
 */
export class InventoryManager {
  constructor(player) {
    this.player = player;
    
    // 인벤토리 슬롯 (48개)
    this.slots = new Array(48).fill(null);
    this.maxSlots = 48;
    
    // 장비 슬롯
    this.equipment = {
      weapon: null,
      helmet: null,
      armor: null,
      gloves: null,
      boots: null,
      necklace: null,
      ring1: null,
      ring2: null,
      belt: null
    };
    
    // 퀵슬롯 (3개)
    this.quickSlots = [null, null, null];
  }

  /**
   * 아이템 추가
   */
  addItem(item) {
    // 퀘스트 진행도 업데이트 (아이템 획득)
    if (this.player && this.player.questManager) {
      this.player.questManager.updateProgress('collect', item.id, item.quantity);
    }
    
    // 스택 가능한 아이템인 경우 기존 슬롯에 추가 시도
    if (item.stackable) {
      for (let i = 0; i < this.maxSlots; i++) {
        const slotItem = this.slots[i];
        if (slotItem && slotItem.id === item.id) {
          // 같은 아이템 발견, 스택 가능 여부 확인
          if (slotItem.quantity + item.quantity <= item.maxStack) {
            slotItem.quantity += item.quantity;
            console.log(`[Inventory] ${item.name} x${item.quantity} 추가 (스택)`);
            return true;
          } else {
            // 스택 최대치 초과, 일부만 추가
            const addable = item.maxStack - slotItem.quantity;
            slotItem.quantity = item.maxStack;
            item.quantity -= addable;
            
            if (item.quantity > 0) {
              // 남은 수량은 새 슬롯에 추가
              continue;
            } else {
              return true;
            }
          }
        }
      }
    }
    
    // 빈 슬롯 찾기
    for (let i = 0; i < this.maxSlots; i++) {
      if (this.slots[i] === null) {
        this.slots[i] = item.clone();
        console.log(`[Inventory] ${item.name} x${item.quantity || 1} 추가 (슬롯 ${i})`);
        return true;
      }
    }
    
    console.warn('[Inventory] 인벤토리가 가득 찼습니다!');
    return false;
  }

  /**
   * 아이템 제거 (슬롯 인덱스로)
   */
  removeItem(slotIndexOrItemId, quantity = 1) {
    // itemId로 전달된 경우 (문자열)
    if (typeof slotIndexOrItemId === 'string') {
      return this.removeItemById(slotIndexOrItemId, quantity);
    }
    
    // 슬롯 인덱스로 전달된 경우 (숫자)
    const slotIndex = slotIndexOrItemId;
    if (slotIndex < 0 || slotIndex >= this.maxSlots) return false;
    
    const item = this.slots[slotIndex];
    if (!item) return false;
    
    // quantity가 undefined인 경우 1로 설정 (장비 등)
    if (item.quantity === undefined) {
      item.quantity = 1;
    }
    
    if (item.quantity <= quantity) {
      // 전체 제거
      this.slots[slotIndex] = null;
      console.log(`[Inventory] ${item.name} 제거`);
    } else {
      // 일부 제거
      item.quantity -= quantity;
      console.log(`[Inventory] ${item.name} x${quantity} 제거 (남은 수량: ${item.quantity})`);
    }
    
    return true;
  }
  
  /**
   * 아이템 제거 (아이템 ID로)
   */
  removeItemById(itemId, quantity = 1) {
    let remaining = quantity;
    
    for (let i = 0; i < this.maxSlots; i++) {
      const item = this.slots[i];
      if (item && item.id === itemId) {
        const removeAmount = Math.min(item.quantity, remaining);
        
        if (item.quantity <= removeAmount) {
          this.slots[i] = null;
        } else {
          item.quantity -= removeAmount;
        }
        
        remaining -= removeAmount;
        
        if (remaining <= 0) {
          console.log(`[Inventory] ${itemId} x${quantity} 제거 완료`);
          return true;
        }
      }
    }
    
    if (remaining > 0) {
      console.warn(`[Inventory] ${itemId}이(가) 부족합니다. (필요: ${quantity}, 부족: ${remaining})`);
      return false;
    }
    
    return true;
  }

  /**
   * 아이템 사용
   */
  useItem(slotIndex) {
    if (slotIndex < 0 || slotIndex >= this.maxSlots) return false;
    
    const item = this.slots[slotIndex];
    if (!item) return false;
    
    // 장비 아이템인 경우 착용
    if (item.type === 'weapon' || item.type === 'helmet' || item.type === 'armor' || 
        item.type === 'gloves' || item.type === 'boots' || item.type === 'necklace' || 
        item.type === 'ring' || item.type === 'belt') {
      return this.equipItem(slotIndex);
    }
    
    // 소모품만 사용 가능
    if (item.type !== 'consumable') {
      console.log(`[Inventory] ${item.name}은(는) 사용할 수 없습니다.`);
      return false;
    }
    
    // 아이템 효과 적용
    const success = item.use(this.player);
    
    if (success) {
      // 사용 성공 시 수량 감소
      this.removeItem(slotIndex, 1);
      return true;
    }
    
    return false;
  }
  
  /**
   * 장비 착용
   */
  equipItem(slotIndex) {
    if (slotIndex < 0 || slotIndex >= this.maxSlots) return false;
    
    const item = this.slots[slotIndex];
    if (!item) return false;
    
    // Equipment 클래스 확인
    if (!this.player.equipment) {
      console.warn('[Inventory] 장비 시스템이 초기화되지 않았습니다.');
      return false;
    }
    
    // 인벤토리에서 제거
    this.slots[slotIndex] = null;
    
    // 장비 착용 (기존 장비가 있으면 반환됨)
    const oldEquipment = this.player.equipment.equip(item);
    
    // 교체된 장비가 있으면 인벤토리에 추가
    if (oldEquipment) {
      this.addItem(oldEquipment);
    }
    
    console.log(`[Inventory] ${item.name} 착용 완료`);
    return true;
  }

  /**
   * 아이템 이동
   */
  moveItem(fromSlot, toSlot) {
    if (fromSlot < 0 || fromSlot >= this.maxSlots) return false;
    if (toSlot < 0 || toSlot >= this.maxSlots) return false;
    if (fromSlot === toSlot) return false;
    
    const fromItem = this.slots[fromSlot];
    const toItem = this.slots[toSlot];
    
    if (!fromItem) return false;
    
    // 대상 슬롯이 비어있으면 이동
    if (!toItem) {
      this.slots[toSlot] = fromItem;
      this.slots[fromSlot] = null;
      console.log(`[Inventory] 슬롯 ${fromSlot} → ${toSlot} 이동`);
      return true;
    }
    
    // 같은 아이템이면 스택 시도
    if (fromItem.id === toItem.id && fromItem.stackable) {
      if (toItem.quantity + fromItem.quantity <= toItem.maxStack) {
        toItem.quantity += fromItem.quantity;
        this.slots[fromSlot] = null;
        console.log(`[Inventory] 스택 병합 완료`);
        return true;
      }
    }
    
    // 아이템 교환
    this.slots[fromSlot] = toItem;
    this.slots[toSlot] = fromItem;
    console.log(`[Inventory] 슬롯 ${fromSlot} ↔ ${toSlot} 교환`);
    return true;
  }

  /**
   * 퀵슬롯에 아이템 등록
   */
  setQuickSlot(slotIndex, quickSlotIndex) {
    if (slotIndex < 0 || slotIndex >= this.maxSlots) return false;
    if (quickSlotIndex < 0 || quickSlotIndex >= 3) return false;
    
    const item = this.slots[slotIndex];
    if (!item) return false;
    
    // 소모품만 퀵슬롯 등록 가능
    if (item.type !== 'consumable') {
      console.log('[Inventory] 소모품만 퀵슬롯에 등록할 수 있습니다.');
      return false;
    }
    
    this.quickSlots[quickSlotIndex] = slotIndex;
    console.log(`[Inventory] ${item.name}을(를) 퀵슬롯 ${quickSlotIndex + 1}에 등록`);
    return true;
  }

  /**
   * 퀵슬롯 아이템 사용
   */
  useQuickSlot(quickSlotIndex) {
    if (quickSlotIndex < 0 || quickSlotIndex >= 3) return false;
    
    const slotIndex = this.quickSlots[quickSlotIndex];
    if (slotIndex === null) {
      console.log('[Inventory] 퀵슬롯이 비어있습니다.');
      return false;
    }
    
    return this.useItem(slotIndex);
  }

  /**
   * 특정 아이템 개수 확인
   */
  getItemCount(itemId) {
    let count = 0;
    this.slots.forEach(item => {
      if (item && item.id === itemId) {
        count += item.quantity;
      }
    });
    return count;
  }

  /**
   * 특정 아이템 보유 여부
   */
  hasItem(itemId, quantity = 1) {
    return this.getItemCount(itemId) >= quantity;
  }

  /**
   * 빈 슬롯 개수
   */
  getEmptySlotCount() {
    return this.slots.filter(slot => slot === null).length;
  }

  /**
   * 인벤토리 정렬
   */
  sort() {
    // null이 아닌 아이템만 추출
    const items = this.slots.filter(item => item !== null);
    
    // 타입별, 이름별 정렬
    items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }
      return a.name.localeCompare(b.name);
    });
    
    // 슬롯 초기화 후 재배치
    this.slots.fill(null);
    items.forEach((item, index) => {
      this.slots[index] = item;
    });
    
    console.log('[Inventory] 인벤토리 정렬 완료');
  }

  /**
   * 퀵슬롯 해제
   */
  clearQuickSlot(quickSlotIndex) {
    if (quickSlotIndex < 0 || quickSlotIndex >= 3) return;
    
    this.quickSlots[quickSlotIndex] = null;
    console.log(`[Inventory] 퀵슬롯 ${quickSlotIndex + 1} 해제`);
  }
}
