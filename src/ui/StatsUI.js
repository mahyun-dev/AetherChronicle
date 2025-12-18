import Phaser from 'phaser';

/**
 * StatsUI - 플레이어 스탯 창 UI
 */
export class StatsUI {
  constructor(scene, player, x, y) {
    this.scene = scene;
    this.player = player;

    // 화면 사이즈에 맞춰 동적 설정
    const screenWidth = scene.cameras.main.width;
    const screenHeight = scene.cameras.main.height;

    this.x = x || screenWidth * 0.7;
    this.y = y || screenHeight * 0.1;

    // 화면 크기의 20~25% 범위로 동적 조정
    this.width = Math.max(300, Math.min(400, screenWidth * 0.25));
    this.height = Math.max(500, Math.min(600, screenHeight * 0.75));

    // UI 컨테이너
    this.container = scene.add.container(this.x, this.y);
    this.container.setDepth(1000);
    this.container.setVisible(false);

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

    // 제목
    const fontSize = Math.max(16, Math.min(22, this.width / 15));
    const title = this.scene.add.text(this.width / 2, 15, '📊 스탯', {
      font: `bold ${fontSize}px Arial`,
      fill: '#FFD700'
    });
    title.setOrigin(0.5, 0);
    this.container.add(title);

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

    // 스탯 표시 영역
    this.createStatsDisplay();
  }

  /**
   * 스탯 표시 생성
   */
  createStatsDisplay() {
    const startY = 60;
    const lineHeight = 25;
    const leftX = 20;
    const rightX = this.width / 2 + 20;

    // 기본 스탯
    const basicStats = [
      { label: '레벨', key: 'level' },
      { label: '경험치', key: 'exp' },
      { label: 'HP', key: 'hp', maxKey: 'maxHp' },
      { label: 'MP', key: 'mp', maxKey: 'maxMp' },
      { label: '공격력', key: 'attack' },
      { label: '방어력', key: 'defense' },
      { label: '이동속도', key: 'speed' },
      { label: '치명타 확률', key: 'critRate', suffix: '%' },
      { label: '치명타 피해', key: 'critDamage', suffix: '%' },
      { label: '회피율', key: 'evasion', suffix: '%' }
    ];

    // 확장 스탯
    const extendedStats = [
      { label: 'STR', key: 'str' },
      { label: 'DEX', key: 'dex' },
      { label: 'INT', key: 'int' },
      { label: 'VIT', key: 'vit' },
      { label: '공격속도', key: 'attackSpeed' },
      { label: '이동속도 보너스', key: 'moveSpeed' }
    ];

    // 스탯 포인트
    const statPointY = startY + 10;
    this.statPointText = this.scene.add.text(leftX, statPointY, '⭐ 스탯 포인트: 0', {
      font: '16px Arial',
      fill: '#FF6B6B'
    });
    this.container.add(this.statPointText);

    // 기본 스탯
    let y = statPointY + lineHeight;
    // 기본 스탯 간격 추가
    y += 10;
    basicStats.forEach(stat => {
      const text = this.scene.add.text(leftX, y, `${stat.label}: 0`, {
        font: '14px Arial',
        fill: '#FFFFFF'
      });
      this.container.add(text);
      stat.text = text;
      y += lineHeight;
    });

    // 확장 스탯 간격 추가
    y += 10;

    // 확장 스탯 (STR, DEX, INT, VIT)
    const extendedKeys = ['str', 'dex', 'int', 'vit'];
    extendedKeys.forEach(key => {
      const stat = extendedStats.find(s => s.key === key);
      if (stat) {
        const text = this.scene.add.text(leftX, y, `${stat.label}: 0`, {
          font: '14px Arial',
          fill: '#FFFFFF'
        });
        this.container.add(text);
        stat.text = text;
        
        // 증가 버튼
        const button = this.scene.add.text(leftX + 60, y, '+', {
          font: 'bold 14px Arial',
          fill: '#00FF00'
        });
        button.setInteractive({ useHandCursor: true });
        button.on('pointerdown', () => this.increaseStat(stat.key));
        button.on('pointerover', () => button.setColor('#FFFF00'));
        button.on('pointerout', () => button.setColor('#00FF00'));
        this.container.add(button);
        stat.button = button;
        
        y += lineHeight;
      }
    });

    // 구분선
    const separatorY = startY + lineHeight * 2 + 200;
    const separator = this.scene.add.rectangle(this.width / 2, separatorY, 2, this.height - 100, 0x666666);
    this.container.add(separator);

    // 장비 보너스 제목
    const bonusTitleY = startY + lineHeight * 2 - 40;
    const bonusTitle = this.scene.add.text(rightX, bonusTitleY, '장비 보너스', {
      font: 'bold 16px Arial',
      fill: '#FFD700'
    });
    this.container.add(bonusTitle);

    // 장비 보너스 스탯
    let bonusY = startY + lineHeight * 4 - 50;
    [...basicStats, ...extendedStats].forEach(stat => {
      const text = this.scene.add.text(rightX, bonusY, `${stat.label}: 0`, {
        font: '12px Arial',
        fill: '#00FF00'
      });
      this.container.add(text);
      stat.bonusText = text;
      bonusY += lineHeight;
    });

    this.basicStats = basicStats;
    this.extendedStats = extendedStats;

    // 초기 업데이트
    this.updateStats();
  }

  /**
   * 스탯 증가
   */
  increaseStat(statKey) {
    if (this.player.spendStatPoint(statKey, 1)) {
      this.updateStats();
    }
  }

  /**
   * 스탯 업데이트
   */
  updateStats() {
    if (!this.player) return;

    // 스탯 포인트
    this.statPointText.setText(`⭐ 스탯 포인트: ${this.player.statPoints || 0}`);

    // 기본 스탯
    this.basicStats.forEach(stat => {
      let value = this.player.stats[stat.key] || 0;
      if (stat.maxKey) {
        const maxValue = this.player.stats[stat.maxKey] || 0;
        value = `${value} / ${maxValue}`;
      } else if (stat.suffix) {
        value = `${value}${stat.suffix}`;
      }
      stat.text.setText(`${stat.label}: ${value}`);
    });

    // 확장 스탯 (STR, DEX, INT, VIT)
    this.extendedStats.forEach(stat => {
      if (stat.text) {
        const value = this.player.stats[stat.key] || 0;
        stat.text.setText(`${stat.label}: ${value}`);
      }
    });

    // 장비 보너스
    const bonus = this.player.equipment ? this.player.equipment.getTotalStatBonus() : {};

    [...this.basicStats, ...this.extendedStats].forEach(stat => {
      let value = bonus[stat.key] || 0;
      if (value > 0) {
        if (stat.suffix) {
          value = `+${value}${stat.suffix}`;
        } else {
          value = `+${value}`;
        }
        stat.bonusText.setText(`${stat.label}: ${value}`);
        stat.bonusText.setColor('#00FF00');
      } else {
        stat.bonusText.setText(`${stat.label}: 0`);
        stat.bonusText.setColor('#666666');
      }
    });
  }

  /**
   * 이벤트 설정
   */
  setupEvents() {
    // 스탯 변경 이벤트
    this.player.scene.events.on('player:hp_changed', () => this.updateStats());
    this.player.scene.events.on('player:mp_changed', () => this.updateStats());
    this.player.scene.events.on('player:level_up', () => this.updateStats());
    this.player.scene.events.on('player:gold_changed', () => this.updateStats());
    this.player.scene.events.on('equipment:changed', () => this.updateStats());
    this.player.scene.events.on('player:stats_changed', () => this.updateStats());
  }

  /**
   * 표시
   */
  show() {
    this.container.setVisible(true);
    this.updateStats();
  }

  /**
   * 숨김
   */
  hide() {
    this.container.setVisible(false);
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
   * 파괴
   */
  destroy() {
    // 이벤트 리스너 제거
    this.player.scene.events.off('player:hp_changed');
    this.player.scene.events.off('player:mp_changed');
    this.player.scene.events.off('player:level_up');
    this.player.scene.events.off('player:gold_changed');
    this.player.scene.events.off('equipment:changed');

    if (this.container) {
      this.container.destroy();
      this.container = null;
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
        // 메뉴 위치 업데이트
        const minX = -this.width * 0.8;
        const maxX = this.scene.cameras.main.width - this.width * 0.2;
        const minY = -this.height * 0.8;
        const maxY = this.scene.cameras.main.height - this.height * 0.2;

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