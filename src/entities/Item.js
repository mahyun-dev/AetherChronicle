import Phaser from 'phaser';

/**
 * Item - 아이템 베이스 클래스
 */
export class Item {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.tier = data.tier || 'common';
    this.description = data.description || '';
    this.stackable = data.stackable || false;
    this.maxStack = data.maxStack || 1;
    this.sellPrice = data.sellPrice || 0;
    this.buyPrice = data.buyPrice || 0;
    this.icon = data.icon || 'default';
    
    // 효과 (소모품)
    this.effect = data.effect || null;
    this.cooldown = data.cooldown || 0;
    
    // 현재 수량
    this.quantity = 1;
  }

  /**
   * 아이템 사용
   */
  use(target) {
    if (!this.effect) return false;
    
    switch (this.effect.type) {
      case 'heal_hp':
        target.heal(this.effect.value);
        console.log(`${this.name} 사용: HP +${this.effect.value}`);
        return true;
        
      case 'heal_mp':
        if (target.stats.mp !== undefined) {
          const oldMp = target.stats.mp;
          target.stats.mp = Math.min(
            target.stats.maxMp,
            target.stats.mp + this.effect.value
          );
          const healed = target.stats.mp - oldMp;
          
          // MP 변경 이벤트 발생
          if (target.scene && healed > 0) {
            target.scene.events.emit('player:mp_changed', target.stats.mp, target.stats.maxMp);
          }
          
          console.log(`${this.name} 사용: MP +${healed}`);
          return true;
        }
        break;
        
      default:
        console.warn(`알 수 없는 효과 타입: ${this.effect.type}`);
        return false;
    }
    
    return false;
  }

  /**
   * 아이템 복제
   */
  clone() {
    const cloned = new Item({
      id: this.id,
      name: this.name,
      type: this.type,
      tier: this.tier,
      description: this.description,
      stackable: this.stackable,
      maxStack: this.maxStack,
      sellPrice: this.sellPrice,
      buyPrice: this.buyPrice,
      icon: this.icon,
      effect: this.effect,
      cooldown: this.cooldown
    });
    cloned.quantity = this.quantity;
    return cloned;
  }
}

/**
 * DroppedItem - 필드에 드롭된 아이템 (시각적 표현)
 */
export class DroppedItem extends Phaser.GameObjects.Container {
  constructor(scene, x, y, itemData) {
    super(scene, x, y);
    
    this.scene = scene;
    this.itemData = itemData;
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // 아이템 시각 표현
    try {
      // 실제 아이콘 이미지 사용 시도 (원본 이미지 사용)
      this.sprite = scene.add.image(0, 0, itemData.icon);
      this.sprite.setDisplaySize(44, 44);
      this.sprite.setOrigin(0.5, 0.5);
      console.log(`[DroppedItem] 아이콘 이미지 성공: ${itemData.icon}`);
    } catch (error) {
      console.log(`[DroppedItem] 아이콘 이미지 실패, 기본 원형 사용: ${itemData.icon}`, error);
      const color = this.getTierColor(itemData.tier);
      this.sprite = scene.add.circle(0, 0, 8, color);
    }
    this.add(this.sprite);
    
    // 아이템 이름 텍스트
    this.nameText = scene.add.text(0, -15, itemData.name, {
      font: '10px Arial',
      fill: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.nameText.setOrigin(0.5);
    this.add(this.nameText);
    
    // 깊이 설정
    this.setDepth(5);
    
    // 드롭 애니메이션
    this.playDropAnimation();
    
    // 자동 습득 범위
    this.pickupRange = 50;
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
   * 드롭 애니메이션
   */
  playDropAnimation() {
    // 위로 튀어오르는 효과
    this.y -= 30;
    
    this.scene.tweens.add({
      targets: this,
      y: this.y + 30,
      duration: 300,
      ease: 'Bounce.easeOut'
    });
    
    // 반짝이는 효과
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }

  /**
   * 플레이어가 습득 가능한 범위인지 체크
   */
  canPickup(player) {
    const distance = Phaser.Math.Distance.Between(
      this.x, this.y,
      player.x, player.y
    );
    return distance <= this.pickupRange;
  }

  /**
   * 습득
   */
  pickup(player) {
    console.log(`${this.itemData.name} 습득!`);
    
    // 습득 애니메이션
    this.scene.tweens.add({
      targets: this,
      y: this.y - 30,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.destroy();
      }
    });
    
    return this.itemData;
  }

  update() {
    // 필요시 업데이트 로직
  }
}
