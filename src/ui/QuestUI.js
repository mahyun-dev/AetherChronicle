/**
 * QuestUI - 퀘스트 목록 UI
 */
export class QuestUI extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    
    this.scene = scene;
    this.player = scene.player;
    this.isOpen = false;
    
    // UI 생성
    this.createUI();
    
    // 이벤트 리스너
    this.setupEventListeners();
    
    // 초기에는 숨김
    this.setVisible(false);
    
    scene.add.existing(this);
  }

  /**
   * UI 생성
   */
  createUI() {
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;
    
    // 화면 크기에 맞춰 동적 조정 (최대 1100x700, 최소 700x500)
    const uiWidth = Math.max(700, Math.min(1100, screenWidth * 0.85));
    const uiHeight = Math.max(500, Math.min(700, screenHeight * 0.92));
    const listWidth = uiWidth * 0.38; // 너비 증가
    const detailWidth = uiWidth * 0.58; // 너비 증가
    
    // 배경
    this.bg = this.scene.add.rectangle(centerX, centerY, uiWidth, uiHeight, 0x000000, 0.9);
    this.bg.setStrokeStyle(2, 0xFFD700);
    this.add(this.bg);
    
    // 제목
    const titleFontSize = Math.max(18, Math.min(24, screenWidth / 60));
    this.titleText = this.scene.add.text(centerX, centerY - uiHeight / 2 + 25, '퀘스트 목록 (L)', {
      font: `bold ${titleFontSize}px Arial`,
      fill: '#FFD700'
    });
    this.titleText.setOrigin(0.5);
    this.add(this.titleText);
    
    // 탭 (진행 중 / 완료 가능 / 가능 / 완료)
    this.currentTab = 'active'; // active, completable, available, completed
    this.createTabs(centerX, centerY, uiWidth, uiHeight);
    
    // 퀘스트 리스트 영역
    const listX = centerX - (listWidth + detailWidth) / 2 + listWidth / 2 + 60; // 오른쪽으로 이동
    const listY = centerY + 35; // 탭 아래에 적절한 간격으로 배치
    const listHeight = uiHeight * 0.72; // 높이 증가
    this.questListBg = this.scene.add.rectangle(listX, listY, listWidth, listHeight, 0x222222);
    this.add(this.questListBg);
    
    // 퀘스트 상세 영역
    const detailX = centerX + (detailWidth - listWidth) / 2 + 60; // 오른쪽으로 이동
    this.questDetailBg = this.scene.add.rectangle(detailX, listY, detailWidth - 10, listHeight, 0x1a1a1a);
    this.add(this.questDetailBg);
    
    // 퀘스트 리스트 항목들
    this.questItems = [];
    this.createQuestList(listX, centerY, uiWidth, uiHeight);
    
    // 퀘스트 상세 텍스트
    const detailFontSize = Math.max(12, Math.min(16, detailWidth / 25));
    this.questDetailText = this.scene.add.text(detailX - 100, centerY - uiHeight / 2 + 150, '', {
      font: `${detailFontSize}px Arial`,
      fill: '#FFFFFF',
      align: 'left',
      wordWrap: { width: detailWidth - 40 }
    });
    this.questDetailText.setOrigin(0.5, 0);
    this.add(this.questDetailText);
    
    // 버튼 영역
    const buttonSpacing = detailWidth / 3;
    const buttonY = listY + listHeight / 2 - 30;
    this.acceptButton = this.createButton(detailX + detailWidth / 2 - 70, buttonY, '수락', () => this.acceptSelectedQuest());
    this.add(this.acceptButton);
    
    this.completeButton = this.createButton(detailX, buttonY, '완료', () => this.completeSelectedQuest());
    this.add(this.completeButton);
    
    this.abandonButton = this.createButton(detailX + detailWidth / 2 - 70, buttonY, '포기', () => this.abandonSelectedQuest());
    this.add(this.abandonButton);
    
    // 닫기 버튼
    this.closeButton = this.createButton(centerX + uiWidth / 2 - 50, centerY - uiHeight / 2 + 20, 'X', () => this.close());
    this.add(this.closeButton);
    
    // 선택된 퀘스트
    this.selectedQuest = null;
    this.selectedQuestIndex = -1;
  }

  /**
   * 탭 생성
   */
  createTabs(centerX, centerY, uiWidth, uiHeight) {
    const tabSpacing = uiWidth * 0.22; // 4개 탭을 균등하게 배치
    const tabs = [
      { key: 'active', label: '진행 중', x: -tabSpacing * 1.5 },
      { key: 'completable', label: '완료 가능', x: -tabSpacing * 0.5 },
      { key: 'available', label: '수락 가능', x: tabSpacing * 0.5 },
      { key: 'completed', label: '완료', x: tabSpacing * 1.5 }
    ];
    
    this.tabButtons = [];
    
    tabs.forEach(tab => {
      const x = centerX + tab.x + 5;
      const y = centerY - uiHeight / 2 + 80; // 탭 좌표 동적 조정
      
      const tabWidth = uiWidth * 0.20;
      const tabHeight = 40;
      const bg = this.scene.add.rectangle(x, y, tabWidth, tabHeight, 0x444444);
      bg.setInteractive({ useHandCursor: true });
      
      const tabFontSize = Math.max(12, Math.min(16, tabWidth / 10));
      const text = this.scene.add.text(x, y, tab.label, {
        font: `bold ${tabFontSize}px Arial`,
        fill: '#FFFFFF'
      });
      text.setOrigin(0.5);
      
      bg.on('pointerover', () => {
        if (this.currentTab !== tab.key) {
          bg.setFillStyle(0x555555);
        }
      });
      
      bg.on('pointerout', () => {
        if (this.currentTab !== tab.key) {
          bg.setFillStyle(0x444444);
        }
      });
      
      bg.on('pointerdown', () => {
        this.switchTab(tab.key);
      });
      
      this.add(bg);
      this.add(text);
      
      this.tabButtons.push({ key: tab.key, bg, text });
    });
    
    // 초기 탭 선택
    this.updateTabStyle();
  }

  /**
   * 탭 전환
   */
  switchTab(tabKey) {
    this.currentTab = tabKey;
    this.updateTabStyle();
    this.updateQuestList();
  }

  /**
   * 탭 스타일 업데이트
   */
  updateTabStyle() {
    this.tabButtons.forEach(tab => {
      if (tab.key === this.currentTab) {
        tab.bg.setFillStyle(0xFFD700);
        tab.text.setColor('#000000');
      } else {
        tab.bg.setFillStyle(0x444444);
        tab.text.setColor('#FFFFFF');
      }
    });
  }

  /**
   * 퀘스트 리스트 생성
   */
  createQuestList(listX, centerY, uiWidth, uiHeight) {
    const listHeight = uiHeight * 0.72; // 실제 배경 높이와 맞춤
    const startY = centerY - listHeight / 2 + 30; // 리스트 시작 위치
    const itemHeight = 50; // 항목 높이 증가
    const maxItems = Math.floor((listHeight - 20) / itemHeight);
    
    for (let i = 0; i < maxItems; i++) {
      const itemY = startY + i * itemHeight;
      
      // 리스트 아이템 너비를 동적으로 계산
      const listWidth = uiWidth * 0.38; // 실제 배경 너비와 맞춤
      const itemYOffset = 35; // 세트 전체를 더 아래로 이동
      const bg = this.scene.add.rectangle(listX - 50, itemY + itemYOffset, listWidth - 120, itemHeight - 6, 0x333333);
      bg.setInteractive({ useHandCursor: true });
      
      // 폰트 크기 동적 조정
      const itemFontSize = Math.max(10, Math.min(15, listWidth / 22));
      const nameText = this.scene.add.text(listX - listWidth / 2 + 15, itemY - 6 + itemYOffset, '', {
        font: `bold ${itemFontSize}px Arial`,
        fill: '#FFFFFF'
      });
      nameText.setOrigin(0, 0.5);
      
      const infoFontSize = Math.max(8, Math.min(11, listWidth / 28));
      const infoText = this.scene.add.text(listX - listWidth / 2 + 15, itemY + 6 + itemYOffset, '', {
        font: `${infoFontSize}px Arial`,
        fill: '#AAAAAA'
      });
      infoText.setOrigin(0, 0.5);
      
      bg.on('pointerover', () => {
        bg.setFillStyle(0x444444);
      });
      
      bg.on('pointerout', () => {
        if (this.selectedQuestIndex !== i) {
          bg.setFillStyle(0x333333);
        }
      });
      
      bg.on('pointerdown', () => {
        this.selectQuest(i);
      });
      
      this.add(bg);
      this.add(nameText);
      this.add(infoText);
      
      this.questItems.push({ bg, nameText, infoText, quest: null });
    }
  }

  /**
   * 버튼 생성
   */
  createButton(x, y, text, callback) {
    const container = this.scene.add.container(x, y);
    
    const bg = this.scene.add.rectangle(0, 0, 100, 40, 0x4CAF50);
    bg.setInteractive({ useHandCursor: true });
    
    const buttonText = this.scene.add.text(0, 0, text, {
      font: 'bold 16px Arial',
      fill: '#FFFFFF'
    });
    buttonText.setOrigin(0.5);
    
    bg.on('pointerover', () => {
      bg.setFillStyle(0x5CBF60);
    });
    
    bg.on('pointerout', () => {
      bg.setFillStyle(0x4CAF50);
    });
    
    bg.on('pointerdown', () => {
      callback();
    });
    
    container.add(bg);
    container.add(buttonText);
    
    return container;
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 퀘스트 수락
    this.scene.events.on('quest:accepted', (quest) => {
      console.log('[QuestUI] 퀘스트 수락:', quest.name);
      this.updateQuestList();
      this.showNotification(`퀘스트 수락: ${quest.name}`, 0x4CAF50);
    });
    
    // 퀘스트 진행도
    this.scene.events.on('quest:progress', (quest, objective) => {
      console.log('[QuestUI] 퀘스트 진행:', quest.name, objective);
      if (this.isOpen) {
        this.updateQuestList();
        this.updateQuestDetail();
      }
    });
    
    // 퀘스트 완료
    this.scene.events.on('quest:completed', (quest) => {
      console.log('[QuestUI] 퀘스트 완료:', quest.name);
      this.updateQuestList();
      this.showNotification(`퀘스트 완료: ${quest.name}`, 0xFFD700);
    });
    
    // 퀘스트 해금
    this.scene.events.on('quest:unlocked', (quests) => {
      console.log('[QuestUI] 새 퀘스트 해금:', quests.length);
      this.updateQuestList();
    });
  }

  /**
   * 열기
   */
  open() {
    this.isOpen = true;
    this.setVisible(true);
    this.updateQuestList();
  }

  /**
   * 닫기
   */
  close() {
    this.isOpen = false;
    this.setVisible(false);
  }

  /**
   * 토글
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * 퀘스트 리스트 업데이트
   */
  updateQuestList() {
    if (!this.player || !this.player.questManager) return;
    
    let quests = [];
    
    switch (this.currentTab) {
      case 'active':
        quests = this.player.questManager.getActiveQuests().filter(q => !q.isAllObjectivesComplete());
        break;
      case 'completable':
        quests = this.player.questManager.getActiveQuests().filter(q => q.isAllObjectivesComplete());
        break;
      case 'available':
        quests = this.player.questManager.getAvailableQuests();
        break;
      case 'completed':
        quests = this.player.questManager.completedQuests;
        break;
    }
    
    // 리스트 항목 업데이트
    this.questItems.forEach((item, index) => {
      if (index < quests.length) {
        const quest = quests[index];
        item.quest = quest;
        
        item.nameText.setText(quest.name);
        item.infoText.setText(`Lv.${quest.level} | ${quest.type}`);
        
        item.bg.setVisible(true);
        item.nameText.setVisible(true);
        item.infoText.setVisible(true);
        
        // 완료 가능한 퀘스트는 금색 표시
        if (quest.isAllObjectivesComplete() && quest.status === 'active') {
          item.nameText.setColor('#FFD700');
        } else {
          item.nameText.setColor('#FFFFFF');
        }
      } else {
        item.quest = null;
        item.bg.setVisible(false);
        item.nameText.setVisible(false);
        item.infoText.setVisible(false);
      }
    });
    
    // 첫 번째 퀘스트 선택
    if (quests.length > 0) {
      this.selectQuest(0);
    } else {
      this.selectedQuest = null;
      this.selectedQuestIndex = -1;
      this.updateQuestDetail();
    }
  }

  /**
   * 퀘스트 선택
   */
  selectQuest(index) {
    // 이전 선택 해제
    if (this.selectedQuestIndex >= 0 && this.selectedQuestIndex < this.questItems.length) {
      this.questItems[this.selectedQuestIndex].bg.setFillStyle(0x333333);
    }
    
    // 새 선택
    this.selectedQuestIndex = index;
    this.selectedQuest = this.questItems[index].quest;
    
    if (this.selectedQuest) {
      this.questItems[index].bg.setFillStyle(0x555555);
      this.updateQuestDetail();
    }
  }

  /**
   * 퀘스트 상세 업데이트
   */
  updateQuestDetail() {
    if (!this.selectedQuest) {
      this.questDetailText.setText('선택된 퀘스트가 없습니다.');
      this.acceptButton.setVisible(false);
      this.completeButton.setVisible(false);
      this.abandonButton.setVisible(false);
      return;
    }
    
    const quest = this.selectedQuest;
    let text = `${quest.name}\n`;
    text += `레벨: ${quest.level} | 유형: ${quest.type}\n`;
    text += `의뢰인: ${quest.giver}\n\n`;
    text += `${quest.description}\n\n`;
    
    // 목표
    text += '목표:\n';
    quest.objectives.forEach(obj => {
      const progress = `${obj.current}/${obj.required}`;
      const done = obj.current >= obj.required ? '✓' : '○';
      text += `${done} ${obj.description} (${progress})\n`;
    });
    
    // 보상
    text += `\n보상:\n`;
    text += `- 경험치: ${quest.rewards.exp}\n`;
    text += `- 골드: ${quest.rewards.gold}\n`;
    if (quest.rewards.items && quest.rewards.items.length > 0) {
      text += `- 아이템:\n`;
      quest.rewards.items.forEach(item => {
        text += `  • ${item.name} x${item.quantity}\n`;
      });
    }
    
    this.questDetailText.setText(text);
    
    // 버튼 표시 여부
    this.acceptButton.setVisible(quest.status === 'available');
    this.completeButton.setVisible(quest.status === 'active' && quest.isAllObjectivesComplete());
    this.abandonButton.setVisible(quest.status === 'active');
  }

  /**
   * 선택한 퀘스트 수락
   */
  acceptSelectedQuest() {
    if (!this.selectedQuest || !this.player.questManager) return;
    
    const success = this.player.questManager.acceptQuest(this.selectedQuest.id);
    if (success) {
      console.log('[QuestUI] 퀘스트 수락 성공:', this.selectedQuest.name);
      // UI 업데이트
      this.updateQuestList();
    } else {
      console.warn('[QuestUI] 퀘스트 수락 실패:', this.selectedQuest.name);
    }
  }

  /**
   * 선택한 퀘스트 완료
   */
  completeSelectedQuest() {
    if (!this.selectedQuest || !this.player.questManager) return;
    
    const success = this.player.questManager.completeQuest(this.selectedQuest.id);
    if (success) {
      console.log('[QuestUI] 퀘스트 완료 성공:', this.selectedQuest.name);
      // UI 업데이트
      this.updateQuestList();
    } else {
      console.warn('[QuestUI] 퀘스트 완료 실패:', this.selectedQuest.name);
    }
  }

  /**
   * 선택한 퀘스트 포기
   */
  abandonSelectedQuest() {
    if (!this.selectedQuest || !this.player.questManager) return;
    
    // 퀘스트 포기 기능 (추후 구현)
    console.log('[QuestUI] 퀘스트 포기:', this.selectedQuest.name);
    this.showNotification('퀘스트 포기 기능은 준비 중입니다.', 0xFF5555);
  }

  /**
   * 알림 표시
   */
  showNotification(message, color = 0xFFFFFF) {
    const centerX = this.scene.cameras.main.width / 2;
    const y = 100;
    
    const text = this.scene.add.text(centerX, y, message, {
      font: 'bold 18px Arial',
      fill: `#${color.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 3
    });
    text.setOrigin(0.5);
    text.setDepth(10000);
    
    this.scene.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }

  /**
   * 정리
   */
  destroy() {
    this.scene.events.off('quest:accepted');
    this.scene.events.off('quest:progress');
    this.scene.events.off('quest:completed');
    this.scene.events.off('quest:unlocked');
    super.destroy();
  }
}
