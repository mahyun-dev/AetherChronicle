import Phaser from 'phaser';
import { fuseSkills } from '../entities/FusionLogic.js';

/**
 * FusionUI - 융합술사 스킬 융합 UI
 */
export class FusionUI {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    
    this.isOpen = false;
    this.container = null;
    this.skillSelectorElements = [];
    this.skillSelectorContainer = null;
    
    // 융합 레시피 로드
    this.fusionRecipes = this.loadFusionRecipes();
    
    // 슬롯 데이터
    this.firstSlot = null;
    this.secondSlot = null;
    this.resultNameText = null;
    this.resultDescText = null;
    this.fuseBtn = null;
  }

  /**
   * 융합 레시피 데이터 로드
   */
  loadFusionRecipes() {
    try {
      // DataManager에서 융합 레시피 로드
      if (this.scene.dataManager && typeof this.scene.dataManager.getFusionRecipes === 'function') {
        return this.scene.dataManager.getFusionRecipes();
      }
      // GameScene의 dataManager 확인
      const gameScene = this.scene.scene ? this.scene.scene.get('GameScene') : null;
      if (gameScene && gameScene.dataManager && typeof gameScene.dataManager.getFusionRecipes === 'function') {
        return gameScene.dataManager.getFusionRecipes();
      }
      // 임시 데이터
      return [
        {
          ingredients: ["속성 탄환", "마력 장벽"],
          result: "fusion_magic_barrier",
          name: "마력 보호막",
          description: "마력을 실은 보호막으로 물리와 마법 공격을 모두 막음"
        },
        {
          ingredients: ["속성 탄환", "불안정한 파동"],
          result: "fusion_elemental_wave",
          name: "원소 파동",
          description: "다양한 속성의 파동을 동시에 발사하여 적을 혼란시킴"
        },
        {
          ingredients: ["마력 장벽", "불안정한 파동"],
          result: "fusion_barrier_wave",
          name: "장벽 파동",
          description: "파동을 장벽 형태로 발사하여 넓은 범위를 보호"
        }
      ];
    } catch (error) {
      console.warn('[FusionUI] 융합 레시피 로드 실패:', error);
      return [];
    }
  }

  /**
   * UI 토글
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
    this.create();
    
    // 이벤트 리스너 등록
    this.scene.input.keyboard.on('keydown-ESC', this.onEscapeKey, this);
    this.scene.input.keyboard.on('keydown-R', this.onRKey, this);
  }

  /**
   * UI 닫기
   */
  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    
    this.closeSkillSelector();
    
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
    
    // 이벤트 리스너 제거
    this.scene.input.keyboard.off('keydown-ESC', this.onEscapeKey, this);
    this.scene.input.keyboard.off('keydown-R', this.onRKey, this);
  }

  /**
   * ESC 키 핸들러
   */
  onEscapeKey() {
    if (this.isOpen) {
      this.close();
    }
  }

  /**
   * R 키 핸들러
   */
  onRKey() {
    if (this.isOpen && this.skillSelectorElements.length > 0) {
      this.closeSkillSelector();
    }
  }

  /**
   * UI 생성
   */
  create() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // 메인 컨테이너
    this.container = this.scene.add.container(width / 2, height / 2);
    this.container.setDepth(1000);
    this.container.setScrollFactor(1);

    // 배경
    const bg = this.scene.add.rectangle(0, 0, 800, 600, 0x1a1a2e, 0.95);
    bg.setStrokeStyle(3, 0xFFD700);
    this.container.add(bg);

    // 제목
    const title = this.scene.add.text(0, -270, '🔮 원소 융합', {
      font: 'bold 28px Arial',
      fill: '#FFD700'
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // 닫기 버튼
    const closeBtn = this.scene.add.text(370, -270, '✕', {
      font: 'bold 24px Arial',
      fill: '#FFFFFF'
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.close());
    closeBtn.on('pointerover', () => closeBtn.setColor('#FF0000'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#FFFFFF'));
    this.container.add(closeBtn);

    // 설명 텍스트
    const desc = this.scene.add.text(0, -230,
      '두 개의 스킬을 선택하여 새로운 융합 스킬을 생성하세요.\n융합된 스킬은 영구적으로 사용할 수 있습니다.',
      {
        font: '16px Arial',
        fill: '#FFFFFF',
        align: 'center',
        wordWrap: { width: 700 }
      }
    );
    desc.setOrigin(0.5);
    this.container.add(desc);

    // 스킬 슬롯 생성
    this.createSkillSlots();

    // 결과 영역 생성
    this.createResultArea();

    // 융합 버튼 생성
    this.createFuseButton();

    // 초기화
    this.clearSelection();
    this.updateFusionResult();
  }

  /**
   * 스킬 슬롯 생성
   */
  createSkillSlots() {
    // 왼쪽 슬롯
    this.createSkillSlot(-250, -100, '첫 번째 스킬', 'first');
    // 오른쪽 슬롯
    this.createSkillSlot(250, -100, '두 번째 스킬', 'second');
  }

  /**
   * 개별 스킬 슬롯 생성
   */
  createSkillSlot(x, y, label, slotKey) {
    // 슬롯 배경
    const slotBg = this.scene.add.rectangle(x, y, 180, 200, 0x333333, 0.8);
    slotBg.setStrokeStyle(2, 0xFFD700);
    slotBg.setInteractive({ useHandCursor: true });
    slotBg.on('pointerdown', () => this.showSkillSelector(slotKey));
    this.container.add(slotBg);

    // 라벨
    const slotLabel = this.scene.add.text(x, y - 90, label, {
      font: 'bold 14px Arial',
      fill: '#FFD700'
    });
    slotLabel.setOrigin(0.5);
    this.container.add(slotLabel);

    // 아이콘 영역
    const iconBg = this.scene.add.rectangle(x, y - 30, 80, 80, 0x000000, 0.5);
    this.container.add(iconBg);

    // 이름 텍스트
    const nameText = this.scene.add.text(x, y + 60, '선택하세요', {
      font: '12px Arial',
      fill: '#AAAAAA',
      align: 'center',
      wordWrap: { width: 160 }
    });
    nameText.setOrigin(0.5);
    this.container.add(nameText);

    // 슬롯 데이터 저장
    this[slotKey + 'Slot'] = {
      bg: slotBg,
      iconBg: iconBg,
      nameText: nameText,
      selectedSkill: null
    };
  }

  /**
   * 결과 표시 영역 생성
   */
  createResultArea() {
    // 결과 배경
    const resultBg = this.scene.add.rectangle(0, 50, 300, 100, 0x222222, 0.8);
    resultBg.setStrokeStyle(2, 0xFFD700);
    this.container.add(resultBg);

    // 결과 라벨
    const resultLabel = this.scene.add.text(0, 10, '융합 결과', {
      font: 'bold 16px Arial',
      fill: '#FFD700'
    });
    resultLabel.setOrigin(0.5);
    this.container.add(resultLabel);

    // 결과 이름
    this.resultNameText = this.scene.add.text(0, 35, '스킬을 선택하세요', {
      font: '14px Arial',
      fill: '#FFFFFF'
    });
    this.resultNameText.setOrigin(0.5);
    this.container.add(this.resultNameText);

    // 결과 설명
    this.resultDescText = this.scene.add.text(0, 55, '', {
      font: '12px Arial',
      fill: '#AAAAAA',
      align: 'center',
      wordWrap: { width: 280 }
    });
    this.resultDescText.setOrigin(0.5);
    this.container.add(this.resultDescText);
  }

  /**
   * 융합 버튼 생성
   */
  createFuseButton() {
    this.fuseBtn = this.scene.add.rectangle(0, 200, 150, 50, 0x4CAF50, 0.8);
    this.fuseBtn.setStrokeStyle(2, 0xFFFFFF);
    this.fuseBtn.setInteractive({ useHandCursor: true });
    this.fuseBtn.on('pointerdown', () => this.attemptFusion());
    this.fuseBtn.on('pointerover', () => this.fuseBtn.setFillStyle(0x66BB6A, 0.9));
    this.fuseBtn.on('pointerout', () => this.fuseBtn.setFillStyle(0x4CAF50, 0.8));
    this.container.add(this.fuseBtn);

    const fuseText = this.scene.add.text(0, 200, '융합하기', {
      font: 'bold 18px Arial',
      fill: '#FFFFFF'
    });
    fuseText.setOrigin(0.5);
    this.container.add(fuseText);
  }

  /**
   * 스킬 선택기 표시
   */
  showSkillSelector(slotKey) {
    // 기존 선택기 닫기
    this.closeSkillSelector();

    // 슬롯 비활성화
    this.disableSlotInteractions();

    const availableSkills = this.getAllPlayerSkills();

    if (!availableSkills || availableSkills.length === 0) {
      console.log('[FusionUI] 선택 가능한 스킬이 없습니다.');
      this.showNotification('사용 가능한 스킬이 없습니다');
      return;
    }

    // 스킬 선택기 컨테이너 생성
    this.skillSelectorContainer = this.scene.add.container(0, 0);
    this.skillSelectorContainer.setDepth(1300);
    this.skillSelectorContainer.setScrollFactor(1);
    this.skillSelectorContainer.setVisible(true);

    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;
    this.skillSelectorContainer.setPosition(centerX, centerY);

    // 배경 (스크롤 영역 포함)
    const selectorBg = this.scene.add.rectangle(0, 0, 420, 320, 0x000000, 0.9);
    selectorBg.setStrokeStyle(2, 0xFFD700);
    this.skillSelectorElements.push(selectorBg);
    this.skillSelectorContainer.add(selectorBg);

    // 제목
    const selectorTitle = this.scene.add.text(0, -140, '스킬 선택', {
      font: 'bold 20px Arial',
      fill: '#FFD700'
    });
    selectorTitle.setOrigin(0.5);
    this.skillSelectorElements.push(selectorTitle);
    this.skillSelectorContainer.add(selectorTitle);

    // 스킬 리스트 컨테이너 (스크롤 가능)
    const skillListContainer = this.scene.add.container(0, 0);
    this.skillSelectorElements.push(skillListContainer);
    this.skillSelectorContainer.add(skillListContainer);

    // 스킬 리스트 배경 (스크롤 영역)
    const listBg = this.scene.add.rectangle(0, -10, 380, 240, 0x111111, 0.8);
    listBg.setStrokeStyle(1, 0x666666);
    skillListContainer.add(listBg);

    // 마스크 생성 (스크롤 영역 제한)
    const maskShape = this.scene.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(centerX - 190, centerY - 130, 380, 240);
    const mask = maskShape.createGeometryMask();
    skillListContainer.setMask(mask);
    this.skillSelectorElements.push(maskShape);

    // 스킬 버튼들
    const buttonHeight = 35;
    const maxVisibleButtons = Math.floor(240 / buttonHeight);
    let scrollOffset = 0;
    const maxScroll = Math.max(0, availableSkills.length - maxVisibleButtons);

    const createSkillButtons = () => {
      // 기존 버튼들 제거 (배경 제외)
      skillListContainer.each(child => {
        if (child !== listBg) {
          child.destroy();
        }
      });

      availableSkills.forEach((skill, index) => {
        const btnY = -110 + (index - scrollOffset) * buttonHeight;
        
        // 스크롤 범위 내에 있는 버튼만 생성
        if (btnY > -130 && btnY < 110) {
          const skillBtn = this.scene.add.rectangle(0, btnY, 360, 30, 0x333333, 0.8);
          skillBtn.setStrokeStyle(1, 0xFFFFFF);
          skillBtn.setInteractive({ useHandCursor: true });
          skillBtn.on('pointerdown', () => {
            this.selectSkillForSlot(slotKey, skill);
            this.closeSkillSelector();
          });
          skillBtn.on('pointerover', () => skillBtn.setFillStyle(0x555555, 0.9));
          skillBtn.on('pointerout', () => skillBtn.setFillStyle(0x333333, 0.8));

          const skillText = this.scene.add.text(0, btnY, skill.name, {
            font: '14px Arial',
            fill: '#FFFFFF'
          });
          skillText.setOrigin(0.5);

          skillListContainer.add(skillBtn);
          skillListContainer.add(skillText);
        }
      });
    };

    createSkillButtons();

    // 스크롤바
    const scrollbarBg = this.scene.add.rectangle(185, -10, 8, 240, 0x333333, 0.5);
    scrollbarBg.setStrokeStyle(1, 0x666666);
    this.skillSelectorElements.push(scrollbarBg);
    this.skillSelectorContainer.add(scrollbarBg);

    const scrollbarHeight = Math.max(20, (maxVisibleButtons / availableSkills.length) * 240);
    const scrollbar = this.scene.add.rectangle(185, -10 - (240 - scrollbarHeight) / 2 + (scrollOffset / maxScroll) * (240 - scrollbarHeight), 6, scrollbarHeight, 0xAAAAAA, 0.8);
    scrollbar.setInteractive({ useHandCursor: true });
    this.skillSelectorElements.push(scrollbar);
    this.skillSelectorContainer.add(scrollbar);

    // 마우스 휠 스크롤
    const wheelHandler = (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      if (deltaY > 0 && scrollOffset < maxScroll) {
        scrollOffset++;
      } else if (deltaY < 0 && scrollOffset > 0) {
        scrollOffset--;
      }
      createSkillButtons();
      scrollbar.y = -10 - (240 - scrollbarHeight) / 2 + (scrollOffset / maxScroll) * (240 - scrollbarHeight);
    };

    this.scene.input.on('wheel', wheelHandler);

    // 스크롤바 드래그
    let isDraggingScrollbar = false;
    scrollbar.on('pointerdown', (pointer) => {
      isDraggingScrollbar = true;
    });

    this.scene.input.on('pointermove', (pointer) => {
      if (isDraggingScrollbar) {
        const localY = pointer.y - centerY + 10;
        const scrollRatio = Math.max(0, Math.min(1, (localY + (240 - scrollbarHeight) / 2) / (240 - scrollbarHeight)));
        scrollOffset = Math.round(scrollRatio * maxScroll);
        createSkillButtons();
        scrollbar.y = -10 - (240 - scrollbarHeight) / 2 + (scrollOffset / maxScroll) * (240 - scrollbarHeight);
      }
    });

    this.scene.input.on('pointerup', () => {
      isDraggingScrollbar = false;
    });

    // 닫기 버튼
    const closeBtn = this.scene.add.text(190, -140, '✕', {
      font: 'bold 20px Arial',
      fill: '#FFFFFF'
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      this.scene.input.off('wheel', wheelHandler);
      this.closeSkillSelector();
    });
    this.skillSelectorElements.push(closeBtn);
    this.skillSelectorContainer.add(closeBtn);

    // 닫기 시 이벤트 정리
    this.closeSkillSelectorCallback = () => {
      this.scene.input.off('wheel', wheelHandler);
    };
  }

  /**
   * 알림 표시
   */
  showNotification(message) {
    const notification = this.scene.add.text(0, 0, message, {
      font: '16px Arial',
      fill: '#FF0000'
    });
    notification.setOrigin(0.5);
    notification.setDepth(1200);
    this.skillSelectorElements.push(notification);
    this.skillSelectorContainer.add(notification);
    this.skillSelectorContainer.setVisible(true);

    this.scene.time.delayedCall(2000, () => {
      if (notification && notification.active) {
        notification.destroy();
      }
      const index = this.skillSelectorElements.indexOf(notification);
      if (index > -1) {
        this.skillSelectorElements.splice(index, 1);
      }
      this.skillSelectorContainer.setVisible(false);
    });
  }

  /**
   * 플레이어의 모든 스킬 목록 가져오기
   */
  getAllPlayerSkills() {
    const skills = [];

    try {
      // 보유 스킬
      if (this.player && this.player.retainedSkills) {
        this.player.retainedSkills.forEach(skill => {
          if (skill && skill.name && skill.id) {
            skills.push({
              id: skill.id,
              name: skill.name,
              description: skill.description || '',
              type: skill.type || 'melee'
            });
          }
        });
      }

      // 융합술사 기본 스킬
      if (this.player && this.player.characterClass === 'fusionist') {
        const fusionistSkills = [
          { id: 'fusionist_base_1', name: '속성 탄환', description: '선택한 기본 속성(화염, 냉기, 전격) 탄환 발사, 110% 피해', type: 'projectile' },
          { id: 'fusionist_barrier', name: '마력 장벽', description: '2초간 전방의 투사체를 막고 100% 피해 흡수', type: 'barrier' },
          { id: 'fusionist_wave', name: '불안정한 파동', description: '주변 적을 밀쳐내며 130% 피해, 융합 재료로 사용 시 효율 증가', type: 'aoe' },
          { id: 'fusionist_ultimate', name: '원소 융합', description: '[전용 UI 오픈] 슬롯에 장착된 스킬 2개를 조합하여 새로운 스킬 생성', type: 'system' }
        ];
        fusionistSkills.forEach(skill => {
          if (!skills.some(s => s.id === skill.id)) {
            skills.push(skill);
          }
        });
      }

      // 융합술사 테스트용 도적,궁수,전사 스킬 (skills.json에서 불러오기)
      if (this.player && this.player.characterClass === 'fusionist') {
        const allClassSkills = [
          { id: 'warrior_skill_1', name: '돌진 베기', description: '전방 300px 돌진하며 경로상 적에게 120% 공격력 피해', type: 'dash' },
          { id: 'warrior_skill_2', name: '방어 자세', description: '3초간 받는 피해 60% 감소, 이동 속도 50% 감소', type: 'buff' },
          { id: 'warrior_skill_3', name: '회전 베기', description: '주변 250px 범위에 150% 광역 피해', type: 'aoe' },
          { id: 'warrior_skill_ultimate', name: '파멸의 일격', description: '전방 직선으로 강력한 충격파 발사, 400% 피해 + 2초 기절', type: 'ranged' },
          { id: 'archer_skill_1', name: '관통 화살', description: '직선으로 관통하는 화살 발사, 130% 피해', type: 'ranged' },
          { id: 'archer_skill_2', name: '후퇴 사격', description: '후방으로 도약하며 전방에 3발의 화살 발사 (각 80% 피해)', type: 'ranged' },
          { id: 'archer_skill_3', name: '독화살', description: '독 화살 발사, 명중 시 100% 피해 + 5초간 초당 20 독 피해', type: 'ranged' },
          { id: 'archer_skill_ultimate', name: '폭풍우 화살', description: '하늘에서 화살 폭풍 발생, 8초간 400px 범위 내 적에게 초당 100 피해', type: 'aoe' },
          { id: 'rogue_skill_1', name: '그림자 밟기', description: '대상의 뒤로 순간이동 + 150% 백어택 피해', type: 'dash' },
          { id: 'rogue_skill_2', name: '독 칠하기', description: '무기에 독을 칠해 5초간 지속 피해 + 이동 속도 감소', type: 'buff' },
          { id: 'rogue_skill_3', name: '그림자 베기', description: '주변 150px 범위에 그림자 베기로 250% 피해', type: 'aoe' },
          { id: 'rogue_skill_ultimate', name: '환영 분신', description: '분신을 생성하여 주변 적들에게 300% 피해 + 1초 기절', type: 'aoe' }
        ];
        allClassSkills.forEach(skill => {
          if (!skills.some(s => s.id === skill.id)) {
            skills.push(skill);
          }
        });
      }

      // 융합 스킬
      if (this.player && this.player.retainedSkills) {
        this.player.retainedSkills.forEach(skill => {
          if (skill && skill.name && skill.id && !skills.some(s => s.id === skill.id)) {
            skills.push({
              id: skill.id,
              name: skill.name,
              description: skill.description || '',
              type: skill.type || 'fusion'
            });
          }
        });
      }

      // 장착된 스킬
      if (this.player && this.player.skills) {
        Object.values(this.player.skills).forEach(skill => {
          if (skill && skill.name && skill.id && !skills.some(s => s.id === skill.id)) {
            skills.push({
              id: skill.id,
              name: skill.name,
              description: skill.description || '',
              type: skill.type || 'melee'
            });
          }
        });
      }

    } catch (error) {
      console.warn('[FusionUI] 스킬 로드 중 오류:', error);
    }

    return skills;
  }

  /**
   * 슬롯에 스킬 선택
   */
  selectSkillForSlot(slotKey, skill) {
    const slot = this[slotKey + 'Slot'];
    if (!slot) return;

    slot.selectedSkill = skill;
    slot.nameText.setText(skill.name);
    slot.nameText.setColor('#FFFFFF');

    this.updateFusionResult();
  }

  /**
   * 융합 결과 업데이트
   */
  updateFusionResult() {
    const firstSkill = this.firstSlot?.selectedSkill;
    const secondSkill = this.secondSlot?.selectedSkill;

    if (!firstSkill || !secondSkill) {
      this.resultNameText.setText('두 스킬을 모두 선택하세요');
      this.resultDescText.setText('');
      return;
    }

    const recipe = this.findFusionRecipe(firstSkill.name, secondSkill.name);

    if (recipe) {
      this.resultNameText.setText(recipe.name);
      this.resultDescText.setText(recipe.description);
      this.resultNameText.setColor('#FFD700');
    } else {
      this.resultNameText.setText('융합 불가능');
      this.resultDescText.setText('선택한 스킬 조합으로는 융합할 수 없습니다.');
      this.resultNameText.setColor('#FF6B6B');
    }
  }

  /**
   * 융합 레시피 찾기
   */
  findFusionRecipe(skill1Name, skill2Name) {
    return this.fusionRecipes.find(recipe => {
      const ingredients = recipe.ingredients;
      return ingredients.includes(skill1Name) && ingredients.includes(skill2Name);
    });
  }

  /**
   * 융합 시도
   */
  attemptFusion() {
    const firstSkill = this.firstSlot?.selectedSkill;
    const secondSkill = this.secondSlot?.selectedSkill;

    if (!firstSkill || !secondSkill) {
      console.log('[FusionUI] 두 스킬을 모두 선택해야 합니다.');
      return;
    }

    const fusedSkill = fuseSkills(firstSkill, secondSkill);
    
    if (!fusedSkill) {
      console.log('[FusionUI] 융합에 실패했습니다.');
      return;
    }

    this.performFusion(fusedSkill);
  }

  /**
   * 융합 실행
   */
  performFusion(fusedSkill) {
    console.log('[FusionUI] 융합 실행:', fusedSkill.name);

    if (!this.player.retainedSkills) {
      this.player.retainedSkills = [];
    }
    this.player.retainedSkills.push(fusedSkill);

    // 성공 메시지
    const successText = this.scene.add.text(0, 250, `🎉 ${fusedSkill.name} 스킬 생성 완료!`, {
      font: 'bold 20px Arial',
      fill: '#FFD700'
    });
    successText.setOrigin(0.5);
    successText.setDepth(1100);
    this.container.add(successText);

    this.scene.time.delayedCall(2000, () => {
      successText.destroy();
    });

    this.clearSelection();
  }

  /**
   * 선택 초기화
   */
  clearSelection() {
    if (this.firstSlot) {
      this.firstSlot.selectedSkill = null;
      this.firstSlot.nameText.setText('선택하세요');
      this.firstSlot.nameText.setColor('#AAAAAA');
    }

    if (this.secondSlot) {
      this.secondSlot.selectedSkill = null;
      this.secondSlot.nameText.setText('선택하세요');
      this.secondSlot.nameText.setColor('#AAAAAA');
    }

    this.resultNameText.setText('스킬을 선택하세요');
    this.resultDescText.setText('');
  }

  /**
   * 스킬 선택기 닫기
   */
  closeSkillSelector() {
    // 이벤트 정리 콜백 실행
    if (this.closeSkillSelectorCallback) {
      this.closeSkillSelectorCallback();
      this.closeSkillSelectorCallback = null;
    }

    this.skillSelectorElements.forEach(element => {
      if (element && element.active) {
        element.destroy();
      }
    });
    this.skillSelectorElements = [];

    if (this.skillSelectorContainer) {
      this.skillSelectorContainer.setVisible(false);
    }

    this.enableSlotInteractions();
  }

  /**
   * 슬롯 비활성화
   */
  disableSlotInteractions() {
    if (this.firstSlot && this.firstSlot.bg && this.firstSlot.bg.active) {
      this.firstSlot.bg.disableInteractive();
    }
    if (this.secondSlot && this.secondSlot.bg && this.secondSlot.bg.active) {
      this.secondSlot.bg.disableInteractive();
    }
  }

  /**
   * 슬롯 활성화
   */
  enableSlotInteractions() {
    if (this.firstSlot && this.firstSlot.bg && this.firstSlot.bg.active) {
      this.firstSlot.bg.setInteractive({ useHandCursor: true });
    }
    if (this.secondSlot && this.secondSlot.bg && this.secondSlot.bg.active) {
      this.secondSlot.bg.setInteractive({ useHandCursor: true });
    }
  }

  /**
   * UI 닫기 (hide 별칭)
   */
  hide() {
    this.close();
  }

  /**
   * UI 업데이트
   */
  update() {
    if (this.isOpen) {
      const camera = this.scene.cameras.main;
      const width = camera.width;
      const height = camera.height;
      this.container.setPosition(camera.scrollX + width / 2, camera.scrollY + height / 2);
    }

    if (this.skillSelectorContainer && this.skillSelectorContainer.visible) {
      const camera = this.scene.cameras.main;
      const width = camera.width;
      const height = camera.height;
      this.skillSelectorContainer.setPosition(camera.scrollX + width / 2, camera.scrollY + height / 2);
    }
  }
}
