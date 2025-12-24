import Phaser from 'phaser';

/**
 * Equipment - 장비 아이템 클래스
 * 무기, 방어구, 액세서리 등 착용 가능한 장비
 */
export class Equipment {
  /**
   * @param {Object} data - 장비 데이터
   */
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type; // 'weapon', 'helmet', 'armor', 'gloves', 'boots', 'necklace', 'ring', 'belt'
    this.weaponType = data.weaponType; // 무기인 경우: 'sword', 'bow', 'staff', 'dagger' etc.
    this.rarity = data.rarity; // 'common', 'uncommon', 'rare', 'epic', 'legendary'
    this.level = data.level || 1; // 요구 레벨
    this.enhanceLevel = data.enhanceLevel || 0; // 강화 단계 (+0 ~ +15)
    
    // 기본 스탯
    this.stats = {
      attack: data.stats?.attack || 0,
      magicAttack: data.stats?.magicAttack || 0,
      defense: data.stats?.defense || 0,
      maxHp: data.stats?.maxHp || 0,
      maxMp: data.stats?.maxMp || 0,
      str: data.stats?.str || 0,
      dex: data.stats?.dex || 0,
      int: data.stats?.int || 0,
      vit: data.stats?.vit || 0,
      attackSpeed: data.stats?.attackSpeed || 0,
      moveSpeed: data.stats?.moveSpeed || 0,
      critRate: data.stats?.critRate || 0,
      critDamage: data.stats?.critDamage || 0
    };
    
    // 특수 옵션
    this.specialEffects = data.specialEffects || [];
    
    // 가격
    this.price = data.price || 0;
    
    // 설명
    this.description = data.description || '';
    
    // 아이콘 (추후 구현)
    this.icon = data.icon || null;
    
    // 수량 (장비는 기본적으로 1개)
    this.quantity = 1;
    this.maxStack = 1; // 장비는 스택 불가
    this.stackable = false;
  }
  
  /**
   * 강화 레벨을 고려한 실제 스탯 반환
   */
  getEnhancedStats() {
    const multiplier = 1 + (this.enhanceLevel * 0.05); // 강화당 +5%
    const enhanced = {};
    
    for (const [key, value] of Object.entries(this.stats)) {
      if (value > 0) {
        enhanced[key] = Math.floor(value * multiplier);
      } else {
        enhanced[key] = value;
      }
    }
    
    return enhanced;
  }
  
  /**
   * 등급별 색상 코드 반환
   */
  getRarityColor() {
    const colors = {
      common: '#9E9E9E',      // 회색
      uncommon: '#4CAF50',    // 초록
      rare: '#2196F3',        // 파랑
      epic: '#9C27B0',        // 보라
      legendary: '#FF9800'    // 주황
    };
    return colors[this.rarity] || colors.common;
  }
  
  /**
   * 등급별 이름 반환
   */
  getRarityName() {
    const names = {
      common: '일반',
      uncommon: '고급',
      rare: '희귀',
      epic: '영웅',
      legendary: '전설'
    };
    return names[this.rarity] || names.common;
  }
  
  /**
   * 복제
   */
  clone() {
    const cloned = new Equipment({
      id: this.id,
      name: this.name,
      type: this.type,
      weaponType: this.weaponType,
      rarity: this.rarity,
      level: this.level,
      enhanceLevel: this.enhanceLevel,
      stats: { ...this.stats },
      specialEffects: [...this.specialEffects],
      price: this.price,
      description: this.description,
      icon: this.icon
    });
    cloned.quantity = this.quantity;
    cloned.maxStack = this.maxStack;
    cloned.stackable = this.stackable;
    return cloned;
  }
  
  /**
   * 강화 최대치 반환
   */
  getMaxEnhanceLevel() {
    const maxLevels = {
      common: 3,
      uncommon: 6,
      rare: 9,
      epic: 12,
      legendary: 15
    };
    return maxLevels[this.rarity] || 3;
  }
  
  /**
   * 장비 타입별 한글 이름
   */
  getTypeNameKorean() {
    const names = {
      weapon: '무기',
      helmet: '투구',
      armor: '갑옷',
      gloves: '장갑',
      boots: '신발',
      necklace: '목걸이',
      ring: '반지',
      belt: '벨트'
    };
    return names[this.type] || '장비';
  }
  
  /**
   * 무기 타입별 한글 이름
   */
  getWeaponTypeNameKorean() {
    if (this.type !== 'weapon') return '';
    
    const names = {
      sword_one: '한손검',
      sword_two: '양손검',
      dagger: '단검',
      bow: '활',
      crossbow: '석궁',
      staff: '지팡이',
      book: '마법서'
    };
    return names[this.weaponType] || '';
  }
  
  /**
   * 툴팁용 전체 정보 문자열 생성
   */
  getTooltipText() {
    const enhancedStats = this.getEnhancedStats();
    let text = `${this.name}`;
    
    if (this.enhanceLevel > 0) {
      text += ` +${this.enhanceLevel}`;
    }
    
    text += `\n${this.getRarityName()} ${this.getTypeNameKorean()}`;
    
    if (this.weaponType) {
      text += ` (${this.getWeaponTypeNameKorean()})`;
    }
    
    text += `\n요구 레벨: ${this.level}`;
    text += `\n\n[스탯]`;
    
    if (enhancedStats.attack > 0) text += `\n공격력: +${enhancedStats.attack}`;
    if (enhancedStats.magicAttack > 0) text += `\n마법 공격력: +${enhancedStats.magicAttack}`;
    if (enhancedStats.defense > 0) text += `\n방어력: +${enhancedStats.defense}`;
    if (enhancedStats.maxHp > 0) text += `\nHP: +${enhancedStats.maxHp}`;
    if (enhancedStats.maxMp > 0) text += `\nMP: +${enhancedStats.maxMp}`;
    if (enhancedStats.str > 0) text += `\n힘: +${enhancedStats.str}`;
    if (enhancedStats.dex > 0) text += `\n민첩: +${enhancedStats.dex}`;
    if (enhancedStats.int > 0) text += `\n지능: +${enhancedStats.int}`;
    if (enhancedStats.vit > 0) text += `\n체력: +${enhancedStats.vit}`;
    if (enhancedStats.attackSpeed > 0) text += `\n공격 속도: +${enhancedStats.attackSpeed}%`;
    if (enhancedStats.moveSpeed > 0) text += `\n이동 속도: +${enhancedStats.moveSpeed}`;
    if (enhancedStats.critRate > 0) text += `\n치명타 확률: +${enhancedStats.critRate}%`;
    if (enhancedStats.critDamage > 0) text += `\n치명타 피해: +${enhancedStats.critDamage}%`;
    
    if (this.specialEffects.length > 0) {
      text += `\n\n[특수 효과]`;
      this.specialEffects.forEach(effect => {
        text += `\n${effect}`;
      });
    }
    
    if (this.description) {
      text += `\n\n${this.description}`;
    }
    
    text += `\n\n판매 가격: ${this.price} 골드`;
    
    return text;
  }
  
  /**
   * 장비 복제 (인벤토리 이동 시 사용)
   */
  clone() {
    return new Equipment({
      id: this.id,
      name: this.name,
      type: this.type,
      weaponType: this.weaponType,
      rarity: this.rarity,
      level: this.level,
      enhanceLevel: this.enhanceLevel,
      stats: { ...this.stats },
      specialEffects: [...this.specialEffects],
      price: this.price,
      description: this.description,
      icon: this.icon
    });
  }
  
  /**
   * 강화 성공 확률 계산
   */
  getEnhanceSuccessRate() {
    const baseRates = {
      common: [100, 100, 90, 80],
      uncommon: [100, 95, 85, 75, 65, 55, 45],
      rare: [100, 90, 80, 70, 60, 50, 40, 30, 20, 10],
      epic: [100, 85, 75, 65, 55, 45, 35, 25, 20, 15, 10, 8, 5],
      legendary: [100, 80, 70, 60, 50, 40, 30, 25, 20, 15, 12, 10, 8, 6, 5, 3]
    };
    
    const rates = baseRates[this.rarity] || baseRates.common;
    return rates[this.enhanceLevel] || 1;
  }
  
  /**
   * 강화 비용 계산
   */
  getEnhanceCost() {
    const baseCost = this.price * 0.1;
    const levelMultiplier = Math.pow(1.5, this.enhanceLevel);
    const rarityMultiplier = {
      common: 1,
      uncommon: 1.5,
      rare: 2,
      epic: 3,
      legendary: 5
    };
    
    return Math.floor(baseCost * levelMultiplier * (rarityMultiplier[this.rarity] || 1));
  }
  
  /**
   * 강화 재료 요구량 계산
   */
  getEnhanceMaterialCost() {
    const rarityMaterials = {
      common: { id: 'enhancement_stone_basic', name: '기본 강화석' },
      uncommon: { id: 'enhancement_stone_basic', name: '기본 강화석' },
      rare: { id: 'enhancement_stone_advanced', name: '고급 강화석' },
      epic: { id: 'enhancement_stone_rare', name: '희귀 강화석' },
      legendary: { id: 'enhancement_stone_legendary', name: '전설 강화석' }
    };
    
    const material = rarityMaterials[this.rarity] || rarityMaterials.common;
    const amount = Math.floor(Math.pow(2, Math.floor(this.enhanceLevel / 3))) + this.enhanceLevel;
    
    return {
      materialId: material.id,
      materialName: material.name,
      amount: amount
    };
  }
  
  /**
   * 강화 시도
   * @returns {Object} { success: boolean, destroyed: boolean, newLevel: number }
   */
  attemptEnhance() {
    const maxLevel = this.getMaxEnhanceLevel();
    
    if (this.enhanceLevel >= maxLevel) {
      return { success: false, destroyed: false, newLevel: this.enhanceLevel, message: '최대 강화 레벨입니다.' };
    }
    
    const successRate = this.getEnhanceSuccessRate();
    const roll = Math.random() * 100;
    
    if (roll < successRate) {
      // 강화 성공
      this.enhanceLevel++;
      return { success: true, destroyed: false, newLevel: this.enhanceLevel, message: '강화 성공!' };
    } else {
      // 강화 실패
      if (this.enhanceLevel >= 5) {
        // +5 이상에서는 파괴 가능성
        const destroyRate = Math.max(5, 30 - successRate); // 성공률이 낮을수록 파괴율 높음
        const destroyRoll = Math.random() * 100;
        
        if (destroyRoll < destroyRate) {
          return { success: false, destroyed: true, newLevel: this.enhanceLevel, message: '장비가 파괴되었습니다!' };
        }
      }
      
      // 레벨 하락 (일반 실패)
      if (this.enhanceLevel >= 3) {
        this.enhanceLevel = Math.max(0, this.enhanceLevel - 1);
        return { success: false, destroyed: false, newLevel: this.enhanceLevel, message: '강화 실패 - 레벨 하락' };
      }
      
      return { success: false, destroyed: false, newLevel: this.enhanceLevel, message: '강화 실패' };
    }
  }
}

/**
 * EquipmentSlot - 장비 슬롯 정의
 */
export const EquipmentSlot = {
  WEAPON: 'weapon',
  HELMET: 'helmet',
  ARMOR: 'armor',
  GLOVES: 'gloves',
  BOOTS: 'boots',
  NECKLACE: 'necklace',
  RING_1: 'ring_1',
  RING_2: 'ring_2',
  BELT: 'belt'
};

/**
 * EquipmentManager - 장비 관리 클래스
 */
export class EquipmentManager {
  constructor(player) {
    this.player = player;
    
    // 장비 슬롯 (9개)
    this.slots = {
      [EquipmentSlot.WEAPON]: null,
      [EquipmentSlot.HELMET]: null,
      [EquipmentSlot.ARMOR]: null,
      [EquipmentSlot.GLOVES]: null,
      [EquipmentSlot.BOOTS]: null,
      [EquipmentSlot.NECKLACE]: null,
      [EquipmentSlot.RING_1]: null,
      [EquipmentSlot.RING_2]: null,
      [EquipmentSlot.BELT]: null
    };
  }
  
  /**
   * 장비 착용
   * @param {Equipment} equipment - 착용할 장비
   * @returns {Equipment|null} - 기존에 착용중이던 장비 (교체된 경우)
   */
  equip(equipment) {
    if (!equipment) return null;
    
    // 레벨 요구사항 확인
    if (this.player.stats.level < equipment.level) {
      console.log(`[EquipmentManager] 레벨이 부족합니다. 요구 레벨: ${equipment.level}`);
      return null;
    }
    
    // 슬롯 결정
    let slotKey = equipment.type;
    
    // 반지는 빈 슬롯에 착용
    if (equipment.type === 'ring') {
      if (!this.slots[EquipmentSlot.RING_1]) {
        slotKey = EquipmentSlot.RING_1;
      } else if (!this.slots[EquipmentSlot.RING_2]) {
        slotKey = EquipmentSlot.RING_2;
      } else {
        // 두 슬롯 다 차있으면 첫 번째 슬롯 교체
        slotKey = EquipmentSlot.RING_1;
      }
    }
    
    // 기존 장비 제거
    const oldEquipment = this.slots[slotKey];
    if (oldEquipment) {
      this.removeEquipmentStats(oldEquipment);
      // 기존 장비 효과 제거
      if (this.player.equipmentEffects) {
        this.player.equipmentEffects.removeEquipmentEffects(oldEquipment);
      }
    }
    
    // 새 장비 착용
    this.slots[slotKey] = equipment;
    this.applyEquipmentStats(equipment);
    
    // 장비 효과 적용
    if (this.player.equipmentEffects) {
      this.player.equipmentEffects.applyEquipmentEffects(equipment);
    }
    
    // 스탯 재계산
    if (this.player.calculateStats) {
      this.player.calculateStats();
    }
    
    // 이벤트 발생
    this.player.scene.events.emit('equipment:changed', slotKey, equipment);
    
    // HP/MP 변경 이벤트 발생 (UI 업데이트용)
    console.log(`[Equipment] 장비 착용 후 HP: ${this.player.stats.hp}/${this.player.stats.maxHp}, MP: ${this.player.stats.mp}/${this.player.stats.maxMp}`);
    this.player.scene.events.emit('player:hp_changed', this.player.stats.hp, this.player.stats.maxHp);
    this.player.scene.events.emit('player:mp_changed', this.player.stats.mp, this.player.stats.maxMp);
    
    return oldEquipment;
  }
  
  /**
   * 특정 슬롯에 장비 착용 (드래그 앤 드랍용)
   * @param {string} slotKey - 슬롯 키
   * @param {Equipment} equipment - 착용할 장비
   * @returns {Equipment|null} - 기존에 착용중이던 장비 (교체된 경우)
   */
  equipToSlot(slotKey, equipment) {
    if (!equipment) return null;
    
    // 레벨 요구사항 확인
    if (this.player.stats.level < equipment.level) {
      console.log(`[EquipmentManager] 레벨이 부족합니다. 요구 레벨: ${equipment.level}`);
      return null;
    }
    
    // 슬롯 타입 검증
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
    if (equipment.type !== requiredType) {
      console.log(`[EquipmentManager] ${equipment.name}은(는) ${slotKey} 슬롯에 착용할 수 없습니다.`);
      return null;
    }
    
    // 기존 장비 제거
    const oldEquipment = this.unequip(slotKey);
    
    // 새 장비 착용
    this.slots[slotKey] = equipment;
    this.applyEquipmentStats(equipment);
    
    // 장비 효과 적용
    if (this.player.equipmentEffects) {
      this.player.equipmentEffects.applyEquipmentEffects(equipment);
    }
    
    // 스탯 재계산
    if (this.player.calculateStats) {
      this.player.calculateStats();
    }
    
    // 이벤트 발생
    this.player.scene.events.emit('equipment:changed', slotKey, equipment);
    
    // HP/MP 변경 이벤트 발생 (UI 업데이트용)
    this.player.scene.events.emit('player:hp_changed', this.player.stats.hp, this.player.stats.maxHp);
    this.player.scene.events.emit('player:mp_changed', this.player.stats.mp, this.player.stats.maxMp);
    
    return true; // 성공
  }
  
  /**
   * 장비 해제
   * @param {string} slotKey - 슬롯 키
   * @returns {Equipment|null} - 해제된 장비
   */
  unequip(slotKey) {
    const equipment = this.slots[slotKey];
    if (!equipment) return null;
    
    this.removeEquipmentStats(equipment);
    
    // 장비 효과 제거
    if (this.player.equipmentEffects) {
      this.player.equipmentEffects.removeEquipmentEffects(equipment);
    }
    
    this.slots[slotKey] = null;
    
    // 스탯 재계산
    if (this.player.calculateStats) {
      this.player.calculateStats();
    }
    
    console.log(`[EquipmentManager] ${equipment.name} 해제 완료`);
    
    // 이벤트 발생
    this.player.scene.events.emit('equipment:changed', slotKey, null);
    
    // HP/MP 변경 이벤트 발생 (UI 업데이트용)
    console.log(`[Equipment] 장비 해제 후 HP: ${this.player.stats.hp}/${this.player.stats.maxHp}, MP: ${this.player.stats.mp}/${this.player.stats.maxMp}`);
    this.player.scene.events.emit('player:hp_changed', this.player.stats.hp, this.player.stats.maxHp);
    this.player.scene.events.emit('player:mp_changed', this.player.stats.mp, this.player.stats.maxMp);
    
    return equipment;
  }
  
  /**
   * 장비 스탯 적용
   */
  applyEquipmentStats(equipment) {
    const stats = equipment.getEnhancedStats();
    
    console.log(`[Equipment] ${equipment.name} 착용 전 - HP: ${this.player.stats.hp}/${this.player.stats.maxHp}, MP: ${this.player.stats.mp}/${this.player.stats.maxMp}`);
    
    // 기본 스탯 적용
    this.player.stats.attack += stats.attack || 0;
    this.player.stats.magicAttack += stats.magicAttack || 0;
    this.player.stats.defense += stats.defense || 0;
    this.player.stats.maxHp += stats.maxHp || 0;
    this.player.stats.maxMp += stats.maxMp || 0;
    this.player.stats.str += stats.str || 0;
    this.player.stats.dex += stats.dex || 0;
    this.player.stats.int += stats.int || 0;
    this.player.stats.vit += stats.vit || 0;
    this.player.stats.attackSpeed += stats.attackSpeed || 0;
    this.player.stats.moveSpeed += stats.moveSpeed || 0;
    this.player.stats.critRate += stats.critRate || 0;
    this.player.stats.critDamage += stats.critDamage || 0;
    this.player.stats.evasion += stats.evasion || 0;
    
    // 현재 HP/MP가 최대치를 초과하지 않도록 조정
    if (this.player.stats.hp > this.player.stats.maxHp) {
      this.player.stats.hp = this.player.stats.maxHp;
    }
    if (this.player.stats.mp > this.player.stats.maxMp) {
      this.player.stats.mp = this.player.stats.maxMp;
    }
    
    // 이동 속도 적용
    if (stats.moveSpeed > 0) {
      this.player.body.setMaxVelocity(this.player.stats.speed + stats.moveSpeed);
    }
    
    console.log(`[Equipment] ${equipment.name} 착용 후 - HP: ${this.player.stats.hp}/${this.player.stats.maxHp}, MP: ${this.player.stats.mp}/${this.player.stats.maxMp}`);
    console.log(`[EquipmentManager] 스탯 적용: ${equipment.name}`, stats);
  }
  
  /**
   * 장비 스탯 제거
   */
  removeEquipmentStats(equipment) {
    const stats = equipment.getEnhancedStats();
    
    console.log(`[Equipment] ${equipment.name} 해제 전 - HP: ${this.player.stats.hp}/${this.player.stats.maxHp}, MP: ${this.player.stats.mp}/${this.player.stats.maxMp}`);
    
    this.player.stats.attack -= stats.attack || 0;
    this.player.stats.magicAttack -= stats.magicAttack || 0;
    this.player.stats.defense -= stats.defense || 0;
    this.player.stats.maxHp -= stats.maxHp || 0;
    this.player.stats.maxMp -= stats.maxMp || 0;
    this.player.stats.str -= stats.str || 0;
    this.player.stats.dex -= stats.dex || 0;
    this.player.stats.int -= stats.int || 0;
    this.player.stats.vit -= stats.vit || 0;
    this.player.stats.attackSpeed -= stats.attackSpeed || 0;
    this.player.stats.moveSpeed -= stats.moveSpeed || 0;
    this.player.stats.critRate -= stats.critRate || 0;
    this.player.stats.critDamage -= stats.critDamage || 0;
    this.player.stats.evasion -= stats.evasion || 0;
    
    // 현재 HP/MP가 최대치를 초과하지 않도록 조정
    if (this.player.stats.hp > this.player.stats.maxHp) {
      this.player.stats.hp = this.player.stats.maxHp;
    }
    if (this.player.stats.mp > this.player.stats.maxMp) {
      this.player.stats.mp = this.player.stats.maxMp;
    }
    
    // 이동 속도 적용
    if (stats.moveSpeed !== 0) {
      this.player.body.setMaxVelocity(this.player.stats.speed);
    }
    
    console.log(`[Equipment] ${equipment.name} 해제 후 - HP: ${this.player.stats.hp}/${this.player.stats.maxHp}, MP: ${this.player.stats.mp}/${this.player.stats.maxMp}`);
    console.log(`[EquipmentManager] 스탯 제거: ${equipment.name}`, stats);
  }
  
  /**
   * 특정 슬롯의 장비 가져오기
   */
  getEquipment(slotKey) {
    return this.slots[slotKey];
  }
  
  /**
   * 모든 장비 가져오기
   */
  getAllEquipments() {
    return { ...this.slots };
  }
  
  /**
   * 장비 착용 여부 확인
   */
  isEquipped(equipment) {
    return Object.values(this.slots).some(eq => eq && eq.id === equipment.id);
  }
  
  /**
   * 총 스탯 보너스 계산
   */
  getTotalStatBonus() {
    const total = {
      attack: 0,
      magicAttack: 0,
      defense: 0,
      maxHp: 0,
      maxMp: 0,
      str: 0,
      dex: 0,
      int: 0,
      vit: 0,
      attackSpeed: 0,
      moveSpeed: 0,
      critRate: 0,
      critDamage: 0
    };
    
    Object.values(this.slots).forEach(equipment => {
      if (equipment) {
        const stats = equipment.getEnhancedStats();
        Object.keys(total).forEach(key => {
          total[key] += stats[key] || 0;
        });
      }
    });
    
    return total;
  }
  
  /**
   * 모든 장비 스탯 재계산 (강화 후 호출)
   */
  updateAllStats() {
    // 모든 장비를 벗고 다시 착용하여 스탯 재계산
    const equippedItems = [];
    
    // 현재 장비들 저장
    Object.entries(this.slots).forEach(([slotKey, equipment]) => {
      if (equipment) {
        equippedItems.push({ slotKey, equipment });
        this.removeEquipmentStats(equipment);
      }
    });
    
    // 다시 착용하여 스탯 재적용
    equippedItems.forEach(({ equipment }) => {
      this.applyEquipmentStats(equipment);
    });
    
    console.log('[EquipmentManager] 모든 장비 스탯 재계산 완료');
  }
}
